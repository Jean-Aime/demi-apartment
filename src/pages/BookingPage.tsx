import { ArrowRight, CalendarCheck, Mail, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import BookingForm from '@/components/booking/BookingForm';
import Beds24BookingWidget from '@/components/booking/Beds24BookingWidget';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import Accordion from '@/components/ui/Accordion';
import { media } from '@/data/media';
import { useApartments } from '@/hooks/useApartments';
import { faqs } from '@/data/faqs';

const steps = [
  {
    number: '01',
    title: 'Choose your dates',
    body: 'Select check-in and check-out, then tell us how many adults and children are travelling.',
  },
  {
    number: '02',
    title: 'Select a residence',
    body: 'We check the website calendar for each apartment and show what is available for your stay.',
  },
  {
    number: '03',
    title: 'Review and send',
    body: 'Add your details, review the estimate, and either hold the dates or send a request to the team.',
  },
];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const { apartments } = useApartments();
  const requestedSlug = searchParams.get('apartment') ?? undefined;
  const beds24Ready =
    Boolean(import.meta.env.VITE_BEDS24_BOOKING_URL) &&
    apartments.length > 0 &&
    apartments.every((apartment) => apartment.bookingEnabled);

  return (
    <main>
      <PageHeader
        eyebrow="Direct reservations"
        title={
          <>
            Book your <span className="italic text-gold-light">residence.</span>
          </>
        }
        intro="Search live website availability, choose your residence, add guest details and review your stay before placing a temporary hold or sending a request."
        image={media.hero}
        meta="Reservations · Kimironko"
      />

      <section className="bg-paper-warm py-12 md:py-16">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-6 sm:grid-cols-3 md:gap-8">
            {steps.map((item, index) => (
              <Reveal key={item.number} delay={index * 90}>
                <div className="border-t border-ink-300/60 pt-4">
                  <span className="font-display text-[0.9rem] italic text-gold-ink/70">{item.number}</span>
                  <h2 className="mt-2 font-display text-[1.4rem] leading-tight text-ink-900">{item.title}</h2>
                  <p className="mt-2 text-[0.85rem] leading-[1.8] text-ink-500">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-14 md:py-20">
        <div className="mx-auto grid max-w-site gap-14 px-5 sm:px-6 md:px-12 lg:grid-cols-12 lg:gap-x-10 lg:px-16">
          <div className="min-w-0 lg:col-span-8">
            <Reveal>
              <SectionLabel>Your reservation</SectionLabel>
              <h2 className="display mt-4 text-[clamp(2rem,3.4vw,3rem)] text-ink-900">
                {requestedSlug ? 'Check your dates.' : 'Begin your stay.'}
              </h2>
              <Link to="/booking/track" className="link-line mt-4 text-sm text-ink-700">
                Already sent a request? Track its status
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>

            <div className="mt-8">
              {beds24Ready ? (
                <Beds24BookingWidget />
              ) : (
                <>
                  {Boolean(import.meta.env.VITE_BEDS24_BOOKING_URL) && (
                    <p className="mb-8 border-l-2 border-gold-bronze bg-paper-warm px-4 py-3 text-[0.85rem] text-ink-700">
                      The external booking engine is paused until every published residence has verified booking
                      details enabled.
                    </p>
                  )}
                  <BookingForm
                    key={requestedSlug ?? 'all-residences'}
                    apartments={apartments}
                    initialApartmentSlug={requestedSlug}
                  />
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-32">
              <Reveal delay={80}>
                <aside className="border border-ink-200/80 bg-paper-warm p-6">
                  <p className="eyebrow text-gold-ink">Direct reservations</p>
                  <h2 className="display mt-3 text-[1.85rem] leading-tight text-ink-900">A considered booking.</h2>
                  <ul className="mt-5 space-y-4 border-t border-ink-300/60 pt-5">
                    {[
                      { icon: CalendarCheck, text: 'Live website availability, including confirmed stays and active holds.' },
                      { icon: ShieldCheck, text: 'Card details are never collected on this website. Payment, when enabled, is handled by Flutterwave.' },
                      { icon: Mail, text: 'Every enquiry reaches the property team directly.' },
                    ].map((item) => (
                      <li key={item.text} className="flex items-start gap-3">
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" strokeWidth={1.5} aria-hidden="true" />
                        <span className="text-[0.82rem] leading-[1.75] text-ink-600">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact" className="link-line mt-6 text-ink-900">
                    Speak with the team
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </aside>
              </Reveal>

              <Reveal delay={140}>
                <div className="border border-ink-200/80 p-6">
                  <p className="eyebrow text-ink-400">Before you book</p>
                  <div className="mt-4">
                    <Accordion
                      items={[faqs[2], faqs[3], faqs[4], faqs[7]].map((item) => ({
                        question: item.question,
                        answer: item.answer,
                      }))}
                    />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={180}>
                <div className="border border-ink-200/80 p-6">
                  <p className="eyebrow text-ink-400">Policies</p>
                  <ul className="mt-4 space-y-3 text-[0.85rem]">
                    <li><Link to="/terms" className="text-ink-600 transition-colors hover:text-gold-ink">Terms and conditions</Link></li>
                    <li><Link to="/privacy" className="text-ink-600 transition-colors hover:text-gold-ink">Privacy policy</Link></li>
                    <li><Link to="/cancellation" className="text-ink-600 transition-colors hover:text-gold-ink">Cancellation policy</Link></li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
