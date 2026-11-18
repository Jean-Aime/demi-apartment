import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';

/** The signature gold field of the site: large, flat, and typographic. */
export default function Architecture() {
  return (
    <section className="relative overflow-hidden bg-gold text-ink-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full border border-ink-900/10"
      />
      <div className="relative mx-auto max-w-site px-5 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16">
        <div className="grid gap-10 md:grid-cols-12 md:items-end md:gap-x-8">
          <div className="md:col-span-7">
            <Reveal>
              <SectionLabel index="05" className="!text-ink-900/60">Architecture and interiors</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.7rem,5.4vw,5.25rem)] text-ink-900">
                Proportion, light and <span className="italic">material.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-4 md:col-start-9">
            <p className="border-t border-ink-900/25 pt-5 text-[0.95rem] leading-[1.85] text-ink-900/70">
              Buildings composed with restraint, so the interiors can feel calm, private and entirely unhurried.
            </p>
            <Link to="/about" className="link-line mt-6 text-ink-900">
              Read about the property
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-12 md:mt-20 md:gap-6">
          <Reveal className="sm:col-span-7">
            <EditorialImage
              src={media.architecture.src}
              alt={media.architecture.alt}
              label="Form and facade"
              aspect="16/10"
            />
          </Reveal>
          <Reveal delay={120} className="sm:col-span-5 sm:pt-12">
            <EditorialImage
              src={media.architectureDetail.src}
              alt={media.architectureDetail.alt}
              label="Balcony detail"
              aspect="4/5"
            />
          </Reveal>
          <Reveal delay={200} className="sm:col-span-4 sm:col-start-2">
            <EditorialImage
              src={media.architectureSide.src}
              alt={media.architectureSide.alt}
              label="Facade at dusk"
              aspect="4/3"
            />
          </Reveal>
          <Reveal delay={260} className="sm:col-span-4 sm:col-start-7 sm:pt-10">
            <p className="font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.2] text-ink-900">
              Terraced balconies, full-height glazing and a palette held to warm neutrals and deep metal.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
