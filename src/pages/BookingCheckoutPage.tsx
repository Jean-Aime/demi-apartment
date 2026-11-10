import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock3, CreditCard, Landmark, RefreshCw, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import { media } from '@/data/media';
import {
  fetchReservationCheckout,
  formatIsoDate,
  startSecureCheckout,
  verifySecurePayment,
  type ReservationCheckout,
} from '@/lib/bookings';

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value);
}

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function BookingCheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const txRef = searchParams.get('tx_ref') ?? '';
  const transactionId = searchParams.get('transaction_id') ?? '';
  const paymentResult = searchParams.get('status') ?? '';
  const [reservation, setReservation] = useState<ReservationCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentStarting, setPaymentStarting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [paymentError, setPaymentError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [expiryRefreshStarted, setExpiryRefreshStarted] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const holdExpired = reservation?.hold_expires_at
    ? new Date(reservation.hold_expires_at).getTime() <= now
    : false;

  const loadReservation = useCallback(async (isRefresh = false) => {
    if (!token) {
      setError('This reservation link is missing its secure reference.');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    setError('');
    try {
      const result = await fetchReservationCheckout(token);
      setReservation(result);
      if (!result) setError('This reservation could not be found. Check the link or contact the property.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load reservation details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReservation();
  }, [loadReservation]);

  useEffect(() => {
    if (txRef && transactionId) {
      void (async () => {
        setRefreshing(true);
        setPaymentError('');
        try {
          const state = await verifySecurePayment(txRef, transactionId);
          if (state === 'confirmed') setPaymentNotice('Payment verified. Your reservation is confirmed.');
          else if (state === 'paid_unassigned') setPaymentNotice('Payment was received, but the reservation needs immediate property review. Please contact the team.');
          else if (state === 'pending') setPaymentNotice('Payment is still processing. Refresh this page shortly to check again.');
          else if (state === 'expired') setPaymentNotice('The reservation hold expired before payment was confirmed. Contact the property to resolve the payment.');
          else setPaymentNotice('The payment was not confirmed. No reservation confirmation has been issued.');
          await loadReservation(true);
          if (state !== 'pending') {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('tx_ref');
            nextParams.delete('transaction_id');
            nextParams.delete('status');
            setSearchParams(nextParams, { replace: true });
          }
        } catch (cause) {
          setPaymentError(cause instanceof Error ? cause.message : 'Payment verification could not be completed.');
        } finally {
          setRefreshing(false);
        }
      })();
    } else if (paymentResult === 'successful') {
      setPaymentError('Flutterwave returned without a transaction reference. Your payment cannot be confirmed here; contact the property team before trying again.');
    } else if (paymentResult && paymentResult !== 'successful') {
      setPaymentNotice('You left the secure payment page before completing payment. Your temporary hold remains until its expiry time.');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('status');
      setSearchParams(nextParams, { replace: true });
    }
  }, [loadReservation, paymentResult, searchParams, setSearchParams, transactionId, txRef]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingMilliseconds = useMemo(() => {
    if (!reservation?.hold_expires_at) return 0;
    return new Date(reservation.hold_expires_at).getTime() - now;
  }, [reservation?.hold_expires_at, now]);

  useEffect(() => {
    if (reservation?.reservation_status === 'awaiting_payment' && remainingMilliseconds <= 0 && !expiryRefreshStarted) {
      setExpiryRefreshStarted(true);
      void loadReservation(true);
    }
  }, [expiryRefreshStarted, loadReservation, remainingMilliseconds, reservation?.reservation_status]);

  const nights = reservation
    ? Math.max(0, Math.round((Date.parse(`${reservation.check_out}T00:00:00Z`) - Date.parse(`${reservation.check_in}T00:00:00Z`)) / 86_400_000))
    : 0;

  const isExpired = reservation?.reservation_status === 'expired' || (holdExpired && reservation?.reservation_status === 'awaiting_payment');
  const isConfirmed = reservation?.reservation_status === 'confirmed' || reservation?.reservation_status === 'checked_in' || reservation?.reservation_status === 'checked_out';
  const isPaidUnassigned = reservation?.payment_status === 'paid_unassigned';

  async function beginPayment() {
    setPaymentStarting(true);
    setPaymentError('');
    try {
      const checkoutUrl = await startSecureCheckout(token);
      window.location.assign(checkoutUrl);
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : 'Secure payment could not be started.');
    } finally {
      setPaymentStarting(false);
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="Reservation checkout"
        title={isExpired
          ? <>Your temporary hold has <span className="italic text-gold">expired.</span></>
          : isConfirmed
            ? <>Your stay is <span className="italic text-gold">confirmed.</span></>
            : isPaidUnassigned
              ? <>Your payment needs <span className="italic text-gold">property review.</span></>
              : <>Your stay is <span className="italic text-gold">awaiting payment.</span></>}
        intro={isExpired
          ? 'The temporary hold has ended. No payment was taken; search again if you still need these dates.'
          : isConfirmed
            ? 'Your payment has been verified and your reservation is confirmed.'
            : isPaidUnassigned
              ? 'Payment was received, but the hold could not be confirmed. Contact the property team immediately for assistance.'
              : 'Your reservation is temporarily held while you complete secure payment. Card details are entered only on Flutterwave’s hosted checkout.'}
        image={media.finalCta}
      />
      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
          <ol aria-label="Reservation progress" className="mb-12 grid grid-cols-5 border-y border-ink-100 py-4">
            {['Search', 'Residence', 'Your details', 'Review', 'Payment'].map((label, index) => (
              <li key={label} aria-current={index === 4 ? 'step' : undefined} className="flex flex-col items-center gap-2 text-center">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${index === 4 ? 'bg-ink-900 text-paper' : 'bg-paper-warm text-ink-400'}`}>{index + 1}</span>
                <span className={`text-[0.55rem] uppercase tracking-[0.08em] sm:text-[0.65rem] ${index === 4 ? 'font-medium text-ink-900' : 'text-ink-400'}`}>{label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-7">
            {loading ? (
              <p className="border border-ink-100 p-6 text-sm text-ink-500">Loading your secure reservation…</p>
            ) : error ? (
              <div className="space-y-4 border border-rose-200 bg-rose-50 p-6">
                <p className="text-sm text-rose-800" role="alert">{error}</p>
                <button type="button" onClick={() => void loadReservation(true)} disabled={refreshing} className="btn-outline inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> Try again
                </button>
              </div>
            ) : reservation ? (
              <div className="space-y-8">
                <div className="flex flex-col gap-5 border border-ink-100 bg-paper p-5 sm:flex-row">
                  <img src={reservation.photo_src} alt={reservation.apartment_name} className="h-44 w-full object-cover sm:w-56" />
                  <div className="min-w-0">
                    <p className="eyebrow">Reservation reference</p>
                    <p className="mt-2 break-all font-mono text-lg text-ink-900">{reservation.booking_reference}</p>
                    <h2 className="mt-5 font-serif text-2xl text-ink-900">{reservation.apartment_name}</h2>
                    <p className="mt-2 text-sm text-ink-600">{formatIsoDate(reservation.check_in)} – {formatIsoDate(reservation.check_out)}</p>
                    <p className="mt-1 text-sm text-ink-500">{reservation.adults} {reservation.adults === 1 ? 'adult' : 'adults'}{reservation.children ? `, ${reservation.children} ${reservation.children === 1 ? 'child' : 'children'}` : ''}</p>
                  </div>
                </div>

                <dl className="grid gap-4 border-y border-ink-100 py-6 sm:grid-cols-2">
                  <div><dt className="eyebrow">Email</dt><dd className="mt-2 break-all text-sm text-ink-900">{reservation.guest_email}</dd></div>
                  <div><dt className="eyebrow">Payment status</dt><dd className="mt-2 text-sm font-medium uppercase tracking-wide text-amber-800">{reservation.payment_status.replace('_', ' ')}</dd></div>
                </dl>

                <div className="border border-ink-100 bg-paper-warm p-5 sm:p-7">
                  <div className="flex items-start gap-4">
                    <Clock3 className="mt-1 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                    <div className="min-w-0">
                      <h2 className="font-serif text-2xl text-ink-900">
                        {isExpired ? 'The temporary hold has expired' : isConfirmed ? 'Reservation confirmed' : isPaidUnassigned ? 'Payment received — property review needed' : 'Awaiting payment'}
                      </h2>
                      {reservation.reservation_status === 'awaiting_payment' && !isExpired && (
                        <p className="mt-3 text-sm text-ink-600">
                          This room is held for <strong className="font-medium tabular-nums text-ink-900">{formatCountdown(remainingMilliseconds)}</strong>. The server controls the actual expiry time.
                        </p>
                      )}
                      {isExpired && <p className="mt-3 text-sm text-ink-600">The hold no longer blocks availability. Please start a new reservation if you still want these dates.</p>}
                      {isConfirmed && <p className="mt-3 text-sm text-ink-600">Please contact the property team to confirm payment arrangements and the final booking status.</p>}
                      {!isExpired && !isConfirmed && (
                        <p className="mt-3 text-sm leading-relaxed text-ink-600">
                          Complete payment through Flutterwave’s secure checkout before the hold expires. Your stay is not confirmed until the payment is verified by our server.
                        </p>
                      )}
                      <p className="mt-4 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-500">
                        DEMI does not collect or store card numbers or security codes. Payment is handled on Flutterwave’s secure hosted checkout.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-ink-100 p-5 sm:p-7">
                  <h3 className="font-serif text-2xl text-ink-900">Price summary</h3>
                  <div className="mt-5 flex justify-between gap-4 text-sm text-ink-600">
                    <span>{nights} nights × {reservation.nightly_rate && reservation.currency ? formatMoney(reservation.nightly_rate, reservation.currency) : 'Rate unavailable'}</span>
                    <span>{reservation.total_amount !== null && reservation.currency ? formatMoney(reservation.total_amount, reservation.currency) : 'To be confirmed'}</span>
                  </div>
                  <div className="mt-4 flex justify-between gap-4 border-t border-ink-100 pt-4 font-medium text-ink-900">
                    <span>Estimated total</span>
                    <span>{reservation.total_amount !== null && reservation.currency ? formatMoney(reservation.total_amount, reservation.currency) : 'To be confirmed'}</span>
                  </div>
                  <p className="mt-3 text-xs text-ink-400">The displayed amount is calculated by the database from the current nightly rate. Taxes and fees are not configured.</p>
                </div>

                {reservation.reservation_status === 'awaiting_payment' && !isExpired && reservation.payment_status === 'awaiting_payment' && (
                  <section className="space-y-4" aria-labelledby="payment-method-title">
                    <div>
                      <p className="eyebrow">Secure payment</p>
                      <h2 id="payment-method-title" className="mt-2 font-serif text-2xl text-ink-900">Choose how to pay</h2>
                      <p className="mt-2 text-sm text-ink-500">Your dates are held until the timer expires. Payment is handled outside this website.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        aria-pressed={paymentMethod === 'card'}
                        onClick={() => { setPaymentMethod('card'); setPaymentError(''); }}
                        className={`flex items-start gap-3 border p-4 text-left transition-colors ${paymentMethod === 'card' ? 'border-gold bg-paper-warm' : 'border-ink-100 hover:border-gold'}`}
                      >
                        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />
                        <span><span className="block text-sm font-medium text-ink-900">Credit or debit card</span><span className="mt-1 block text-xs text-ink-500">Pay through Flutterwave’s secure hosted checkout.</span></span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={paymentMethod === 'bank_transfer'}
                        onClick={() => { setPaymentMethod('bank_transfer'); setPaymentError(''); }}
                        className={`flex items-start gap-3 border p-4 text-left transition-colors ${paymentMethod === 'bank_transfer' ? 'border-gold bg-paper-warm' : 'border-ink-100 hover:border-gold'}`}
                      >
                        <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />
                        <span><span className="block text-sm font-medium text-ink-900">Bank transfer</span><span className="mt-1 block text-xs text-ink-500">Account instructions are not configured yet.</span></span>
                      </button>
                    </div>
                    {paymentMethod === 'bank_transfer' && (
                      <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-sm leading-relaxed text-ink-700" role="status">
                        Bank transfer is not available online yet because verified bank account details have not been provided. Please contact the property. Do not send money to account details received from an unverified source.
                      </p>
                    )}
                  </section>
                )}

                {paymentNotice && <p className="border border-ink-100 bg-paper-warm px-4 py-3 text-sm text-ink-700" role="status">{paymentNotice}</p>}
                {paymentError && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{paymentError}</p>}
                <div className="flex flex-wrap gap-3">
                  {reservation.reservation_status === 'awaiting_payment' && !isExpired && reservation.payment_status === 'awaiting_payment' && paymentMethod === 'card' && (
                    <button type="button" onClick={() => void beginPayment()} disabled={paymentStarting || refreshing} className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-60">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {paymentStarting ? 'Opening secure checkout…' : 'Pay securely with Flutterwave'}
                    </button>
                  )}
                  <button type="button" onClick={() => void loadReservation(true)} disabled={refreshing} className="btn-outline inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh status
                  </button>
                </div>
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={150} className="md:col-span-4 md:col-start-9">
            <aside className="border border-ink-100 p-6">
              <p className="eyebrow">Next steps</p>
              <h2 className="mt-3 font-serif text-2xl text-ink-900">Need help with your stay?</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">Contact the property team with your reservation reference if you have questions.</p>
              <div className="mt-7 space-y-4">
                <Link to="/contact" className="btn-outline inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]">Contact the team <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                <Link to="/apartments" className="link-line text-sm text-ink-900">Explore residences</Link>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
