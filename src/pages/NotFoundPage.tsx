import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { media } from '@/data/media';

export default function NotFoundPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Page not found"
        title={
          <>
            This page has <span className="italic text-gold-light">moved</span> or never existed.
          </>
        }
        intro="The link may be out of date. Return to the homepage or explore the private bedrooms."
        image={media.hero}
        meta="Error 404"
      />
      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-10 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-7">
              <SectionLabel>Where to next</SectionLabel>
              <p className="display mt-5 text-[clamp(4rem,12vw,10rem)] leading-[0.8] text-gold/25">404</p>
              <h2 className="display mt-4 max-w-lg text-[clamp(2rem,3.4vw,3rem)] text-ink-900">
                The address is right; the page is not.
              </h2>
            </Reveal>
            <Reveal delay={120} className="md:col-span-4 md:col-start-9">
              <div className="flex flex-col items-start gap-5">
                <Link to="/" className="btn-gold w-full">
                  Back to the homepage
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/apartments" className="link-line text-ink-900">
                  View the residences
                </Link>
                <Link to="/contact" className="link-line text-ink-600 hover:text-ink-900">
                  Contact the team
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
