import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

export default function HomeClosingFeature() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="grid overflow-hidden bg-paper-warm md:min-h-[520px] md:grid-cols-2">
          <Reveal className="media-frame min-h-[320px] overflow-hidden md:min-h-full">
            <img
              src={media.experienceSmall.src}
              alt={media.experienceSmall.alt}
              loading="lazy"
              className="h-full min-h-[320px] w-full object-cover md:min-h-[520px]"
            />
          </Reveal>

          <div className="flex items-center px-8 py-12 md:px-12 lg:px-20">
            <Reveal delay={120}>
              <p className="eyebrow">A place to settle in</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.5rem)] text-ink-900">
                Make room for <span className="italic text-gold">your stay.</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-ink-500">
                Take a closer look at the rooms, then send the team your preferred dates. They will review your request and follow up with you.
              </p>
              <Link
                to="/contact"
                className="btn-gold group mt-9 inline-flex items-center gap-3 px-7 py-4 text-xs font-medium uppercase tracking-[0.2em]"
              >
                Enquire about a stay
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
