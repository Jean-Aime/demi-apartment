import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';
import { useApartments } from '@/hooks/useApartments';

export default function HomeApartmentShowcase() {
  const { apartments } = useApartments();
  const featuredRooms = [apartments[1], apartments[4], apartments[7]].filter(Boolean);
  if (featuredRooms.length === 0) return null;

  return (
    <section className="overflow-hidden bg-ink-900 py-16 text-paper md:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="grid gap-10 border-b border-paper/15 pb-10 md:grid-cols-12 md:items-end md:gap-x-8">
          <Reveal className="md:col-span-7">
            <p className="eyebrow text-gold-light">The room collection · 01—09</p>
            <h2 className="display mt-5 text-[clamp(2.75rem,6vw,5.75rem)] text-paper">
              Find your <span className="italic text-gold">own space.</span>
            </h2>
          </Reveal>
          <Reveal delay={120} className="md:col-span-4 md:col-start-9 md:pb-2">
            <p className="max-w-sm text-base leading-relaxed text-paper/65">
              Nine individual rooms to explore. Select a photograph to open that room’s details.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <Link
              to={`/apartments/${featuredRooms[0].slug}`}
              className="group relative block min-h-[430px] overflow-hidden bg-ink-800 md:h-full md:min-h-[590px]"
            >
              <img
                src={featuredRooms[0].photo.src}
                alt={featuredRooms[0].photo.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/10 to-ink-900/10" aria-hidden="true" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-8">
                <span>
                  <span className="block text-xs font-medium uppercase tracking-[0.24em] text-gold-light">
                    Room {featuredRooms[0].number}
                  </span>
                  <span className="display mt-2 block text-3xl text-paper md:text-4xl">{featuredRooms[0].name}</span>
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-paper/50 text-paper transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-ink-900">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </Reveal>

          <div className="grid gap-6 md:col-span-5">
            {featuredRooms.slice(1).map((room, index) => (
              <Reveal key={room.slug} delay={(index + 1) * 120}>
              <Link
                to={`/apartments/${room.slug}`}
                className="group relative block min-h-[300px] overflow-hidden bg-ink-800 md:min-h-[282px]"
              >
                <img
                  src={room.photo.src}
                  alt={room.photo.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/10 to-ink-900/10" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-8">
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-[0.24em] text-gold-light">
                      Room {room.number}
                    </span>
                    <span className="display mt-2 block text-3xl text-paper md:text-4xl">{room.name}</span>
                  </span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-paper/50 text-paper transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-ink-900">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={200} className="mt-10">
          <Link
            to="/apartments"
            className="link-line text-paper"
          >
            View all nine rooms
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
