import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

export default function Introduction() {
  return (
    <section className="bg-paper-warm py-20 md:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
        <Reveal className="md:col-span-5 md:pt-24">
          <figure className="relative">
            <div className="media-frame aspect-[4/5] overflow-hidden">
              <img src={media.introTall.src} alt={media.introTall.alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-400">Residence interior</figcaption>
          </figure>
        </Reveal>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal>
            <p className="eyebrow">Introduction</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.75rem)] text-ink-900">
              Where thoughtful design meets <span className="italic text-gold">the art of living.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-10 space-y-6 text-base leading-[1.5] text-ink-500 md:text-lg">
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
