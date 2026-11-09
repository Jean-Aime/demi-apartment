import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';

const destinations = [
  {
    to: '/about',
    eyebrow: '01',
    title: 'About the property',
    body: 'Discover the architectural thinking behind DEMI APARTMENT.',
  },
  {
    to: '/apartments',
    eyebrow: '02',
    title: 'Explore the rooms',
    body: 'Browse all nine rooms and open each one to see its own photographs and details.',
  },
  {
    to: '/contact',
    eyebrow: '03',
    title: 'Get in touch',
    body: 'Find contact details, directions and the location.',
  },
];

export default function ExploreLinks() {
  return (
    <section className="bg-paper-warm py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <Reveal>
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
            <div className="md:col-span-6">
              <p className="eyebrow">Your next step</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.75rem)] text-ink-900">
                Find what you <span className="italic text-gold">need to know.</span>
              </h2>
            </div>
            <p className="max-w-md text-ink-500 md:col-span-5 md:col-start-8">
              Choose a topic to explore room details, the property, and the practical information for your stay.
            </p>
          </div>
        </Reveal>

        <nav aria-label="Explore DEMI APARTMENT" className="mt-12 border-t border-ink-200">
          <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <li key={destination.to}>
              <Reveal delay={index * 80}>
                <Link
                  to={destination.to}
                  className="group flex min-h-36 items-start justify-between gap-5 border-b border-ink-200 py-7 transition-colors hover:border-gold"
                >
                  <span>
                    <span className="eyebrow">{destination.eyebrow}</span>
                    <span className="display mt-3 block text-2xl text-ink-900 transition-colors group-hover:text-gold">
                      {destination.title}
                    </span>
                    <span className="mt-2 block max-w-xs text-sm leading-relaxed text-ink-500">{destination.body}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Reveal>
            </li>
          ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
