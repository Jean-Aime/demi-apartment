import { ArrowRight, Building2, ClipboardCheck, DoorOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';
import { useApartments } from '@/hooks/useApartments';

const guestHighlights = [
  {
    icon: DoorOpen,
    title: 'Choose a room',
    description: 'Browse all nine numbered rooms and open any one to see its individual details.',
    link: { label: 'Explore the rooms', to: '/apartments' },
  },
  {
    icon: Building2,
    title: 'Make it your own',
    description: 'Stay in a private, self-contained residence rather than a shared guest room.',
    link: { label: 'Discover the experience', to: '/experience' },
  },
  {
    icon: ClipboardCheck,
    title: 'Hear from the team',
    description: 'Booking enquiries are reviewed by the team; your stay is confirmed when they accept it.',
    link: { label: 'How to request a stay', to: '/booking' },
  },
];

const planningSteps = [
  {
    number: '01',
    title: 'Explore',
    description: 'Compare the nine rooms and open the one that suits your stay.',
  },
  {
    number: '02',
    title: 'Enquire',
    description: 'Choose your dates and send a booking request to the team.',
  },
  {
    number: '03',
    title: 'Confirm',
    description: 'The team checks your request and contacts you about availability.',
  },
];

export default function HomeStayGuide() {
  const { apartments } = useApartments();
  const featuredApartment = apartments[6] ?? apartments[0];

  return (
    <>
      <section className="bg-paper py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
          <div className="grid gap-12 md:grid-cols-12 md:gap-x-8">
            <Reveal className="md:col-span-4">
              <p className="eyebrow">A stay at DEMI</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.25rem)] text-ink-900">
                Start with what <span className="italic text-gold">matters.</span>
              </h2>
            </Reveal>

            <div className="grid gap-8 sm:grid-cols-3 md:col-span-7 md:col-start-6">
              {guestHighlights.map((highlight, index) => (
                <Reveal key={highlight.title} delay={index * 100} className="group border-t border-gold/40 bg-paper-warm/55 p-5 transition-colors duration-500 hover:bg-paper-warm sm:p-6">
                    <highlight.icon className="h-5 w-5 text-gold-deep transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-5 font-serif text-2xl text-ink-900">{highlight.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{highlight.description}</p>
                  <Link to={highlight.link.to} className="link-line mt-6 text-xs text-ink-800">
                    {highlight.link.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper-warm py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
          <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-x-8">
            <Reveal className="md:col-span-5">
              <figure className="media-frame aspect-[4/5] overflow-hidden bg-paper-muted">
                <img
                  src={featuredApartment.photo.src}
                  alt={featuredApartment.photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <figcaption className="sr-only">Interior photograph of Room {featuredApartment.number}</figcaption>
              </figure>
            </Reveal>

            <div className="md:col-span-6 md:col-start-7">
              <Reveal>
                <p className="eyebrow">Planning your visit</p>
                <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.25rem)] text-ink-900">
                  Three steps to <span className="italic text-gold">get started.</span>
                </h2>
                <p className="mt-5 max-w-md text-ink-500">
                  Your booking begins with a request, so the team can check your dates before confirming your stay.
                </p>
              </Reveal>

              <ol className="mt-10 space-y-6">
                {planningSteps.map((step, index) => (
                  <Reveal key={step.number} delay={index * 100} className="flex gap-5 border-t border-ink-200 pt-5">
                    <span className="font-serif text-2xl tabular-nums text-gold-deep">{step.number}</span>
                    <div>
                      <h3 className="font-serif text-xl text-ink-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>

              <Reveal delay={200} className="mt-10">
                <Link
                  to="/booking"
                  className="btn-gold group inline-flex items-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
                >
                  Start a booking request
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
