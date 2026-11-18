import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';

const layout = [
  'md:col-span-6',
  'md:col-span-3 md:mt-24 md:col-start-7',
  'md:col-span-3 md:col-start-10 md:mt-48',
];

const frames = ['4/5', '3/4', '3/4'] as const;

export default function HomeApartmentShowcase() {
  const { apartments } = useApartments();
  const featuredRooms = [apartments[1], apartments[4], apartments[7]].filter(Boolean);
  if (featuredRooms.length === 0) return null;

  return (
    <section className="overflow-hidden bg-paper-warm py-20 md:py-28">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
          <div className="md:col-span-7">
            <Reveal>
              <SectionLabel index="03">Featured accommodation</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.7rem,5vw,5rem)] text-ink-900">
                A closer look at <span className="italic text-gold-ink">the residences.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-4 md:col-start-9">
            <p className="border-t border-ink-300/60 pt-5 text-[0.95rem] leading-[1.85] text-ink-500">
              Three of the nine apartments. Open any residence for its own photography, verified details and
              booking options.
            </p>
            <Link to="/apartments" className="link-line mt-5 text-ink-900">
              View the full collection
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-12">
          {featuredRooms.map((room, index) => (
            <Reveal key={room.slug} delay={index * 110} className={layout[index]}>
              <Link to={getApartmentPath(room)} className="group block">
                <div className="relative">
                  <EditorialImage src={room.photo.src} alt={room.photo.alt} aspect={frames[index]} />
                  <span className="absolute left-0 top-0 flex items-center gap-2 bg-paper/95 px-3 py-2 font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-800">
                    {String(index + 1).padStart(2, '0')} / {String(featuredRooms.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-5 flex items-start justify-between gap-5 border-b border-ink-300/50 pb-4">
                  <div>
                    <p className="eyebrow text-gold-ink">Residence {room.number}</p>
                    <h3 className="display mt-2 text-[2rem] text-ink-900 md:text-[2.4rem]">{room.name}</h3>
                  </div>
                  <ArrowUpRight className="mt-2 h-4 w-4 shrink-0 text-ink-500 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold-ink" aria-hidden="true" />
                </div>
                <p className="mt-4 max-w-sm text-[0.9rem] leading-[1.8] text-ink-500">{room.summary}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
