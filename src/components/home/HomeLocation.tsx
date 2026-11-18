import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { media } from '@/data/media';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';
import { usePropertySettings } from '@/hooks/usePropertySettings';

const MAP_EMBED_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=30.0950%2C-1.9450%2C30.1250%2C-1.9200&layer=mapnik';
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Kimironko+Kigali+Rwanda';

export default function HomeLocation() {
  const contact = usePropertySettings();

  return (
    <section className="bg-paper-warm py-20 md:py-28">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-12 md:grid-cols-12 md:items-start md:gap-x-8">
          <div className="md:col-span-6">
            <Reveal>
              <SectionLabel index="08">The location</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.6rem,4.8vw,4.75rem)] text-ink-900">
                Kimironko, <span className="italic text-gold-ink">Kigali.</span>
              </h2>
              <p className="mt-7 max-w-lg text-[0.975rem] leading-[1.85] text-ink-500">
                DEMI APARTMENT sits in Kimironko, a neighbourhood of Kigali. Staying here means the privacy of a
                residence with the city within reach — and a quiet address to return to at the end of the day.
              </p>
              <p className="mt-5 flex items-start gap-3 text-[0.9rem] leading-relaxed text-ink-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" strokeWidth={1.5} aria-hidden="true" />
                <span>{contact.address}</span>
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link to="/location" className="link-line text-ink-900">
                  Explore the location
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="link-line text-ink-600 hover:text-ink-900"
                >
                  Open directions
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="md:col-span-5 md:col-start-8">
            <div className="relative">
              <div className="relative aspect-[5/4] overflow-hidden border border-ink-900/10 bg-paper">
                <iframe
                  src={MAP_EMBED_URL}
                  title="Map of Kimironko, Kigali"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0 grayscale-[35%] contrast-[1.02]"
                />
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 border-b border-r border-gold-bronze/60" />
              <p className="mt-4 font-sans text-[0.55rem] uppercase tracking-[0.24em] text-ink-400">
                Kimironko · Kigali · Rwanda
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 md:mt-20 md:gap-6">
          {[media.kigali, media.architectureSide, media.hero, media.architecture].map((photo, index) => (
            <Reveal key={photo.src} delay={index * 80}>
              <EditorialImage src={photo.src} alt={photo.alt} aspect="4/5" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
