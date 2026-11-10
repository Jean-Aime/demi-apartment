import { Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { media } from '@/data/media';
import PageHeader from '@/components/layout/PageHeader';
import BookingForm from '@/components/booking/BookingForm';
import Beds24BookingWidget from '@/components/booking/Beds24BookingWidget';
import Reveal from '@/components/Reveal';
import { useApartments } from '@/hooks/useApartments';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const { apartments } = useApartments();
  const requestedSlug = searchParams.get('apartment') ?? undefined;
  const initialApartmentSlug = requestedSlug;
  const beds24Ready =
    Boolean(import.meta.env.VITE_BEDS24_BOOKING_URL) &&
    apartments.length > 0 &&
    apartments.every((apartment) => apartment.bookingEnabled);

  return (
    <main>
      <PageHeader
        eyebrow="Direct reservations"
        title={
          <>
            Book your <span className="italic text-gold">residence.</span>
          </>
        }
        intro="Search live website availability, choose your residence, add guest details and review your reservation before placing a temporary hold."
        image={media.hero}
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-20 px-6 md:px-12 lg:grid-cols-12 lg:gap-x-8 lg:px-16">
          <Reveal className="lg:col-span-7">
            {beds24Ready ? (
              <Beds24BookingWidget />
            ) : (
              <>
                {Boolean(import.meta.env.VITE_BEDS24_BOOKING_URL) && (
                  <p className="mb-8 border-l-2 border-gold bg-paper-warm px-4 py-3 text-sm text-ink-700">
                    The external booking engine is paused until every published residence has verified booking details enabled.
                  </p>
                )}
                <BookingForm
                  key={initialApartmentSlug ?? 'all-residences'}
                  apartments={apartments}
                  initialApartmentSlug={initialApartmentSlug}
                />
              </>
            )}
          </Reveal>

          <Reveal delay={150} className="lg:col-span-4 lg:col-start-9">
            <aside className="lg:sticky lg:top-32">
              <p className="eyebrow">Need a hand?</p>
              <h2 className="display mt-5 text-3xl text-ink-900">We are here to help you choose.</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                If you have a question about a room or your dates, contact the team before booking.
              </p>
              <Link
                to="/contact"
                className="link-line mt-7 text-ink-900"
              >
                <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
                Contact the team
              </Link>
            </aside>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
