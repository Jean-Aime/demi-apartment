import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { media } from '@/data/media';
import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import { usePropertySettings } from '@/hooks/usePropertySettings';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Kimironko+Kigali+Rwanda';
const MAP_EMBED_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=30.0950%2C-1.9450%2C30.1250%2C-1.9200&layer=mapnik';

export default function ContactPage() {
  const contact = usePropertySettings();
  const channels = [
    { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { icon: Phone, label: 'Telephone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
    { icon: MapPin, label: 'Address', value: contact.address, href: DIRECTIONS_URL },
  ];

  return (
    <main>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            We would be glad to <span className="italic text-gold">hear from you.</span>
          </>
        }
        intro="Questions about a residence, your dates or your arrival? Reach the team directly, or send a booking request and we will respond."
        image={media.kigali}
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
          <div className="grid gap-12 md:grid-cols-3 md:gap-x-8">
            {channels.map((channel, index) => (
              <Reveal key={channel.label} delay={index * 120}>
                <a
                  href={channel.href}
                  target={channel.href.startsWith('http') ? '_blank' : undefined}
                  rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="group block border-t border-ink-100 pt-8 transition-colors duration-500 hover:border-gold"
                >
                  <channel.icon className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
                  <p className="eyebrow mt-6">{channel.label}</p>
                    <p className="mt-4 flex items-start gap-2 font-serif text-xl leading-[1.2] text-ink-900 sm:text-2xl">
                      <span className="min-w-0 break-words">{channel.value}</span>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
                  </p>
                </a>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
          <div className="grid gap-16 md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-4">
              <Reveal>
                <p className="eyebrow">Location</p>
                <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.25rem)] text-ink-900">
                  Kimironko, <span className="italic text-gold">Kigali.</span>
                </h2>
                <p className="mt-8 text-base text-ink-500 md:text-lg">
                  DEMI APARTMENT sits in Kimironko, Kigali, offering the privacy of a residence with the city within reach.
                </p>
              </Reveal>

              <Reveal delay={150}>
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline group mt-10 inline-flex items-center justify-center gap-3 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em]"
                >
                  Get directions
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </a>
              </Reveal>
            </div>

            <Reveal delay={200} className="md:col-span-7 md:col-start-6">
              <div className="relative aspect-[4/3] overflow-hidden bg-paper-muted sm:aspect-[16/10] md:aspect-auto md:h-[560px]">
                <iframe
                  src={MAP_EMBED_URL}
                  title="Map of Kimironko, Kigali"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0 grayscale-[20%] contrast-[1.05]"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
