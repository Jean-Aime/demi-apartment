import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink-900 text-paper">
      <img
        src={media.hero.src}
        alt={media.hero.alt}
        className="hero-media absolute inset-0 h-full w-full object-cover object-center opacity-55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,13,11,0.88)_0%,rgba(14,13,11,0.55)_48%,rgba(14,13,11,0.18)_100%),linear-gradient(0deg,rgba(14,13,11,0.72),transparent_58%)]"
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-36 pt-36 md:px-12 md:pb-40 lg:px-16">
        <div className="max-w-6xl">
          <Reveal>
            <p className="eyebrow inline-flex items-center gap-3 text-gold-light">
              <span className="h-px w-8 bg-gold-light" aria-hidden="true" />
              A private residence in Kigali
            </p>
          </Reveal>
          <Reveal delay={140}>
            <h1 className="display mt-7 max-w-6xl text-[clamp(2.7rem,7.5vw,7.5rem)] text-paper">
              <span className="block whitespace-nowrap">
                An elevated <span className="italic text-gold-light">way</span>
              </span>
              <span className="block">to stay.</span>
            </h1>
          </Reveal>
          <Reveal delay={260}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-paper/75 md:text-lg">
              Discover contemporary residences in Kimironko, shaped for privacy, thoughtful comfort and a more personal stay.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link
                to="/apartments"
                className="btn-gold group inline-flex items-center gap-3 px-7 py-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
              >
                Explore residences
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link to="/experience" className="link-line text-paper/85">
                The DEMI experience
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-36 right-16 hidden lg:block">
          <Reveal delay={320}>
            <p className="border-l border-gold/70 pl-5 text-xs uppercase leading-[1.8] tracking-[0.16em] text-paper/70">
              Nine considered residences
              <br />
              Kimironko · Kigali · Rwanda
            </p>
          </Reveal>
        </div>
      </div>

      <a
        href="#introduction"
        className="absolute bottom-7 left-6 inline-flex items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-paper/65 transition-colors hover:text-gold-light md:left-12 lg:left-16"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/25">
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        Scroll to discover
      </a>
    </section>
  );
}
