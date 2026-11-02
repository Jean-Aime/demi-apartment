import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

export default function Architecture() {
  return (
    <section className="relative overflow-hidden bg-paper py-32 text-ink-900 md:py-44">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <Reveal>
          <p className="eyebrow">Architecture and interiors</p>
          <h2 className="display mt-6 max-w-3xl text-[clamp(2.5rem,5vw,4.75rem)] text-ink-900">
            Proportion, light and <span className="italic text-gold">material.</span>
          </h2>
        </Reveal>

        <div className="relative mt-20 md:mt-28">
          <Reveal>
            <figure className="media-frame">
              <div className="aspect-[4/3] overflow-hidden md:aspect-[21/9]">
                <img
                  src={media.architecture.src}
                  alt={media.architecture.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-400">Form and facade</figcaption>
            </figure>
          </Reveal>

          <Reveal delay={200} className="mt-10 md:absolute md:-bottom-[14%] md:right-[8%] md:mt-0 md:w-[28%]">
            <figure className="media-frame border-[10px] border-paper bg-paper">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={media.architectureDetail.src}
                  alt={media.architectureDetail.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </figure>
          </Reveal>
        </div>

        <div className="mt-40 grid gap-16 md:mt-64 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-5 md:col-start-2">
            <figure className="media-frame">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={media.architectureSide.src}
                  alt={media.architectureSide.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-400">Geometry at dusk</figcaption>
            </figure>
          </Reveal>
          <Reveal delay={150} className="md:col-span-4 md:col-start-8">
            <p className="font-serif text-2xl leading-[1.2] text-ink-800 md:text-3xl">
              Buildings composed with restraint, so that the interiors can feel calm, private and entirely unhurried.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
