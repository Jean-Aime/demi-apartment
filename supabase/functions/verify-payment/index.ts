import {
  corsHeaders,
  getPaymentState,
  getServiceClient,
  jsonResponse,
  verifyAndCompletePayment,
} from '../_shared/payment.ts';

const referencePattern = /^DEMI-[A-F0-9]{32}$/;
const transactionPattern = /^\d{1,24}$/;

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, headers);

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return jsonResponse({ error: 'Invalid payment reference.' }, 400, headers);

    const input = body as Record<string, unknown>;
    const txRef = input.tx_ref;
    const transactionId = input.transaction_id;
    if (typeof txRef !== 'string' || !referencePattern.test(txRef)) {
      return jsonResponse({ error: 'Invalid payment reference.' }, 400, headers);
    }
    if (transactionId !== undefined && (typeof transactionId !== 'string' || !transactionPattern.test(transactionId))) {
      return jsonResponse({ error: 'Invalid transaction identifier.' }, 400, headers);
    }

    const client = getServiceClient();
    const result = transactionId
      ? await verifyAndCompletePayment(client, txRef, transactionId)
      : await getPaymentState(client, txRef);

    return jsonResponse(result, 200, headers);
  } catch (error) {
    console.error('Payment verification failed:', error instanceof Error ? error.message : 'Unexpected error');
    return jsonResponse({ error: 'We could not verify this payment yet. Please refresh in a moment.' }, 503, headers);
  }
});
