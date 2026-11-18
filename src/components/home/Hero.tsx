import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { media } from '@/data/media';
import SectionLabel from '@/components/ui/SectionLabel';
import { EASE } from '@/lib/motion';

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const line = (delay: number) => ({
    initial: reduceMotion ? false : { y: '112%' },
    animate: { y: 0 },
    transition: { duration: 1.15, delay, ease: EASE },
  });

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink-900 text-paper">
      <motion.img
        src={media.hero.src}
        alt={media.hero.alt}
        initial={reduceMotion ? false : { scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3, ease: EASE }}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,8,0.9)_0%,rgba(8,8,8,0.52)_46%,rgba(8,8,8,0.08)_100%),linear-gradient(0deg,rgba(8,8,8,0.9)_0%,rgba(8,8,8,0.15)_46%,rgba(8,8,8,0.35)_100%)]"
      />

      <span
        aria-hidden="true"
        className="vertical-label absolute right-6 top-1/3 hidden font-sans text-[0.55rem] uppercase tracking-[0.42em] text-paper/40 lg:block"
      >
        Nine private residences · Kigali
      </span>

      <div className="relative mx-auto w-full max-w-site px-5 pb-10 pt-36 sm:px-6 md:px-12 md:pb-12 lg:px-16">
        <div className="max-w-5xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          >
            <SectionLabel tone="light">Kimironko · Kigali · Rwanda</SectionLabel>
          </motion.div>

          <h1 className="display-tight mt-6 text-[clamp(3.1rem,8.6vw,8.75rem)] text-paper">
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span className="block" {...line(0.25)}>
                An elevated
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span className="block" {...line(0.38)}>
                way to <span className="italic text-gold-light">stay.</span>
              </motion.span>
            </span>
          </h1>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="mt-10 grid gap-8 border-t border-paper/20 pt-7 md:mt-14 md:grid-cols-12 md:items-start md:gap-x-8"
        >
          <div className="md:col-span-5">
            <p className="max-w-md text-[0.975rem] leading-[1.85] text-paper/80">
              Nine private serviced residences in Kimironko, shaped by light, material and quiet hospitality. A
              considered address for a stay that feels entirely your own.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link to="/apartments" className="btn-gold group">
                Explore the residences
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link to="/experience" className="link-line text-paper/80 hover:text-gold-light">
                The experience
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <div className="surface-gold p-5 text-ink-900 md:p-6">
              <p className="eyebrow text-ink-900/60">The collection</p>
              <p className="mt-3 font-display text-[2rem] leading-none tracking-[-0.02em]">Nine residences</p>
              <div className="mt-4 flex items-center justify-between border-t border-ink-900/20 pt-3">
                <span className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em]">A1 — C3</span>
                <Link
                  to="/apartments"
                  aria-label="View all nine residences"
                  className="flex h-9 w-9 items-center justify-center border border-ink-900/30 transition-colors hover:bg-ink-900 hover:text-gold-light"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 flex items-center justify-between gap-6 text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-paper/45">
          <a href="#introduction" className="group inline-flex items-center gap-3 transition-colors hover:text-gold-light">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/25 transition-colors group-hover:border-gold-light">
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
            </span>
            Scroll to discover
          </a>
          <span className="hidden md:block">Direct reservations</span>
        </div>
      </div>
    </section>
  );
}
