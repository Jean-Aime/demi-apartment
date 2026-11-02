import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink-900 text-paper"
    >
      <img
        src={media.hero.src}
        alt={media.hero.alt}
        fetchPriority="high"
        className="hero-media absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-ink-900/30"
      />

      <div className="relative mx-auto grid w-full max-w-[1440px] justify-items-center gap-8 px-6 py-32 text-center md:px-12 lg:px-16">
        <div className="max-w-5xl">
          <Reveal>
            <p className="eyebrow text-gold-light">Demi Apartment</p>
          </Reveal>
          <Reveal delay={150}>
            <h1 className="display mt-6 max-w-full whitespace-nowrap text-[clamp(1rem,6.3vw,8.5rem)] text-paper">
              An elevated <span className="italic text-gold">way</span> to stay.
            </h1>
          </Reveal>
        </div>

        <div className="flex justify-center">
          <Reveal delay={300}>
            <p className="mx-auto max-w-2xl text-base leading-[1.5] text-paper/70 md:text-lg">
              Discover a considered expression of contemporary living. Experience the privacy of a residence,
              the comfort of thoughtful design and the warmth of exceptional hospitality.
            </p>
          </Reveal>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-paper/50 md:flex"
      >
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.35em]">Scroll</span>
        <span className="relative block h-14 w-px overflow-hidden bg-paper/20">
          <span className="absolute inset-0 origin-top animate-scroll-line bg-gold" />
        </span>
      </div>
    </section>
  );
}
