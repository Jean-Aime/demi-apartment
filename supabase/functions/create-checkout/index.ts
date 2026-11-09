import { corsHeaders, getServiceClient, jsonResponse } from '../_shared/payment.ts';

interface CheckoutRequest {
  apartmentSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes?: string;
}

interface FlutterwavePaymentResponse {
  status?: string;
  data?: { link?: string };
}

function isFlutterwavePaymentResponse(value: unknown): value is FlutterwavePaymentResponse {
  if (!value || typeof value !== 'object') return false;
  const data = (value as Record<string, unknown>).data;
  if (data === undefined) return true;
  if (typeof data !== 'object' || data === null) return false;
  const link = (data as Record<string, unknown>).link;
  return link === undefined || typeof link === 'string';
}

function isCheckoutRequest(value: unknown): value is CheckoutRequest {
  if (!value || typeof value !== 'object') return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.apartmentSlug === 'string' &&
    typeof input.checkIn === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.checkIn) &&
    typeof input.checkOut === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.checkOut) &&
    typeof input.guests === 'number' &&
    Number.isInteger(input.guests) &&
    typeof input.guestName === 'string' &&
    typeof input.guestEmail === 'string' &&
    typeof input.guestPhone === 'string' &&
    (input.notes === undefined || typeof input.notes === 'string')
  );
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, headers);

  try {
    const body: unknown = await request.json();
    if (!isCheckoutRequest(body)) return jsonResponse({ error: 'Booking details are incomplete.' }, 400, headers);

    const secretKey = Deno.env.get('FLW_SECRET_KEY');
    const siteUrl = Deno.env.get('SITE_URL')?.replace(/\/$/, '');
    if (!secretKey || !siteUrl) throw new Error('Checkout is not configured.');

    const client = getServiceClient();
    const { data, error } = await client.rpc('create_booking_payment_hold', {
      p_apartment_slug: body.apartmentSlug,
      p_check_in: body.checkIn,
      p_check_out: body.checkOut,
      p_guests: body.guests,
      p_guest_name: body.guestName,
      p_guest_email: body.guestEmail,
      p_guest_phone: body.guestPhone,
      p_notes: body.notes ?? '',
    });

    if (error) {
      if (error.code === '23P01') {
        return jsonResponse({ error: 'Those dates are no longer available. Please choose another stay.' }, 409, headers);
      }
      if (error.code === '22023') return jsonResponse({ error: error.message }, 400, headers);
      if (error.code === '22007' || error.code === '22008') {
        return jsonResponse({ error: 'Choose valid check-in and check-out dates.' }, 400, headers);
      }
      console.error('Booking hold creation failed:', error.code);
      return jsonResponse({ error: 'We could not reserve these dates. Please try again.' }, 500, headers);
    }

    const hold = Array.isArray(data) ? data[0] : null;
    if (!hold || typeof hold.booking_id !== 'string' || typeof hold.tx_ref !== 'string') {
      throw new Error('Booking hold service returned an invalid response.');
    }
    const releaseHold = async () => {
      const { error: releaseError } = await client
        .from('booking_requests')
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq('id', hold.booking_id)
        .eq('status', 'awaiting_payment');
      if (releaseError) console.error('Could not release an unused payment hold:', releaseError.code);
    };

    let paymentResponse: Response;
    try {
      paymentResponse = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: hold.tx_ref,
          amount: Number(hold.amount).toFixed(2),
          currency: hold.currency,
          redirect_url: `${siteUrl}/booking/confirmation`,
          customer: {
            email: body.guestEmail,
            name: body.guestName,
            phonenumber: body.guestPhone,
          },
          customizations: {
            title: 'DEMI APARTMENT',
            description: `Stay at ${hold.apartment_name}`,
          },
          configurations: { session_duration: 15, max_retry_attempt: 3 },
        }),
      });
    } catch {
      await releaseHold();
      return jsonResponse({ error: 'Secure checkout could not be reached. Please try again.' }, 502, headers);
    }

    let paymentPayload: FlutterwavePaymentResponse;
    try {
      const payload: unknown = await paymentResponse.json();
      if (!isFlutterwavePaymentResponse(payload)) throw new Error('Invalid checkout response.');
      paymentPayload = payload;
    } catch {
      await releaseHold();
      return jsonResponse({ error: 'Secure checkout returned an invalid response. Please try again.' }, 502, headers);
    }
    const checkoutUrl = paymentPayload.data?.link;
    if (!paymentResponse.ok || paymentPayload.status !== 'success' || !checkoutUrl) {
      await releaseHold();
      console.error('Flutterwave checkout creation failed:', paymentResponse.status);
      return jsonResponse({ error: 'Secure checkout could not be started. Please try again.' }, 502, headers);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(checkoutUrl);
    } catch {
      await releaseHold();
      return jsonResponse({ error: 'Secure checkout returned an invalid link. Please try again.' }, 502, headers);
    }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'checkout.flutterwave.com') {
      await releaseHold();
      return jsonResponse({ error: 'Secure checkout returned an untrusted link. Please contact the team.' }, 502, headers);
    }

    return jsonResponse({
      checkoutUrl: parsedUrl.toString(),
      reference: hold.tx_ref,
      amount: Number(hold.amount),
      currency: hold.currency,
      apartmentName: hold.apartment_name,
      holdExpiresAt: hold.hold_expires_at,
    }, 200, headers);
  } catch (error) {
    console.error('Checkout request failed:', error instanceof Error ? error.message : 'Unexpected error');
    return jsonResponse({ error: 'Secure checkout is temporarily unavailable. Please try again.' }, 500, headers);
  }
});
