import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';

const pillars = [
  {
    title: 'Designed interiors',
    body: 'Considered proportions, natural materials and warm light shape every residence.',
  },
  {
    title: 'Private by nature',
    body: 'Each of the nine apartments is self-contained, so the stay remains entirely your own.',
  },
  {
    title: 'Contemporary living',
    body: 'A calm, modern setting for rest, work and unhurried time in the city.',
  },
  {
    title: 'A personal welcome',
    body: 'Warm, attentive hospitality makes every arrival feel considered.',
  },
];

export default function Experience() {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-20 text-paper md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-52 top-1/3 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(231,169,35,0.12),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-12 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-4">
            <Reveal>
              <SectionLabel tone="light" index="02">The Demi experience</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.6rem,4.6vw,4.5rem)] text-paper">
                Comfort in the <span className="italic text-gold-light">details.</span>
              </h2>
              <p className="mt-7 max-w-sm text-[0.95rem] leading-[1.85] text-paper/60">
                Life at DEMI APARTMENT is quiet and intentional. The residences are made to be lived in, and the
                welcome is warm from the first moment.
              </p>
              <Link to="/experience" className="link-line mt-8 text-gold-light">
                Discover the experience
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <ol className="grid gap-x-10 sm:grid-cols-2">
              {pillars.map((pillar, index) => (
                <Reveal key={pillar.title} delay={index * 80}>
                  <li className="group border-t border-paper/15 py-6 transition-colors duration-500 hover:border-gold-light/60">
                    <span className="font-display text-[0.95rem] italic tabular-nums text-gold-light/70">
                      0{index + 1}
                    </span>
                    <h3 className="mt-4 font-display text-[1.7rem] leading-[1.15] tracking-[-0.01em] text-paper">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 max-w-xs text-[0.9rem] leading-[1.8] text-paper/55">{pillar.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-12 md:mt-20 md:gap-6">
          <Reveal className="sm:col-span-7">
            <EditorialImage
              src={media.experienceLarge.src}
              alt={media.experienceLarge.alt}
              tone="light"
              label="Kitchen and living"
              aspect="16/11"
            />
          </Reveal>
          <Reveal delay={120} className="sm:col-span-5 sm:pt-14">
            <EditorialImage
              src={media.experienceSmall.src}
              alt={media.experienceSmall.alt}
              tone="light"
              label="Living space"
              aspect="4/3"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
