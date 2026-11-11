import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

export default function Introduction() {
  return (
    <section id="introduction" className="scroll-mt-24 bg-paper-warm py-20 md:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
        <Reveal className="md:col-span-5 md:pt-24">
          <figure className="relative md:pr-8">
            <div className="media-frame aspect-[4/5] overflow-hidden bg-paper-muted">
              <img src={media.introTall.src} alt={media.introTall.alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-ink-400">
              <span>Residence interior</span>
              <span className="text-gold-deep">01 / 09</span>
            </figcaption>
            <span className="absolute -bottom-8 -right-2 hidden font-serif text-[8rem] leading-none text-gold/15 md:block" aria-hidden="true">
              D
            </span>
          </figure>
        </Reveal>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal>
            <p className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
              A sense of place
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display mt-7 text-[clamp(2.8rem,5.2vw,5.25rem)] text-ink-900">
              Where thoughtful design meets <span className="italic text-gold-deep">the art of living.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-9 max-w-xl space-y-5 border-l border-gold/50 pl-6 text-base leading-relaxed text-ink-600 md:mt-12 md:text-lg">
              <p>
                Welcome to DEMI APARTMENT: a considered place to arrive, settle in and find your own rhythm.
              </p>
              <p>
                Explore the rooms, learn about the property and get in touch with our team whenever you are ready.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
