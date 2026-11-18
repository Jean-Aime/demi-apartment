import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media, apartmentDetailPhotos } from '@/data/media';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';

const notes = [
  { label: 'Space', detail: 'Self-contained apartments with their own living, kitchen and bathroom areas.' },
  { label: 'Light', detail: 'Full-height glazing and sheer curtains shape the day from morning to evening.' },
  { label: 'Privacy', detail: 'One residence per reservation, with no shared guest rooms.' },
];

export default function HomeComfort() {
  const dining = apartmentDetailPhotos[5] ?? media.introWide;

  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-12 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <Reveal>
                <SectionLabel index="06">Living at Demi</SectionLabel>
                <h2 className="display mt-6 text-[clamp(2.5rem,4vw,3.9rem)] text-ink-900">
                  The quiet luxury of a <span className="italic text-gold-ink">considered stay.</span>
                </h2>
                <p className="mt-6 max-w-sm text-[0.95rem] leading-[1.85] text-ink-500">
                  A residence rather than a room. The everyday rituals — coffee, a late dinner, an unhurried morning
                  — have space to happen properly.
                </p>
              </Reveal>

              <Reveal delay={120} className="mt-9">
                <ul className="border-t border-ink-200">
                  {notes.map((note) => (
                    <li key={note.label} className="border-b border-ink-200 py-4">
                      <p className="eyebrow text-gold-ink">{note.label}</p>
                      <p className="mt-2 text-[0.875rem] leading-[1.75] text-ink-600">{note.detail}</p>
                    </li>
                  ))}
                </ul>
                <Link to="/experience" className="link-line mt-8 text-ink-900">
                  Explore the experience
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <Reveal>
              <EditorialImage
                src={media.introWide.src}
                alt={media.introWide.alt}
                aspect="4/3"
                label="Living and dining"
                eager
              />
            </Reveal>
            <div className="mt-4 grid grid-cols-2 gap-4 md:mt-6 md:gap-6">
              <Reveal delay={100}>
                <EditorialImage
                  src={media.experienceLarge.src}
                  alt={media.experienceLarge.alt}
                  aspect="3/4"
                  label="Kitchen"
                />
              </Reveal>
              <Reveal delay={200} className="pt-10 md:pt-16">
                <EditorialImage src={dining.src} alt={dining.alt} aspect="3/4" label="Dining" />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
