import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';
import EditorialImage from '@/components/ui/EditorialImage';
import SectionLabel from '@/components/ui/SectionLabel';

export default function Introduction() {
  return (
    <section id="introduction" className="relative scroll-mt-24 overflow-hidden bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
          <div className="md:col-span-8">
            <Reveal>
              <SectionLabel index="01">A sense of place</SectionLabel>
              <h2 className="display mt-6 max-w-4xl text-[clamp(2.7rem,5.6vw,5.5rem)] text-ink-900">
                Where thoughtful design meets <span className="italic text-gold-ink">the art of living.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-3 md:col-start-10">
            <p className="border-t border-ink-200 pt-5 text-[0.95rem] leading-[1.85] text-ink-500">
              DEMI APARTMENT is a collection of eight private bedrooms arranged within three shared apartment environments in Kimironko, Kigali — designed for
              privacy, calm and a more personal way to stay.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-x-8">
          <Reveal className="md:col-span-5">
            <EditorialImage
              src={media.introTall.src}
              alt={media.introTall.alt}
              label="The residences"
              caption="Bedroom, natural light"
              aspect="4/5"
            />
          </Reveal>

          <div className="md:col-span-3 md:col-start-7 md:pt-24">
            <Reveal delay={100}>
              <p className="font-display text-[clamp(1.6rem,2.4vw,2.15rem)] leading-[1.18] tracking-[-0.01em] text-ink-800">
                “A private address composed for unhurried stays, where every arrival begins with a quiet sense of
                belonging.”
              </p>
            </Reveal>
            <Reveal delay={180} className="mt-8 border-t border-ink-200 pt-5">
              <p className="text-[0.9rem] leading-[1.85] text-ink-500">
                Proportion, warm light and considered interiors carry through the three apartment environments and all eight bedrooms, from the first
                threshold to the last evening.
              </p>
              <Link to="/about" className="link-line mt-6 text-ink-900">
                About the property
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <Reveal delay={200} className="md:col-span-2 md:col-start-11 md:pt-40">
            <EditorialImage
              src={media.kigali.src}
              alt={media.kigali.alt}
              aspect="3/4"
            />
          </Reveal>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-1/2 -z-0 -translate-x-1/2 select-none font-display text-[22vw] leading-none text-ink-900/[0.028]"
      >
        DEMI
      </span>
    </section>
  );
}
