import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { policies, policyLinks, type Policy } from '@/data/policies';
import { media } from '@/data/media';
import { Link } from 'react-router-dom';

export default function PolicyPage({ slug }: { slug: Policy['slug'] }) {
  const policy = policies[slug];
  const others = policyLinks.filter((link) => link.to !== `/${slug}`);

  return (
    <main>
      <PageHeader eyebrow={policy.eyebrow} title={policy.title} intro={policy.intro} image={media.architectureSide} meta="Draft wording" />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <aside className="md:col-span-3">
            <div className="md:sticky md:top-32">
              <SectionLabel>Contents</SectionLabel>
              <nav aria-label="Policy sections" className="mt-5 border-t border-ink-200">
                {policy.sections.map((section, index) => (
                  <a
                    key={section.heading}
                    href={`#section-${index + 1}`}
                    className="group flex items-baseline gap-3 border-b border-ink-200 py-3.5 text-[0.85rem] text-ink-600 transition-colors hover:text-gold-ink"
                  >
                    <span className="font-display text-[0.8rem] italic tabular-nums text-gold-ink/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.heading}
                  </a>
                ))}
              </nav>

              <p className="eyebrow mt-8 text-ink-400">Other policies</p>
              <ul className="mt-4 space-y-2.5 text-[0.85rem]">
                {others.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-ink-600 transition-colors hover:text-gold-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link to="/booking" className="link-line mt-8 text-ink-900">
                Reservations
              </Link>
            </div>
          </aside>

          <div className="md:col-span-8 md:col-start-5">
            <Reveal className="border-l-2 border-gold-bronze bg-paper-warm px-5 py-4">
              <p className="text-[0.8rem] leading-relaxed text-ink-600">
                Draft wording. Bracketed items must be confirmed by the property before publication. For a binding
                answer on your own reservation, contact the team directly.
              </p>
            </Reveal>

            <div>
              {policy.sections.map((section, index) => (
                <Reveal key={section.heading} delay={index * 60}>
                  <article
                    id={`section-${index + 1}`}
                    className="scroll-mt-32 border-b border-ink-200/70 py-9 first:border-t first:border-ink-200/70 md:py-11"
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-[0.9rem] italic tabular-nums text-gold-ink/60">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="display text-[clamp(1.7rem,2.6vw,2.4rem)] text-ink-900">{section.heading}</h2>
                    </div>
                    <div className="mt-5 space-y-4 pl-0 text-[0.95rem] leading-[1.9] text-ink-500 md:pl-9">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120} className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link to="/contact" className="btn-gold">
                Ask the team
              </Link>
              <Link to="/privacy" className="link-line text-ink-600 hover:text-ink-900">
                Privacy policy
              </Link>
              <Link to="/terms" className="link-line text-ink-600 hover:text-ink-900">
                Terms
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
