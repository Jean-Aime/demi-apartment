import PageHeader from '@/components/layout/PageHeader';
import Reveal from '@/components/Reveal';
import { policies, type Policy } from '@/data/policies';
import { media } from '@/data/media';

export default function PolicyPage({ slug }: { slug: Policy['slug'] }) {
  const policy = policies[slug];

  return (
    <main>
      <PageHeader eyebrow={policy.eyebrow} title={policy.title} intro={policy.intro} image={media.architectureSide} />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 md:px-12">
          {policy.sections.map((section, index) => (
            <Reveal key={section.heading} delay={index * 60} className="border-t border-ink-100 py-12 first:border-t-0 first:pt-0">
              <h2 className="display text-3xl text-ink-900 md:text-4xl">{section.heading}</h2>
              <div className="mt-6 space-y-5 text-base leading-[1.5] text-ink-500">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          ))}
          <p className="mt-12 border-t border-ink-100 pt-8 text-xs uppercase tracking-[0.18em] text-ink-400">
            Draft wording. Bracketed items must be confirmed by the property before publication.
          </p>
        </div>
      </section>
    </main>
  );
}
