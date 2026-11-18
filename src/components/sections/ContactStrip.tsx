import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePropertySettings } from '@/hooks/usePropertySettings';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

/** A single gold field: the accent surface appears once per page at most. */
export default function ContactStrip() {
  const contact = usePropertySettings();
  const directions = 'https://www.google.com/maps/dir/?api=1&destination=Kimironko+Kigali+Rwanda';

  return (
    <section className="surface-gold text-ink-900">
      <div className="mx-auto grid max-w-site gap-10 px-5 py-12 sm:px-6 md:grid-cols-12 md:items-end md:px-12 md:py-16 lg:px-16">
        <div className="md:col-span-5">
          <Reveal>
            <SectionLabel tone="dark" className="!text-ink-900/60">Stay in touch</SectionLabel>
            <h2 className="display mt-5 text-[clamp(2.2rem,4vw,3.5rem)] text-ink-900">
              A direct line to <span className="italic">the residence.</span>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={100} className="md:col-span-4 md:col-start-7">
          <dl className="space-y-4 border-t border-ink-900/20 pt-5 md:border-t-0 md:pt-0">
            <div>
              <dt className="eyebrow text-ink-900/55">Reservations</dt>
              <dd className="mt-2">
                <a href={`mailto:${contact.email}`} className="break-all font-display text-[1.35rem] leading-tight underline-offset-4 hover:underline">
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-900/55">Telephone</dt>
              <dd className="mt-2">
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="font-display text-[1.35rem] leading-tight underline-offset-4 hover:underline">
                  {contact.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-ink-900/55">Address</dt>
              <dd className="mt-2 text-[0.95rem] leading-relaxed text-ink-900/80">{contact.address}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={180} className="md:col-span-2 md:justify-self-end">
          <div className="flex flex-col gap-4">
            <Link to="/contact" className="btn-outline border-ink-900/40 text-ink-900 hover:bg-ink-900 hover:text-gold-light">
              Contact
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <a
              href={directions}
              target="_blank"
              rel="noreferrer"
              className="link-line text-ink-900/75 hover:text-ink-900"
            >
              Directions
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
