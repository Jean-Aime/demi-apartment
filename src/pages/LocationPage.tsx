import { ArrowUpRight, Mail, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import ReservationCta from '@/components/sections/ReservationCta';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';
import { media } from '@/data/media';
import { usePropertySettings } from '@/hooks/usePropertySettings';

const MAP_EMBED_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=30.0950%2C-1.9450%2C30.1250%2C-1.9200&layer=mapnik';
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Kimironko+Kigali+Rwanda';

export default function LocationPage() {
  const contact = usePropertySettings();

  return (
    <main>
      <PageHeader
        eyebrow="The location"
        title={
          <>
            Kimironko, <span className="italic text-gold-light">Kigali.</span>
          </>
        }
        intro="A residential address in one of Kigali’s established neighbourhoods, with the privacy of an apartment and the city within reach."
        image={media.kigali}
        meta="Kimironko · Kigali · Rwanda"
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <div className="md:col-span-5">
            <Reveal>
              <SectionLabel index="01">The neighbourhood</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.4rem,4.2vw,4rem)] text-ink-900">
                A quieter side of <span className="italic text-gold-ink">the city.</span>
              </h2>
              <p className="mt-6 text-[0.975rem] leading-[1.85] text-ink-500">
                DEMI APARTMENT is located in Kimironko, Kigali. The property is arranged into three apartment groups with eight private bedrooms
                private apartments — an address to return to after a day in the city, rather than a lobby to pass
                through.
              </p>
              <p className="mt-4 text-[0.975rem] leading-[1.85] text-ink-500">
                We do not publish walking distances or travel times unless the property has verified them. For
                arrival planning, use the directions link below or contact the team directly.
              </p>

              <div className="mt-8 border-t border-ink-200 pt-6">
                <p className="eyebrow text-gold-ink">Address</p>
                <p className="mt-3 flex items-start gap-3 font-display text-[1.5rem] leading-snug text-ink-900">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold-ink" strokeWidth={1.5} aria-hidden="true" />
                  {contact.address}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
                  <a
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold"
                  >
                    Get directions
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <Link to="/contact" className="link-line text-ink-900">
                    Contact the team
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="md:col-span-6 md:col-start-7">
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden border border-ink-900/10 bg-paper-warm md:aspect-[5/4]">
                <iframe
                  src={MAP_EMBED_URL}
                  title="Map of Kimironko, Kigali"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0 grayscale-[30%] contrast-[1.02]"
                />
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 border-b border-r border-gold-bronze/60" />
              <p className="mt-4 font-sans text-[0.6rem] uppercase tracking-[0.22em] text-ink-400">
                Neighbourhood map · approximate
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-7">
              <SectionLabel index="02">Arriving</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.3rem,4vw,3.75rem)] text-ink-900">
                The practical <span className="italic text-gold-ink">particulars.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="md:col-span-4 md:col-start-9">
              <p className="text-[0.9rem] leading-[1.85] text-ink-500">
                Contact the property before travelling if you need assistance with your arrival.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            {[
              {
                icon: MapPin,
                label: 'Address',
                body: contact.address,
                action: { label: 'Open in maps', href: DIRECTIONS_URL, external: true },
              },
              {
                icon: Mail,
                label: 'Reservations',
                body: contact.email,
                action: { label: 'Send an email', href: `mailto:${contact.email}`, external: false },
              },
              {
                icon: Navigation,
                label: 'Directions',
                body: 'Open turn-by-turn directions to Kimironko, Kigali in Google Maps.',
                action: { label: 'Get directions', href: DIRECTIONS_URL, external: true },
              },
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 100}>
                <article className="group h-full border border-ink-200/70 bg-paper p-6 transition-colors duration-500 hover:border-gold-bronze/60">
                  <item.icon className="h-5 w-5 text-gold-ink" strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-6 font-display text-[1.6rem] text-ink-900">{item.label}</h3>
                  <p className="mt-3 break-words text-[0.9rem] leading-[1.8] text-ink-500">{item.body}</p>
                  <a
                    href={item.action.href}
                    target={item.action.external ? '_blank' : undefined}
                    rel={item.action.external ? 'noreferrer' : undefined}
                    className="link-line mt-6 text-ink-900"
                  >
                    {item.action.label}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-4 sm:grid-cols-12 md:gap-6">
            <Reveal className="sm:col-span-6">
              <EditorialImage src={media.architectureSide.src} alt={media.architectureSide.alt} aspect="4/3" label="The building" />
            </Reveal>
            <Reveal delay={100} className="sm:col-span-3">
              <EditorialImage src={media.kigali.src} alt={media.kigali.alt} aspect="3/4" label="Terrace" />
            </Reveal>
            <Reveal delay={180} className="sm:col-span-3 sm:pt-12">
              <EditorialImage src={media.architectureDetail.src} alt={media.architectureDetail.alt} aspect="3/4" label="Detail" />
            </Reveal>
          </div>
        </div>
      </section>

      <ReservationCta
        eyebrow="Plan your stay"
        title="A city, and a quiet return."
        body="Choose your dates and a residence, then let the team confirm the details of your arrival."
        image={media.hero}
      />
    </main>
  );
}
