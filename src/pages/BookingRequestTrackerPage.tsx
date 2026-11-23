import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import { media } from '@/data/media';
import { fetchBookingRequestStatus, formatIsoDate, type BookingRequestStatus } from '@/lib/bookings';

const statusLabels: Record<BookingRequestStatus['status'], string> = {
  pending: 'Under review',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
};

function statusDescription(status: BookingRequestStatus['status']): string {
  if (status === 'pending') {
    return 'The property has received your request and is reviewing room availability, guest capacity, and the final price. No payment is due while your request is under review.';
  }
  if (status === 'awaiting_payment') {
    return 'Your temporary reservation is awaiting payment. Use the secure checkout link from your original confirmation; this status page does not collect payment.';
  }
  if (status === 'confirmed') {
    return 'Your stay is confirmed. Follow the property’s verified payment instructions; never send card details by email or through a form.';
  }
  if (status === 'cancelled') return 'This request was cancelled. Contact the property if you need help or would like to submit a new request.';
  if (status === 'expired') return 'The temporary reservation hold has expired. Contact the property or start a new search to request these dates again.';
  if (status === 'checked_in') return 'Your reservation is marked as checked in. Contact the property team if you need assistance during your stay.';
  return 'Your reservation is marked as checked out. Contact the property team if you need help with your stay.';
}

export default function BookingRequestTrackerPage() {
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState(searchParams.get('reference')?.toUpperCase() ?? '');
  const [email, setEmail] = useState('');
  const [request, setRequest] = useState<BookingRequestStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function checkRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setRequest(null);
    try {
      const result = await fetchBookingRequestStatus(reference, email);
      if (!result) {
        setError('No request matched that reference and email. Check both details and try again.');
      } else {
        setRequest(result);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not check the request status.');
    } finally {
      setLoading(false);
    }
  }

  const contactPath = request
    ? `/contact?topic=payment&reference=${encodeURIComponent(request.booking_reference)}`
    : '/contact';

  return (
    <main>
      <PageHeader
        eyebrow="Reservation follow-up"
        title={<>Track your <span className="italic text-gold-light">request.</span></>}
        intro="Check the latest status with the booking reference and email address you used when submitting your request."
        image={media.finalCta}
        meta="Guest request status"
      />
      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-x-10 md:px-12 lg:px-16">
          <Reveal className="md:col-span-6">
            <div className="border border-ink-200/70 bg-paper p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center bg-paper-warm text-gold-ink">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="display mt-5 text-3xl text-ink-900">Look up a request</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Your email is checked with the reference. Only the matching request’s room, dates, guest count, and status are shown.
              </p>

              <form onSubmit={(event) => void checkRequest(event)} className="mt-7 space-y-5">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-ink-500">
                  Booking reference
                  <input
                    required
                    autoCapitalize="characters"
                    autoComplete="off"
                    value={reference}
                    onChange={(event) => setReference(event.target.value.toUpperCase())}
                    placeholder="DEMI-2026-C47479"
                    className="mt-2 w-full border border-ink-200 bg-paper px-4 py-3 font-mono text-sm text-ink-900 outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-ink-500">
                  Booking email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full border border-ink-200 bg-paper px-4 py-3 text-sm text-ink-900 outline-none focus:border-gold"
                  />
                </label>
                {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-60"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {loading ? 'Checking request' : 'Check status'}
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={100} className="md:col-span-5 md:col-start-8">
            {request ? (
              <section className="border border-ink-200/70 bg-paper-warm p-6 sm:p-8" aria-live="polite">
                <p className="eyebrow text-gold-ink">Request status</p>
                <p className="mt-3 break-all font-mono text-sm text-ink-500">{request.booking_reference}</p>
                <h2 className="display mt-4 text-3xl text-ink-900">{statusLabels[request.status]}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{statusDescription(request.status)}</p>
                <dl className="mt-6 grid gap-4 border-t border-ink-200 pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="eyebrow text-ink-400">Residence</dt>
                    <dd className="mt-1 text-ink-900">{request.apartment_name}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-400">Guests</dt>
                    <dd className="mt-1 text-ink-900">{request.guests}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-400">Check-in</dt>
                    <dd className="mt-1 text-ink-900">{formatIsoDate(request.check_in)}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-400">Check-out</dt>
                    <dd className="mt-1 text-ink-900">{formatIsoDate(request.check_out)}</dd>
                  </div>
                </dl>
                <Link to={contactPath} className="btn-outline mt-6 inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.12em]">
                  Contact the property
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>
            ) : (
              <div className="border-l-2 border-gold bg-paper-warm p-6 sm:p-8">
                <p className="eyebrow text-gold-ink">Keep your reference</p>
                <h2 className="display mt-3 text-3xl text-ink-900">Follow up securely.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  Your reference is shown after you send a request. Use it with the same email address to check progress later. Do not send card numbers, security codes, or banking passwords.
                </p>
                <Link to="/booking" className="link-line mt-5 text-ink-900">
                  Start a new request
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </main>
  );
}
