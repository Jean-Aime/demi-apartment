import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';
import SectionLabel from '@/components/ui/SectionLabel';
import Reveal from '@/components/Reveal';
import { EASE } from '@/lib/motion';

interface ResidenceIndexProps {
  tone?: 'paper' | 'warm';
}

/**
 * The eight-bedroom collection as a typographic index. On pointer devices a
 * photograph follows the hovered row; on touch, each row carries a thumbnail.
 */
export default function ResidenceIndex({ tone = 'paper' }: ResidenceIndexProps) {
  const { apartments } = useApartments();
  const [active, setActive] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const background = tone === 'warm' ? 'bg-paper-warm' : 'bg-paper';

  return (
    <section className={`${background} py-20 md:py-28`}>
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
          <div className="md:col-span-7">
            <Reveal>
              <SectionLabel index="04">The complete collection</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.7rem,5vw,5rem)] text-ink-900">
                Eight bedrooms. <span className="italic text-gold-ink">Three apartments.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={100} className="md:col-span-4 md:col-start-9">
            <p className="text-[0.95rem] leading-[1.85] text-ink-500">
              A1 through C2. Each private bedroom is listed individually, with only the details the property has verified.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-12 border-t border-ink-300/60">
          <ul onMouseLeave={() => setActive(null)}>
            {apartments.map((room, index) => (
              <li key={room.slug} className="border-b border-ink-300/60">
                <Link
                  to={getApartmentPath(room)}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className="group grid grid-cols-[2.5rem_1fr_2rem] items-center gap-4 py-5 sm:grid-cols-[3rem_1fr_auto_2rem] sm:gap-6 md:py-6"
                >
                  <span className="font-display text-[0.9rem] italic tabular-nums text-gold-ink/70">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="flex min-w-0 items-center gap-4">
                    <span className="hidden h-16 w-14 shrink-0 overflow-hidden bg-paper-muted sm:block lg:hidden">
                      <img
                        src={room.photo.src}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[1.7rem] leading-none tracking-[-0.02em] text-ink-900 transition-colors duration-500 group-hover:text-gold-ink sm:text-[2.1rem]">
                        Residence {room.name}
                      </span>
                      <span className="mt-2 block font-sans text-[0.65rem] uppercase tracking-[0.16em] text-ink-400">
                        {room.maxOccupancy ? `Up to ${room.maxOccupancy} guests` : 'Details on request'}
                        <span className="mx-2 text-gold-bronze" aria-hidden="true">·</span>
                        {room.bookingEnabled ? 'Instant booking' : 'By request'}
                      </span>
                    </span>
                  </span>

                  <span className="hidden sm:block">
                    <span className="font-sans text-[0.62rem] uppercase tracking-[0.18em] text-ink-400">
                      {room.bedrooms ? `${room.bedrooms} bedroom${room.bedrooms > 1 ? 's' : ''}` : 'Apartment'}
                    </span>
                  </span>

                  <ArrowUpRight className="h-4 w-4 justify-self-end text-ink-400 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold-ink" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[14%] top-1/2 hidden -translate-y-1/2 lg:block"
          >
            <AnimatePresence mode="popLayout">
              {active !== null && apartments[active] && (
                <motion.div
                  key={apartments[active].slug}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, rotate: -1.5 }}
                  animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE } }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="w-[16rem] bg-paper p-2 shadow-plate"
                >
                  <img
                    src={apartments[active].photo.src}
                    alt={apartments[active].photo.alt}
                    className="h-[20rem] w-full object-cover"
                  />
                  <p className="px-1 py-2 font-sans text-[0.55rem] uppercase tracking-[0.22em] text-ink-500">
                    {apartments[active].name} · Kimironko
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Reveal delay={120} className="mt-10">
          <Link to="/apartments" className="btn-outline">
            Explore all eight bedrooms
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
