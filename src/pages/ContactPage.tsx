import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ReservationCta from '@/components/sections/ReservationCta';
import EnquiryForm from '@/components/contact/EnquiryForm';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { media } from '@/data/media';
import { usePropertySettings } from '@/hooks/usePropertySettings';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Kimironko+Kigali+Rwanda';
const MAP_EMBED_URL =
  'https://www.openstreetmap.org/export/embed.html?bbox=30.0950%2C-1.9450%2C30.1250%2C-1.9200&layer=mapnik';

export default function ContactPage() {
  const contact = usePropertySettings();

  const channels = [
    { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}`, external: false },
    { icon: Phone, label: 'Telephone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}`, external: false },
    { icon: MapPin, label: 'Address', value: contact.address, href: DIRECTIONS_URL, external: true },
  ];

  return (
    <main>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            We would be glad to <span className="italic text-gold-light">hear from you.</span>
          </>
        }
        intro="Questions about a residence, your dates or your arrival? Reach the team directly before completing your booking."
        image={media.kigali}
        meta="Kimironko · Kigali · Rwanda"
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-7">
              <SectionLabel index="01">Direct contact</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.4rem,4.4vw,4.25rem)] text-ink-900">
                A direct line, <span className="italic text-gold-ink">no intermediaries.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="md:col-span-4 md:col-start-9">
              <p className="text-[0.95rem] leading-[1.85] text-ink-500">
                The team looks after the nine residences and answers reservation questions directly. Written enquiries
                are usually the quickest way to share dates and details.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 border-t border-ink-200">
            {channels.map((channel, index) => (
              <Reveal key={channel.label} delay={index * 80}>
                <a
                  href={channel.href}
                  target={channel.external ? '_blank' : undefined}
                  rel={channel.external ? 'noreferrer' : undefined}
                  className="group grid grid-cols-[2.5rem_1fr_2rem] items-center gap-4 border-b border-ink-200 py-7 sm:grid-cols-[4rem_1fr_auto_2rem] md:py-9"
                >
                  <channel.icon className="h-5 w-5 text-gold-ink" strokeWidth={1.5} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="eyebrow block text-ink-400">{channel.label}</span>
                    <span className="mt-2 block break-words font-display text-[clamp(1.4rem,2.6vw,2.15rem)] leading-tight text-ink-900 transition-colors duration-500 group-hover:text-gold-ink">
                      {channel.value}
                    </span>
                  </span>
                  <span className="hidden font-sans text-[0.6rem] uppercase tracking-[0.2em] text-ink-400 sm:block">
                    {index === 0 ? 'Write to us' : index === 1 ? 'Call the team' : 'Open in maps'}
                  </span>
                  <ArrowUpRight className="h-4 w-4 justify-self-end text-ink-400 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold-ink" aria-hidden="true" />
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <div className="md:col-span-4">
            <Reveal>
              <SectionLabel index="02">Write to us</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.3rem,3.8vw,3.5rem)] text-ink-900">
                Tell us about <span className="italic text-gold-ink">your stay.</span>
              </h2>
              <p className="mt-6 text-[0.95rem] leading-[1.85] text-ink-500">
                Share your preferred dates, the residence you are considering, or a question about the property. The
                form below prepares a message in your email app.
              </p>
              <dl className="mt-8 space-y-4 border-t border-ink-300/60 pt-6 text-[0.9rem]">
                <div>
                  <dt className="eyebrow text-ink-400">Email</dt>
                  <dd className="mt-1.5 break-all text-ink-800">{contact.email}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-ink-400">Telephone</dt>
                  <dd className="mt-1.5 text-ink-800">{contact.phone}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-ink-400">Address</dt>
                  <dd className="mt-1.5 text-ink-800">{contact.address}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal delay={120} className="md:col-span-7 md:col-start-6">
            <div className="border border-ink-200/70 bg-paper p-6 sm:p-8 md:p-10">
              <EnquiryForm email={contact.email} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-10 px-5 sm:px-6 md:grid-cols-12 md:items-center md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-5">
            <SectionLabel index="03">Finding us</SectionLabel>
            <h2 className="display mt-6 text-[clamp(2.3rem,3.8vw,3.5rem)] text-ink-900">
              Kimironko, <span className="italic text-gold-ink">Kigali.</span>
            </h2>
            <p className="mt-6 text-[0.95rem] leading-[1.85] text-ink-500">
              The map below shows the Kimironko area. Use the directions link for turn-by-turn navigation, or contact
              the team if you would like help planning your arrival.
            </p>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-gold mt-8 w-fit"
            >
              Get directions
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Reveal>
          <Reveal delay={120} className="md:col-span-6 md:col-start-7">
            <div className="aspect-[4/3] overflow-hidden border border-ink-200/70 bg-paper-warm">
              <iframe
                src={MAP_EMBED_URL}
                title="Map of Kimironko, Kigali"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0 grayscale-[30%] contrast-[1.02]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <ReservationCta
        eyebrow="Reservations"
        title="Ready when you are."
        body="Check the residence calendar for your dates, or send the team a note and they will help."
        image={media.experienceSmall}
      />
    </main>
  );
}
