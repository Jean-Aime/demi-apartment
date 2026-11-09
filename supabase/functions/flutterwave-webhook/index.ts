import {
  getServiceClient,
  verifyAndCompletePayment,
} from '../_shared/payment.ts';

interface WebhookEvent {
  event?: string;
  data?: {
    id?: number | string;
    tx_ref?: string;
  };
}

function matchesSecretHash(received: string | null, expected: string): boolean {
  if (!received || received.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 });

  const secretHash = Deno.env.get('FLW_SECRET_HASH');
  if (!secretHash || !matchesSecretHash(request.headers.get('verif-hash'), secretHash)) {
    return new Response('Unauthorized.', { status: 401 });
  }

  try {
    const event: WebhookEvent = await request.json();
    if (event.event !== 'charge.completed') return new Response('OK', { status: 200 });

    const transactionId = event.data?.id;
    const txRef = event.data?.tx_ref;
    if (
      transactionId === undefined ||
      !/^\d{1,24}$/.test(String(transactionId)) ||
      typeof txRef !== 'string' ||
      !/^DEMI-[A-F0-9]{32}$/.test(txRef)
    ) {
      return new Response('Invalid transaction.', { status: 400 });
    }

    const client = getServiceClient();
    const result = await verifyAndCompletePayment(client, txRef, String(transactionId));
    if (result.state === 'pending') return new Response('Payment is not complete yet.', { status: 503 });
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Flutterwave webhook processing failed:', error instanceof Error ? error.message : 'Unexpected error');
    return new Response('Unable to process payment event.', { status: 500 });
  }
});
