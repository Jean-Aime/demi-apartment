import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import { media } from '@/data/media';
import { formatIsoDate } from '@/lib/bookings';
import { supabase } from '@/lib/supabase';

const paymentResultSchema = z.object({
  state: z.enum(['confirmed', 'paid_unassigned', 'pending', 'failed', 'expired', 'invalid']),
  booking: z.object({
    reference: z.string(),
    apartmentName: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.number(),
    amount: z.number(),
    currency: z.enum(['USD', 'EUR']),
  }).optional(),
});

type PaymentResult = z.infer<typeof paymentResultSchema>;

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!txRef) return;
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const checkPayment = async () => {
      if (!supabase) {
        setError('Payment status is unavailable because the booking service is not configured.');
        return;
      }

      setError('');
      const { data, error: invokeError } = await supabase.functions.invoke('verify-payment', {
        body: { tx_ref: txRef, transaction_id: transactionId ?? undefined },
      });

      if (!active) return;
      if (invokeError) {
        setError('We could not verify your payment yet. You can try again shortly.');
        return;
      }

      const parsed = paymentResultSchema.safeParse(data);
      if (!parsed.success) {
        setError('The payment service returned an unexpected response. Please contact the property team with your payment reference.');
        return;
      }

      setResult(parsed.data);
      if (parsed.data.state === 'pending' && attempts < 5) {
        attempts += 1;
        timer = setTimeout(() => void checkPayment(), 5000);
      }
    };

    setResult(null);
    void checkPayment();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [retry, transactionId, txRef]);

  if (!txRef) return <Navigate to="/booking" replace />;

  const state = result?.state ?? 'pending';
  const isConfirmed = state === 'confirmed';
  const needsSupport = state === 'paid_unassigned';
  const title = isConfirmed
    ? <>Your stay is <span className="italic text-gold">confirmed.</span></>
    : needsSupport
      ? <>Payment received. <span className="italic text-gold">We are resolving your booking.</span></>
      : state === 'expired' || state === 'failed' || state === 'invalid'
        ? <>Your payment is <span className="italic text-gold">not confirmed.</span></>
        : <>Verifying your <span className="italic text-gold">payment.</span></>;
  const intro = isConfirmed
    ? 'Your payment has been verified and your residence is confirmed.'
    : needsSupport
      ? 'Your payment was verified, but the original date hold expired or became unavailable. The property team must resolve this payment before another reservation can be confirmed.'
      : state === 'expired'
        ? 'The payment session or date hold has expired. Please start a new booking and check availability again.'
        : state === 'failed' || state === 'invalid'
          ? 'We could not verify a successful payment. Your stay is not confirmed. If you believe you were charged, contact the property team and include your reference.'
          : 'Please wait while we verify the transaction directly with Flutterwave. A redirect alone never confirms a stay.';

  const details = result?.booking ? [
    { label: 'Payment reference', value: result.booking.reference },
    { label: 'Residence', value: result.booking.apartmentName },
    { label: 'Check-in', value: formatIsoDate(result.booking.checkIn) },
    { label: 'Check-out', value: formatIsoDate(result.booking.checkOut) },
    { label: 'Guests', value: String(result.booking.guests) },
    {
      label: 'Total paid',
      value: new Intl.NumberFormat('en', { style: 'currency', currency: result.booking.currency }).format(result.booking.amount),
    },
  ] : [{ label: 'Payment reference', value: txRef }];

  return (
    <main>
      <PageHeader
        eyebrow={isConfirmed ? 'Verified reservation' : 'Payment update'}
        title={title}
        intro={intro}
        image={media.finalCta}
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-7">
            {error && <p className="mb-6 border-l-2 border-[#C75D4A] bg-paper-warm px-5 py-4 text-sm text-ink-800" role="alert">{error}</p>}
            <dl className="grid gap-8 border-t border-ink-100 pt-8 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label}>
                  <dt className="eyebrow">{detail.label}</dt>
                  <dd className="mt-3 break-words font-serif text-2xl leading-[1.2] text-ink-900">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={150} className="md:col-span-4 md:col-start-9">
            <div className="border border-ink-100 p-8">
              {isConfirmed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700" strokeWidth={1.5} aria-hidden="true" />
              ) : needsSupport || state === 'failed' || state === 'invalid' || state === 'expired' ? (
                <ShieldAlert className="h-5 w-5 text-[#C75D4A]" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Clock className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
              )}
              <p className="mt-6 font-serif text-2xl leading-[1.2] text-ink-900">
                Status: {isConfirmed ? 'Confirmed' : needsSupport ? 'Payment received — action required' : state === 'pending' ? 'Verifying' : 'Not confirmed'}
              </p>
              <p className="mt-4 text-sm leading-[1.5] text-ink-500">
                {isConfirmed
                  ? 'Keep your reference for any questions about your stay.'
                  : needsSupport
                    ? 'Please contact the property team promptly. Do not make another payment for this reference.'
                    : 'Only a successful server-side payment verification can confirm this reservation.'}
              </p>
              {state === 'pending' && (
                <button type="button" onClick={() => setRetry((current) => current + 1)} className="btn-outline mt-6 px-4 py-2 text-xs uppercase tracking-[0.12em]">
                  Check payment again
                </button>
              )}
            </div>
            <div className="mt-10 flex flex-col gap-6">
              <Link to="/apartments" className="btn-gold group inline-flex items-center justify-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]">
                Explore the residences
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link to="/contact" className="link-line self-start text-ink-900">Contact the team</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
