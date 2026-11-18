import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Apartment } from '@/data/apartments';
import Reveal from '@/components/Reveal';
import SpecItem from '@/components/apartments/SpecItem';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';
import SectionLabel from '@/components/ui/SectionLabel';

function RoomMeta({ apartment }: { apartment: Apartment }) {
  return (
    <dl className="mt-6 grid grid-cols-3 gap-x-4 gap-y-4 border-t border-ink-200/70 pt-5">
      <SpecItem label="Beds" value={apartment.bedConfiguration} />
      <SpecItem label="Guests" value={apartment.maxOccupancy ? `Up to ${apartment.maxOccupancy}` : undefined} />
      <SpecItem label="Bathrooms" value={apartment.bathrooms ? String(apartment.bathrooms) : undefined} />
    </dl>
  );
}

function RoomLinks({ apartment }: { apartment: Apartment }) {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
      <Link to={getApartmentPath(apartment)} className="btn-outline !px-5 !py-3.5">
        View residence
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      <Link
        to={`/booking?apartment=${apartment.slug}`}
        className="link-line text-ink-600 hover:text-ink-900"
      >
        {apartment.bookingEnabled ? 'Check dates' : 'Request a stay'}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function SplitRow({ apartment, index, total }: { apartment: Apartment; index: number; total: number }) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-12 md:gap-x-8">
      <Reveal className="md:col-span-7">
        <Link to={getApartmentPath(apartment)} className="group block overflow-hidden bg-paper-muted">
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              src={apartment.photo.src}
              alt={apartment.photo.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.035]"
            />
          </div>
        </Link>
      </Reveal>
      <div className="md:col-span-4 md:col-start-9">
        <Reveal delay={100}>
          <p className="font-display text-[0.9rem] italic tabular-nums text-gold-ink/70">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
          <p className="eyebrow mt-3 text-gold-ink">Residence {apartment.number}</p>
          <h2 className="display mt-3 text-[clamp(2.4rem,4vw,3.5rem)] text-ink-900">{apartment.name}</h2>
          <p className="mt-4 max-w-md text-[0.95rem] leading-[1.85] text-ink-500">{apartment.summary}</p>
          <RoomMeta apartment={apartment} />
          <RoomLinks apartment={apartment} />
        </Reveal>
      </div>
    </div>
  );
}

function OffsetRow({ apartment, index, total }: { apartment: Apartment; index: number; total: number }) {
  return (
    <div className="grid gap-10 md:grid-cols-12 md:gap-x-8">
      <div className="md:col-span-5 md:pt-16">
        <Reveal>
          <p className="font-display text-[0.9rem] italic tabular-nums text-gold-ink/70">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
          <p className="eyebrow mt-3 text-gold-ink">Residence {apartment.number}</p>
          <h2 className="display mt-3 text-[clamp(2.4rem,4vw,3.5rem)] text-ink-900">{apartment.name}</h2>
          <p className="mt-4 max-w-md text-[0.95rem] leading-[1.85] text-ink-500">{apartment.summary}</p>
          <RoomMeta apartment={apartment} />
          <RoomLinks apartment={apartment} />
        </Reveal>
      </div>
      <Reveal delay={120} className="md:col-span-6 md:col-start-7">
        <Link to={getApartmentPath(apartment)} className="group block overflow-hidden bg-paper-muted">
          <div className="aspect-[4/5] w-full overflow-hidden">
            <img
              src={apartment.photo.src}
              alt={apartment.photo.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.035]"
            />
          </div>
        </Link>
      </Reveal>
    </div>
  );
}

function FeatureRow({ apartment, index, total }: { apartment: Apartment; index: number; total: number }) {
  return (
    <Reveal>
      <article className="relative isolate overflow-hidden bg-ink-900 text-paper">
        <Link to={getApartmentPath(apartment)} className="group block">
          <div className="aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10] md:aspect-[21/9]">
            <img
              src={apartment.photo.src}
              alt={apartment.photo.alt}
              loading="lazy"
              className="h-full w-full object-cover opacity-85 transition-transform duration-[1.6s] ease-out group-hover:scale-[1.03] group-hover:opacity-100"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,8,0.85),rgba(8,8,8,0.05)_60%)]"
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8 md:p-10">
          <div>
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-gold-light">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · Residence {apartment.number}
            </p>
            <h2 className="display mt-2 text-[clamp(2.2rem,4vw,3.5rem)] text-paper">{apartment.name}</h2>
            <p className="mt-3 max-w-lg text-[0.9rem] leading-[1.75] text-paper/70">{apartment.summary}</p>
          </div>
          <Link
            to={getApartmentPath(apartment)}
            className="inline-flex shrink-0 items-center gap-3 border border-paper/40 px-5 py-3 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-paper transition-colors hover:border-gold-light hover:bg-gold-light hover:text-ink-900"
          >
            View residence
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

export default function ApartmentCollection() {
  const { apartments, error } = useApartments();

  return (
    <section className="bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-8 border-b border-ink-200/70 pb-8 md:grid-cols-12 md:items-end md:gap-x-8">
          <Reveal className="md:col-span-7">
            <SectionLabel index="01">The apartment collection</SectionLabel>
            <h2 className="display mt-5 text-[clamp(2.4rem,4.6vw,4.5rem)] text-ink-900">
              Explore all {apartments.length} <span className="italic text-gold-ink">residences.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="md:col-span-4 md:col-start-9">
            <p className="text-[0.95rem] leading-[1.85] text-ink-500">
              Open any room for its gallery, verified stay essentials, amenities and reservation options.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 space-y-16 md:space-y-24">
          {apartments.map((apartment, index) => {
            const variant = index % 3;
            if (variant === 2) {
              return <FeatureRow key={apartment.slug} apartment={apartment} index={index} total={apartments.length} />;
            }
            if (variant === 1) {
              return <OffsetRow key={apartment.slug} apartment={apartment} index={index} total={apartments.length} />;
            }
            return <SplitRow key={apartment.slug} apartment={apartment} index={index} total={apartments.length} />;
          })}
        </div>

        {error && (
          <p className="mt-10 text-[0.7rem] text-ink-400" role="status">
            Showing the saved residence list while live property data is unavailable.
          </p>
        )}
      </div>
    </section>
  );
}
