import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Architecture from '@/components/home/Architecture';
import ReservationCta from '@/components/sections/ReservationCta';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';
import { media } from '@/data/media';

const principles = [
  {
    title: 'Privacy, by design',
    body: 'Each stay reserves one private bedroom. The bedroom belongs to Apartment A, B or C and shares only that apartment’s living room and kitchen.',
  },
  {
    title: 'Clarity, not guesswork',
    body: 'Verified details are published; unverified ones are marked as such. Nothing about the property is invented for effect.',
  },
  {
    title: 'A direct welcome',
    body: 'Reservations and questions come to the property team, who confirm availability and the final details with you.',
  },
];

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        eyebrow="About DEMI APARTMENT"
        title={
          <>
            A residence shaped by <span className="italic text-gold-light">clarity and restraint.</span>
          </>
        }
        intro="Eight private bedrooms in three apartment groups in Kimironko, Kigali — designed around light, material and an unhurried way of staying."
        image={media.architectureSide}
        meta="Kimironko · Kigali"
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-5">
            <EditorialImage src={media.introTall.src} alt={media.introTall.alt} aspect="4/5" label="Residence interior" eager />
          </Reveal>
          <div className="md:col-span-6 md:col-start-7 md:pt-10">
            <Reveal>
              <SectionLabel index="01">The property</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.4rem,4.4vw,4.25rem)] text-ink-900">
                A collection, not a <span className="italic text-gold-ink">corridor of rooms.</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-7 space-y-5 text-[0.975rem] leading-[1.9] text-ink-500">
                <p>
                  DEMI APARTMENT is a residential building of eight private bedrooms in three apartment groups in Kimironko, Kigali. Each
                  bedroom is numbered and presented on its own — A1 through C2 — with its own photography and
                  own verified details.
                </p>
                <p>
                  Bedroom guests share the designated living room and kitchen within their apartment group. The building is
                  composed around terraced balconies and full-height glazing, so the interiors stay calm and bright
                  through the day.
                </p>
                <p>
                  What we do not do is invent a history. The website describes what exists, confirms what the property
                  has verified, and leaves the rest to a conversation with the team.
                </p>
              </div>
            </Reveal>
            <Reveal delay={180} className="mt-8 border-t border-ink-200 pt-6">
              <Link to="/apartments" className="link-line text-ink-900">
                Explore the bedrooms
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-ink-900 py-16 text-paper md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-7">
              <SectionLabel tone="light" index="02">Our hospitality philosophy</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.4rem,4.4vw,4.25rem)] text-paper">
                Considered, <span className="italic text-gold-light">not performed.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="md:col-span-4 md:col-start-9">
              <p className="text-[0.95rem] leading-[1.85] text-paper/60">
                Luxury, to us, is the absence of friction: a clear booking, an accurate description, a private
                apartment that is exactly as photographed.
              </p>
            </Reveal>
          </div>

          <ol className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-3">
            {principles.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <li className="border-t border-paper/20 pt-5">
                  <span className="font-display text-[0.95rem] italic text-gold-light/70">0{index + 1}</span>
                  <h3 className="mt-4 font-display text-[1.65rem] leading-[1.2] text-paper">{item.title}</h3>
                  <p className="mt-3 text-[0.9rem] leading-[1.8] text-paper/55">{item.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:items-center md:gap-x-8 md:px-12 lg:px-16">
          <div className="md:col-span-6">
            <Reveal>
              <SectionLabel index="03">Comfort and privacy</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.3rem,4vw,3.9rem)] text-ink-900">
                A stay that keeps its <span className="italic text-gold-ink">own rhythm.</span>
              </h2>
              <div className="mt-7 space-y-5 text-[0.975rem] leading-[1.9] text-ink-500">
                <p>
                  The residences are arranged for everyday life: somewhere to make coffee, a table to work at, a sofa
                  to sink into at the end of the day.
                </p>
                <p>
                  Interiors are held to warm neutrals, natural texture and integrated lighting. The result is quiet
                  rather than minimal for its own sake.
                </p>
              </div>
              <Link to="/experience" className="link-line mt-8 text-ink-900">
                The Demi experience
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <Reveal delay={120}>
              <EditorialImage src={media.experienceSmall.src} alt={media.experienceSmall.alt} aspect="4/5" />
            </Reveal>
          </div>
        </div>
      </section>

      <Architecture />

      <ReservationCta
        eyebrow="Stay with us"
        title="A considered place to arrive."
        body="Search the residence calendar for your dates, or speak with the team about the apartment that suits you."
        image={media.introWide}
      />
    </main>
  );
}
