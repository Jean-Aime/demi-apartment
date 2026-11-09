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
  const initialApartmentSlug = apartments.find((apartment) => apartment.slug === requestedSlug)?.slug;

  return (
    <main>
      <PageHeader
        eyebrow="Reserve your stay"
        title={
          <>
            Book your <span className="italic text-gold">residence.</span>
          </>
        }
        intro="Choose your dates, select a residence and complete secure checkout. Your stay is confirmed only after payment is verified."
        image={media.hero}
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-20 px-6 md:px-12 lg:grid-cols-12 lg:gap-x-8 lg:px-16">
          <Reveal className="lg:col-span-7">
            <Beds24BookingWidget />
            {!import.meta.env.VITE_BEDS24_BOOKING_URL && (
              <BookingForm apartments={apartments} initialApartmentSlug={initialApartmentSlug} />
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
