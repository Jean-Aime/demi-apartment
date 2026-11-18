import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

interface ReservationCtaProps {
  eyebrow?: string;
  title?: string;
  body?: string;
  image?: { src: string; alt: string };
}

export default function ReservationCta({
  eyebrow = 'Reservations',
  title = 'Begin with a date.',
  body = 'Search the live residence calendar, choose the apartment that suits your stay, and send your details. The team takes it from there.',
  image = media.finalCta,
}: ReservationCtaProps) {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-full w-[40rem] bg-[radial-gradient(ellipse_at_center,rgba(231,169,35,0.13),transparent_65%)]"
      />
      <div className="relative mx-auto grid max-w-site gap-0 md:grid-cols-12">
        <div className="px-5 py-16 sm:px-6 md:col-span-7 md:px-12 md:py-24 lg:px-16">
          <Reveal>
            <SectionLabel tone="light">{eyebrow}</SectionLabel>
            <h2 className="display mt-6 max-w-xl text-[clamp(3rem,6vw,5.75rem)] text-paper">
              {title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="italic text-gold-light">{title.split(' ').slice(-1)}</span>
            </h2>
            <p className="mt-7 max-w-md text-[0.975rem] leading-[1.85] text-paper/65">{body}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link to="/booking" className="btn-gold group">
                Check availability
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link to="/contact" className="link-line text-paper/80 hover:text-gold-light">
                Speak with the team
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120} className="relative min-h-[22rem] md:col-span-5 md:min-h-full">
          <div className="h-full min-h-[22rem] overflow-hidden md:min-h-[34rem]">
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="h-full min-h-[22rem] w-full object-cover md:min-h-[34rem]"
            />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-4 border border-gold-light/25 md:inset-6" />
        </Reveal>
      </div>
    </section>
  );
}
