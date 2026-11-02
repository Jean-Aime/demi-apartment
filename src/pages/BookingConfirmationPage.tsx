import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { BookingConfirmation } from '@/lib/bookings';
import { formatIsoDate } from '@/lib/bookings';
import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import { media } from '@/data/media';

function isBookingConfirmation(value: unknown): value is BookingConfirmation {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<BookingConfirmation>;
  return (
    typeof candidate.reference === 'string' &&
    typeof candidate.apartmentName === 'string' &&
    typeof candidate.checkIn === 'string' &&
    typeof candidate.checkOut === 'string' &&
    typeof candidate.guests === 'number' &&
    typeof candidate.guestEmail === 'string'
  );
}

export default function BookingConfirmationPage() {
  const { state } = useLocation();

  if (!isBookingConfirmation(state)) {
    return <Navigate to="/booking" replace />;
  }

  const details = [
    { label: 'Reference', value: state.reference },
    { label: 'Residence', value: state.apartmentName },
    { label: 'Check-in', value: formatIsoDate(state.checkIn) },
    { label: 'Check-out', value: formatIsoDate(state.checkOut) },
    { label: 'Guests', value: String(state.guests) },
    { label: 'Email', value: state.guestEmail },
  ];

  return (
    <main>
      <PageHeader
        eyebrow="Request received"
        title={
          <>
            Thank you. Your request is <span className="italic text-gold">pending.</span>
          </>
        }
        intro="We have received your booking request. The team will review availability and contact you at the email address you provided. Your stay is not confirmed until you hear from us."
        image={media.finalCta}
      />

      <section className="bg-paper py-24 md:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-7">
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
              <Clock className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-6 font-serif text-2xl leading-[1.2] text-ink-900">Status: Pending</p>
              <p className="mt-4 text-sm leading-[1.5] text-ink-500">
                Keep this reference for your records. Your stay is only confirmed once the team has accepted it.
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-6">
              <Link
                to="/apartments"
                className="btn-gold group inline-flex items-center justify-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
              >
                Explore the residences
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link to="/contact" className="link-line self-start text-ink-900">
                Contact the team
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
