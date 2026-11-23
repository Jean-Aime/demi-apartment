import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import ApartmentCollection from '@/components/home/ApartmentCollection';
import FaqSection from '@/components/sections/FaqSection';
import ReservationCta from '@/components/sections/ReservationCta';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { media } from '@/data/media';
import { faqs } from '@/data/faqs';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';

function formatRate(amount: number | undefined, currency: string | undefined) {
  if (!amount || !currency) return 'On request';
  if (currency !== 'USD' && currency !== 'EUR') return 'On request';
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function ApartmentsPage() {
  const { apartments } = useApartments();

  return (
    <main>
      <PageHeader
        eyebrow="The residences"
        title={
          <>
            A private collection of <span className="italic text-gold-light">considered stays.</span>
          </>
        }
        intro={`Eight private bedrooms arranged within three shared apartment environments in Kimironko, Kigali.`}
        image={media.introWide}
        meta="Apartments A, B & C · Kimironko"
      />

      <section className="bg-paper-warm py-14 md:py-20">
        <div className="mx-auto grid max-w-site gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-5">
            <SectionLabel>The collection</SectionLabel>
            <h2 className="display mt-5 text-[clamp(2.2rem,3.8vw,3.4rem)] text-ink-900">
              Eight private bedrooms across <span className="italic text-gold-ink">three apartment groups.</span>
            </h2>
          </Reveal>
          <Reveal delay={120} className="md:col-span-4 md:col-start-8">
            <p className="text-[0.95rem] leading-[1.85] text-ink-500">
              We publish only what the property has verified. Where a bed configuration, occupancy, size or rate has
              not been confirmed, the residence says so plainly rather than guessing.
            </p>
            <Link to="/booking" className="link-line mt-6 text-ink-900">
              Check availability
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      <ApartmentCollection />

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-7">
              <SectionLabel>At a glance</SectionLabel>
              <h2 className="display mt-5 text-[clamp(2.2rem,3.8vw,3.4rem)] text-ink-900">
                Compare the <span className="italic text-gold-ink">verified details.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="md:col-span-4 md:col-start-9">
              <p className="text-[0.9rem] leading-[1.85] text-ink-500">
                Only confirmed information appears here. “To be confirmed” means the property has not yet verified
                that detail.
              </p>
            </Reveal>
          </div>

          <Reveal delay={120} className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <caption className="sr-only">Verified details for the eight private bedrooms</caption>
              <thead>
                <tr className="border-y border-ink-300/60">
                  {['Residence', 'Guests', 'Bedrooms', 'Bathrooms', 'Nightly rate', 'Booking'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-4 py-4 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-500 first:pl-0"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apartments.map((room) => (
                  <tr key={room.slug} className="border-b border-ink-200/70 align-middle">
                    <th scope="row" className="whitespace-nowrap px-4 py-5 pl-0 text-left">
                      <Link to={getApartmentPath(room)} className="group inline-flex items-baseline gap-3">
                        <span className="font-display text-[1.35rem] text-ink-900 transition-colors group-hover:text-gold-ink">
                          {room.name}
                        </span>
                        <span className="font-sans text-[0.55rem] uppercase tracking-[0.16em] text-ink-400">
                          {room.number}
                        </span>
                      </Link>
                    </th>
                    <td className="whitespace-nowrap px-4 py-5 text-[0.875rem] text-ink-600">
                      {room.maxOccupancy ? `Up to ${room.maxOccupancy}` : <span className="italic text-ink-400">To be confirmed</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-[0.875rem] text-ink-600">
                      {room.bedrooms ?? <span className="italic text-ink-400">To be confirmed</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-[0.875rem] text-ink-600">
                      {room.bathrooms ?? <span className="italic text-ink-400">To be confirmed</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-[0.875rem] text-ink-600">
                      {room.startingPrice
                        ? `${formatRate(room.startingPrice.amount, room.startingPrice.currency)} / night`
                        : <span className="italic text-ink-400">On request</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
                      {room.bookingEnabled ? 'Instant' : 'By request'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <FaqSection
        items={faqs.slice(1, 6)}
        eyebrow="Before you book"
        title="Residences, answered."
        intro="How the collection is organised and how reservations work."
        tone="paper"
      />

      <ReservationCta
        eyebrow="Reserve"
        title="Choose your residence."
        body="Search the website calendar for your dates, then select the apartment that suits your stay."
        image={media.introTall}
      />
    </main>
  );
}
