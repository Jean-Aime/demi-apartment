import { corsHeaders, getServiceClient, jsonResponse } from '../_shared/payment.ts';

interface PreparedCheckout {
  booking_id: string;
  tx_ref: string;
  amount: number | string;
  currency: 'USD' | 'EUR';
  apartment_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  hold_expires_at: string;
  checkout_url: string | null;
}

interface FlutterwaveResponse {
  status?: string;
  data?: { link?: string };
}

function isCheckoutToken(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isFlutterwaveResponse(value: unknown): value is FlutterwaveResponse {
  if (!value || typeof value !== 'object') return false;
  const data = (value as Record<string, unknown>).data;
  return data === undefined || (
    typeof data === 'object'
    && data !== null
    && ((data as Record<string, unknown>).link === undefined || typeof (data as Record<string, unknown>).link === 'string')
  );
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, headers);

  try {
    const body: unknown = await request.json();
    const checkoutToken = body && typeof body === 'object'
      ? (body as Record<string, unknown>).checkoutToken
      : undefined;
    if (!isCheckoutToken(checkoutToken)) {
      return jsonResponse({ error: 'This reservation link is invalid.' }, 400, headers);
    }

    const secretKey = Deno.env.get('FLW_SECRET_KEY');
    const siteUrlValue = Deno.env.get('SITE_URL');
    if (!secretKey || !siteUrlValue) {
      return jsonResponse({ error: 'Secure online payment is not configured yet. No payment has been taken.' }, 503, headers);
    }

    const siteUrl = new URL(siteUrlValue);
    if (siteUrl.protocol !== 'https:' && siteUrl.hostname !== 'localhost' && siteUrl.hostname !== '127.0.0.1') {
      return jsonResponse({ error: 'Secure online payment requires an HTTPS website address.' }, 503, headers);
    }

    const client = getServiceClient();
    const { data, error } = await client.rpc('prepare_flutterwave_checkout', {
      p_checkout_token: checkoutToken,
    });
    if (error) {
      if (error.code === '22023') return jsonResponse({ error: error.message }, 400, headers);
      console.error('Could not prepare secure checkout:', error.code);
      return jsonResponse({ error: 'We could not prepare secure checkout. Please refresh your reservation.' }, 500, headers);
    }

    const prepared = Array.isArray(data) ? data[0] as PreparedCheckout | undefined : undefined;
    if (!prepared || typeof prepared.booking_id !== 'string' || typeof prepared.tx_ref !== 'string') {
      console.error('Secure checkout preparation returned an invalid response.');
      return jsonResponse({ error: 'We could not prepare secure checkout. Please refresh your reservation.' }, 500, headers);
    }

    if (prepared.checkout_url) {
      return jsonResponse({ checkoutUrl: prepared.checkout_url }, 200, headers);
    }

    let response: Response;
    try {
      response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: prepared.tx_ref,
          amount: Number(prepared.amount).toFixed(2),
          currency: prepared.currency,
          redirect_url: `${siteUrl.origin}/booking/checkout?token=${encodeURIComponent(checkoutToken)}`,
          customer: {
            email: prepared.guest_email,
            name: prepared.guest_name,
            phonenumber: prepared.guest_phone,
          },
          customizations: {
            title: 'DEMI APARTMENT',
            description: `Stay at ${prepared.apartment_name}`,
          },
          configurations: { session_duration: 15, max_retry_attempt: 3 },
        }),
      });
    } catch {
      return jsonResponse({ error: 'Secure checkout could not be reached. Your room hold is still active; please try again.' }, 502, headers);
    }

    let payload: FlutterwaveResponse;
    try {
      const value: unknown = await response.json();
      if (!isFlutterwaveResponse(value)) throw new Error('Invalid checkout response.');
      payload = value;
    } catch {
      return jsonResponse({ error: 'Secure checkout returned an invalid response. Your room hold is still active; please try again.' }, 502, headers);
    }

    const checkoutUrl = payload.data?.link;
    if (!response.ok || payload.status !== 'success' || !checkoutUrl) {
      console.error('Flutterwave checkout creation failed:', response.status);
      return jsonResponse({ error: 'Secure checkout could not be started. Your room hold is still active; please try again.' }, 502, headers);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(checkoutUrl);
    } catch {
      return jsonResponse({ error: 'Secure checkout returned an invalid link. Please contact the property team.' }, 502, headers);
    }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'checkout.flutterwave.com') {
      return jsonResponse({ error: 'Secure checkout returned an untrusted link. Please contact the property team.' }, 502, headers);
    }

    const { error: saveError } = await client
      .from('booking_requests')
      .update({ payment_checkout_url: parsedUrl.toString() })
      .eq('id', prepared.booking_id)
      .eq('payment_reference', prepared.tx_ref)
      .eq('status', 'awaiting_payment')
      .eq('payment_status', 'awaiting_payment');
    if (saveError) {
      console.error('Could not save secure checkout link:', saveError.code);
      return jsonResponse({ error: 'Secure checkout started, but we could not prepare its return link. Contact the property before trying again.' }, 500, headers);
    }

    return jsonResponse({ checkoutUrl: parsedUrl.toString() }, 200, headers);
  } catch (error) {
    console.error('Checkout request failed:', error instanceof Error ? error.message : 'Unexpected error');
    return jsonResponse({ error: 'Secure checkout is temporarily unavailable. Please try again.' }, 500, headers);
  }
});
