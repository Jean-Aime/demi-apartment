import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apartments, type Apartment } from '@/data/apartments';
import Reveal from '@/components/Reveal';
import SpecItem from '@/components/apartments/SpecItem';

interface CardLayout {
  span: string;
  aspect: string;
  offset: string;
}

const layouts: CardLayout[] = [
  { span: 'md:col-span-7', aspect: 'aspect-[4/3]', offset: '' },
  { span: 'md:col-span-5', aspect: 'aspect-[3/4]', offset: 'md:mt-32' },
  { span: 'md:col-span-4', aspect: 'aspect-[4/5]', offset: '' },
  { span: 'md:col-span-4', aspect: 'aspect-square', offset: 'md:mt-16' },
  { span: 'md:col-span-4', aspect: 'aspect-[3/4]', offset: 'md:mt-40' },
  { span: 'md:col-span-6', aspect: 'aspect-[16/10]', offset: '' },
  { span: 'md:col-span-6', aspect: 'aspect-[4/5]', offset: 'md:mt-24' },
  { span: 'md:col-span-5', aspect: 'aspect-[4/5]', offset: 'md:mt-12' },
  { span: 'md:col-span-7', aspect: 'aspect-[16/9]', offset: '' },
];

function ApartmentCard({ apartment, index }: { apartment: Apartment; index: number }) {
  const layout = layouts[index % layouts.length];

  return (
    <Reveal delay={(index % 3) * 120} className={`${layout.span} ${layout.offset}`}>
      <article className="group">
        <Link
          to={`/apartments/${apartment.slug}`}
          className={`media-frame block ${layout.aspect} overflow-hidden bg-paper-muted`}
          aria-label={`View ${apartment.name}`}
        >
          <img src={apartment.photo.src} alt={apartment.photo.alt} loading="lazy" className="h-full w-full object-cover" />
        </Link>

        <div className="mt-6 flex items-baseline justify-between border-b border-ink-100 pb-4">
          <p className="eyebrow">Room {apartment.number}</p>
          <p className="font-serif text-2xl leading-[1.2] text-ink-300">{apartment.number}</p>
        </div>

        <h3 className="display mt-5 text-3xl text-ink-900 md:text-4xl">{apartment.name}</h3>
        <p className="mt-3 max-w-md text-ink-500">{apartment.summary}</p>

        <dl className="mt-6 grid grid-cols-3 gap-4">
          <SpecItem label="Beds" value={apartment.bedConfiguration} />
          <SpecItem label="Guests" value={apartment.maxOccupancy ? `Up to ${apartment.maxOccupancy}` : undefined} />
          <SpecItem label="Size" value={apartment.sizeSqm ? `${apartment.sizeSqm} m²` : undefined} />
        </dl>

        <Link to={`/apartments/${apartment.slug}`} className="link-line mt-8 text-ink-900">
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </article>
    </Reveal>
  );
}

export default function ApartmentCollection() {
  return (
    <section className="bg-paper py-32 md:py-44">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal>
            <p className="eyebrow">The apartment collection</p>
            <h2 className="display mt-6 max-w-3xl text-[clamp(2.5rem,5vw,4.75rem)] text-ink-900">
              Explore all nine <span className="italic text-gold">rooms.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-sm text-ink-500">
              Open any room to view its gallery, stay essentials, amenities and booking information.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-24 md:grid-cols-12 md:gap-y-28">
          {apartments.map((apartment, index) => (
            <ApartmentCard key={apartment.slug} apartment={apartment} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
