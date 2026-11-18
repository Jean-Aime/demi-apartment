import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import FaqSection from '@/components/sections/FaqSection';
import ReservationCta from '@/components/sections/ReservationCta';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import EditorialImage from '@/components/ui/EditorialImage';
import GoldMarquee from '@/components/ui/GoldMarquee';
import { media, apartmentDetailPhotos } from '@/data/media';
import { faqs } from '@/data/faqs';

const rituals = [
  { number: '01', title: 'Arrive', body: 'A private apartment, prepared and waiting. Check-in details are confirmed with the team.' },
  { number: '02', title: 'Settle', body: 'Unpack, make something to eat, open the curtains and let the day slow down.' },
  { number: '03', title: 'Stay', body: 'Work, rest or explore Kigali — and return to a residence rather than a room.' },
];

export default function ExperiencePage() {
  return (
    <main>
      <PageHeader
        eyebrow="The experience"
        title={
          <>
            Thoughtful stays, shaped around <span className="italic text-gold-light">you.</span>
          </>
        }
        intro="The details, private spaces and warm welcome that shape a stay at DEMI APARTMENT."
        image={media.experienceLarge}
        meta="Nine residences · Kimironko"
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-7">
            <SectionLabel index="01">The art of a comfortable stay</SectionLabel>
            <h2 className="display mt-6 text-[clamp(2.5rem,4.6vw,4.5rem)] text-ink-900">
              Nothing hurried, nothing <span className="italic text-gold-ink">unnecessary.</span>
            </h2>
          </Reveal>
          <Reveal delay={120} className="md:col-span-4 md:col-start-9 md:pt-3">
            <p className="border-l border-gold-bronze/50 pl-5 text-[0.95rem] leading-[1.85] text-ink-500">
              A stay at DEMI is built from small, practical comforts: space of your own, a considered interior, and a
              team who answers when you need them.
            </p>
          </Reveal>
        </div>

        <div className="mx-auto mt-12 max-w-site px-5 sm:px-6 md:mt-16 md:px-12 lg:px-16">
          <div className="grid gap-8 md:grid-cols-12 md:gap-x-8">
            <Reveal className="md:col-span-7">
              <EditorialImage src={media.experienceLarge.src} alt={media.experienceLarge.alt} aspect="16/10" label="Kitchen and living" eager />
            </Reveal>
            <Reveal delay={120} className="md:col-span-4 md:col-start-9 md:pt-16">
              <p className="font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.2] text-ink-800">
                “A residence gives a stay its own shape. That is the difference between passing through and settling
                in.”
              </p>
              <div className="mt-6 h-px w-16 bg-gold-bronze/50" aria-hidden="true" />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink-900 py-16 text-paper md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-x-8">
            <Reveal className="md:col-span-5">
              <EditorialImage src={media.introTall.src} alt={media.introTall.alt} aspect="4/5" tone="light" label="Privacy" />
            </Reveal>
            <div className="md:col-span-6 md:col-start-7">
              <Reveal>
                <SectionLabel tone="light" index="02">Privacy and relaxation</SectionLabel>
                <h2 className="display mt-6 text-[clamp(2.3rem,4vw,3.9rem)] text-paper">
                  A door that closes, and a <span className="italic text-gold-light">day that is yours.</span>
                </h2>
                <p className="mt-6 max-w-lg text-[0.95rem] leading-[1.85] text-paper/60">
                  Each of the nine apartments is self-contained, with its own living space, kitchen and bathroom. One
                  reservation, one residence. There is no shared guest lounge to negotiate and no schedule imposed on
                  your morning.
                </p>
              </Reveal>
              <ol className="mt-9 border-t border-paper/15">
                {rituals.map((ritual, index) => (
                  <Reveal key={ritual.number} delay={index * 90}>
                    <li className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-paper/15 py-5">
                      <span className="font-display text-[0.9rem] italic text-gold-light/70">{ritual.number}</span>
                      <div>
                        <h3 className="font-display text-[1.4rem] text-paper">{ritual.title}</h3>
                        <p className="mt-1.5 text-[0.875rem] leading-[1.8] text-paper/50">{ritual.body}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-7">
              <SectionLabel index="03">The interiors</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.3rem,4vw,3.9rem)] text-ink-900">
                Warm neutrals, natural light, <span className="italic text-gold-ink">quiet detail.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="md:col-span-4 md:col-start-9">
              <p className="text-[0.9rem] leading-[1.85] text-ink-500">
                Interiors are photographed in their own residences. Every apartment’s gallery is individual.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-12 md:gap-5">
            <Reveal className="sm:col-span-5">
              <EditorialImage src={media.introWide.src} alt={media.introWide.alt} aspect="4/5" label="Living room" />
            </Reveal>
            <Reveal delay={100} className="sm:col-span-4 sm:pt-10">
              <EditorialImage src={media.experienceSmall.src} alt={media.experienceSmall.alt} aspect="3/4" label="Seating" />
            </Reveal>
            <Reveal delay={180} className="sm:col-span-3 sm:pt-20">
              <EditorialImage
                src={(apartmentDetailPhotos[4] ?? media.experienceLarge).src}
                alt={(apartmentDetailPhotos[4] ?? media.experienceLarge).alt}
                aspect="3/4"
                label="Kitchen detail"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <GoldMarquee items={['Kimironko · Kigali', 'Nine private apartments', 'Designed for quiet stays', 'A1 — C3']} />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:items-center md:gap-x-8 md:px-12 lg:px-16">
          <div className="md:col-span-6">
            <Reveal>
              <SectionLabel index="04">The neighbourhood</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.3rem,4vw,3.75rem)] text-ink-900">
                Kimironko, and the city <span className="italic text-gold-ink">beyond it.</span>
              </h2>
              <p className="mt-6 text-[0.975rem] leading-[1.9] text-ink-500">
                The property sits in Kimironko, Kigali. Days can be spent in the city and evenings returned to a
                quieter residential street. We publish only the location details the property has verified; for
                anything else, ask the team.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4">
                <Link to="/location" className="link-line text-ink-900">
                  Location and directions
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link to="/gallery" className="link-line text-ink-600 hover:text-ink-900">
                  View the gallery
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-5 md:col-start-8">
            <EditorialImage src={media.kigali.src} alt={media.kigali.alt} aspect="4/3" />
          </Reveal>
        </div>
      </section>

      <FaqSection
        items={faqs.slice(0, 6)}
        eyebrow="Good to know"
        title="Before you arrive."
        intro="The questions guests ask most often about staying at Demi Apartment."
        tone="warm"
      />

      <ReservationCta
        eyebrow="Reservations"
        title="Make it your stay."
        body="Choose a residence, check the dates you have in mind, and send your details to the property team."
        image={media.experienceSmall}
      />
    </main>
  );
}
