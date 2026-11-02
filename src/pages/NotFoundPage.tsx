import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { media } from '@/data/media';
import PageHeader from '@/components/layout/PageHeader';

export default function NotFoundPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Page not found"
        title={
          <>
            This page has <span className="italic text-gold">moved</span> or never existed.
          </>
        }
        intro="The link may be out of date. Return to the homepage or explore the residences."
        image={media.hero}
      />
      <section className="bg-paper py-20">
        <div className="mx-auto flex max-w-[1440px] flex-wrap gap-6 px-6 md:px-12 lg:px-16">
          <Link
            to="/"
            className="btn-gold group inline-flex items-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
          >
            Back to homepage
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link to="/apartments" className="link-line self-center text-ink-900">
            View the residences
          </Link>
        </div>
      </section>
    </main>
  );
}
