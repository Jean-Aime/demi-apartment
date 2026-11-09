import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type PaymentState = 'confirmed' | 'paid_unassigned' | 'pending' | 'failed' | 'expired' | 'invalid';

export interface PaymentVerification {
  state: PaymentState;
  booking?: {
    reference: string;
    apartmentName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    amount: number;
    currency: string;
  };
}

interface PaymentRow {
  id: string;
  apartment_slug: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  payment_status: string;
  payment_reference: string;
  payment_transaction_id: string | null;
  hold_expires_at: string | null;
  total_amount: number;
  currency: string;
}

interface ApartmentRow {
  name: string;
}

interface FlutterwaveTransaction {
  id: number | string;
  tx_ref: string;
  status: string;
  amount: number | string;
  currency: string;
}

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) throw new Error('Booking service is not configured.');
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function jsonResponse(body: unknown, status: number, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function corsHeaders(request: Request): HeadersInit {
  const configuredOrigin = Deno.env.get('SITE_URL')?.replace(/\/$/, '');
  const origin = request.headers.get('origin');
  const allowedOrigin = origin && (origin === configuredOrigin || origin === 'http://localhost:5173')
    ? origin
    : configuredOrigin ?? 'null';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function toPaymentResponse(row: PaymentRow, apartmentName: string): PaymentVerification['booking'] {
  return {
    reference: row.payment_reference,
    apartmentName,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    amount: Number(row.total_amount),
    currency: row.currency,
  };
}

export async function verifyAndCompletePayment(
  client: SupabaseClient,
  txRef: string,
  transactionId: string,
): Promise<PaymentVerification> {
  const { data: row, error: bookingError } = await client
    .from('booking_requests')
    .select('id, apartment_slug, check_in, check_out, guests, status, payment_status, payment_reference, payment_transaction_id, hold_expires_at, total_amount, currency')
    .eq('payment_reference', txRef)
    .maybeSingle<PaymentRow>();

  if (bookingError) throw new Error('Could not load the booking payment.');
  if (!row) return { state: 'invalid' };

  const { data: apartment, error: apartmentError } = await client
    .from('property_apartments')
    .select('name')
    .eq('slug', row.apartment_slug)
    .maybeSingle<ApartmentRow>();
  if (apartmentError) throw new Error('Could not load the residence name.');
  const details = toPaymentResponse(row, apartment?.name ?? row.apartment_slug);

  if (row.payment_status === 'paid' || (row.payment_status === 'paid_unassigned' && row.status === 'confirmed')) {
    return { state: 'confirmed', booking: details };
  }
  if (row.payment_status === 'paid_unassigned') return { state: 'paid_unassigned', booking: details };

  const secretKey = Deno.env.get('FLW_SECRET_KEY');
  if (!secretKey) throw new Error('Payment provider is not configured.');

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) throw new Error('Could not verify the payment with Flutterwave.');

  const payload: { status?: string; data?: FlutterwaveTransaction } = await response.json();
  const transaction = payload.data;
  if (
    payload.status !== 'success' ||
    !transaction ||
    String(transaction.id) !== transactionId ||
    transaction.tx_ref !== txRef
  ) {
    return { state: 'invalid', booking: details };
  }
  if (transaction.status === 'failed') return { state: 'failed', booking: details };
  if (transaction.status !== 'successful') return { state: 'pending', booking: details };
  if (
    transaction.currency !== row.currency ||
    !Number.isFinite(Number(transaction.amount)) ||
    Math.round(Number(transaction.amount) * 100) !== Math.round(Number(row.total_amount) * 100)
  ) {
    return { state: 'invalid', booking: details };
  }

  const { data: finalState, error: finalizeError } = await client.rpc('complete_paid_booking', {
    p_tx_ref: txRef,
    p_transaction_id: transactionId,
    p_amount: Number(transaction.amount),
    p_currency: transaction.currency,
  });
  if (finalizeError) throw new Error('Could not finalize the verified payment.');

  if (finalState === 'confirmed') return { state: 'confirmed', booking: details };
  if (finalState === 'paid_unassigned') return { state: 'paid_unassigned', booking: details };
  if (finalState === 'payment_mismatch' || finalState === 'already_processed') return { state: 'invalid', booking: details };
  return { state: 'expired', booking: details };
}

export async function getPaymentState(
  client: SupabaseClient,
  txRef: string,
): Promise<PaymentVerification> {
  const { data: row, error } = await client
    .from('booking_requests')
    .select('id, apartment_slug, check_in, check_out, guests, status, payment_status, payment_reference, payment_transaction_id, hold_expires_at, total_amount, currency')
    .eq('payment_reference', txRef)
    .maybeSingle<PaymentRow>();

  if (error) throw new Error('Could not load the booking payment.');
  if (!row) return { state: 'invalid' };

  const { data: apartment, error: apartmentError } = await client
    .from('property_apartments')
    .select('name')
    .eq('slug', row.apartment_slug)
    .maybeSingle<ApartmentRow>();
  if (apartmentError) throw new Error('Could not load the residence name.');

  const booking = toPaymentResponse(row, apartment?.name ?? row.apartment_slug);
  if (row.payment_status === 'paid' || (row.payment_status === 'paid_unassigned' && row.status === 'confirmed')) {
    return { state: 'confirmed', booking };
  }
  if (row.payment_status === 'paid_unassigned') return { state: 'paid_unassigned', booking };
  if (row.payment_status === 'failed') return { state: 'failed', booking };
  if (
    row.payment_status === 'expired' ||
    (row.status === 'cancelled' && row.payment_status !== 'paid_unassigned') ||
    (row.status === 'awaiting_payment' && row.hold_expires_at !== null && Date.parse(row.hold_expires_at) <= Date.now())
  ) {
    return { state: 'expired', booking };
  }
  return { state: 'pending', booking };
}
