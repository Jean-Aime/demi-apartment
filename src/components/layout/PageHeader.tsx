import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Photo } from '@/data/media';
import { EASE } from '@/lib/motion';
import SectionLabel from '@/components/ui/SectionLabel';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  image: Photo;
  meta?: string;
}

/**
 * Interior-page hero: full-bleed photography, an asymmetric baseline,
 * and type that sits low in the frame rather than in the centre.
 */
export default function PageHeader({ eyebrow, title, intro, image, meta }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[76svh] items-end overflow-hidden bg-ink-900 pb-12 pt-36 text-paper md:min-h-[82svh] md:pb-16 md:pt-40">
      <motion.img
        src={image.src}
        alt={image.alt}
        initial={reduceMotion ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.2, ease: EASE }}
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,8,0.86)_0%,rgba(8,8,8,0.38)_62%,rgba(8,8,8,0.18)_100%),linear-gradient(0deg,rgba(8,8,8,0.86)_0%,rgba(8,8,8,0.12)_58%,rgba(8,8,8,0.32)_100%)]"
      />

      <div className="mx-auto w-full max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          className="grid gap-10 md:grid-cols-12 md:items-end md:gap-x-8"
        >
          <div className="md:col-span-8">
            <SectionLabel tone="light">{eyebrow}</SectionLabel>
            <h1 className="display mt-6 max-w-4xl text-[clamp(2.9rem,6vw,6rem)] text-paper">{title}</h1>
            <div className="rule-light mt-8 w-40" aria-hidden="true" />
          </div>

          <div className="md:col-span-4 md:col-start-9 md:pb-1">
            {intro ? (
              <p className="border-l border-gold/70 pl-5 text-[0.95rem] leading-[1.8] text-paper/75 md:text-base">
                {intro}
              </p>
            ) : null}
            {meta ? (
              <p className="mt-6 font-sans text-[0.6rem] font-medium uppercase tracking-[0.24em] text-paper/45">
                {meta}
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>

      <span
        aria-hidden="true"
        className="vertical-label absolute right-5 top-40 hidden font-sans text-[0.55rem] uppercase tracking-[0.4em] text-paper/35 lg:block"
      >
        Demi Apartment · Kimironko
      </span>
    </section>
  );
}
