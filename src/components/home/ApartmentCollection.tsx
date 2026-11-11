import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Apartment } from '@/data/apartments';
import Reveal from '@/components/Reveal';
import SpecItem from '@/components/apartments/SpecItem';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';

interface CardLayout {
  span: string;
  aspect: string;
  offset: string;
}

const layouts: CardLayout[] = [
  { span: 'md:col-span-7', aspect: 'aspect-[4/3]', offset: '' },
  { span: 'md:col-span-5', aspect: 'aspect-[3/4]', offset: 'md:mt-20' },
  { span: 'md:col-span-4', aspect: 'aspect-[4/5]', offset: '' },
  { span: 'md:col-span-4', aspect: 'aspect-square', offset: 'md:mt-16' },
  { span: 'md:col-span-4', aspect: 'aspect-[3/4]', offset: 'md:mt-24' },
  { span: 'md:col-span-6', aspect: 'aspect-[16/10]', offset: '' },
  { span: 'md:col-span-6', aspect: 'aspect-[4/5]', offset: 'md:mt-16' },
  { span: 'md:col-span-5', aspect: 'aspect-[4/5]', offset: 'md:mt-12' },
  { span: 'md:col-span-7', aspect: 'aspect-[16/9]', offset: '' },
];

function ApartmentCard({ apartment, index, total }: { apartment: Apartment; index: number; total: number }) {
  const layout = layouts[index % layouts.length];
  const apartmentPath = getApartmentPath(apartment);

  return (
    <Reveal delay={(index % 3) * 120} className={`${layout.span} ${layout.offset}`}>
      <article className="group">
        <Link
          to={apartmentPath}
          className={`media-frame group relative block ${layout.aspect} overflow-hidden bg-paper-muted`}
          aria-label={`View ${apartment.name}`}
        >
          <img src={apartment.photo.src} alt={apartment.photo.alt} loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-900/65 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
          <span className="absolute left-5 top-5 bg-paper/90 px-3 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-800 backdrop-blur-sm">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <span className="absolute bottom-5 left-5 inline-flex translate-y-2 items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-paper opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            View residence
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <div className="mt-6 flex items-baseline justify-between border-b border-ink-100 pb-4">
          <p className="eyebrow">Residence {apartment.number}</p>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-400">Kigali · Rwanda</p>
        </div>

        <h3 className="display mt-5 text-3xl text-ink-900 md:text-4xl">{apartment.name}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500 md:text-base">{apartment.summary}</p>

        <dl className="mt-6 grid grid-cols-3 gap-4">
          <SpecItem label="Beds" value={apartment.bedConfiguration} />
          <SpecItem label="Guests" value={apartment.maxOccupancy ? `Up to ${apartment.maxOccupancy}` : undefined} />
          <SpecItem label="Size" value={apartment.sizeSqm ? `${apartment.sizeSqm} m²` : undefined} />
        </dl>

        <Link to={apartmentPath} className="link-line mt-8 text-ink-900">
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </article>
    </Reveal>
  );
}

export default function ApartmentCollection() {
  const { apartments, error } = useApartments();

  return (
    <section className="bg-paper py-20 md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal>
            <p className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
              The apartment collection
            </p>
            <h2 className="display mt-7 max-w-3xl text-[clamp(2.8rem,5vw,5rem)] text-ink-900">
              Explore all {apartments.length} <span className="italic text-gold-deep">residences.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-sm text-ink-500">
              Open any room to view its gallery, stay essentials, amenities and booking information.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-12 md:gap-y-20">
          {apartments.map((apartment, index) => (
            <ApartmentCard key={apartment.slug} apartment={apartment} index={index} total={apartments.length} />
          ))}
        </div>
        {error && <p className="mt-8 text-xs text-ink-400" role="status">Showing the saved residence list while live property data is unavailable.</p>}
      </div>
    </section>
  );
}
