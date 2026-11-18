import type { Faq } from '@/data/faqs';
import Accordion from '@/components/ui/Accordion';
import SectionLabel from '@/components/ui/SectionLabel';
import Reveal from '@/components/Reveal';

interface FaqSectionProps {
  items: Faq[];
  eyebrow?: string;
  title?: string;
  intro?: string;
  tone?: 'paper' | 'warm' | 'ink';
}

export default function FaqSection({
  items,
  eyebrow = 'Guest questions',
  title = 'Considered answers.',
  intro = 'Practical details about the residences, availability and the reservation journey.',
  tone = 'warm',
}: FaqSectionProps) {
  const isLight = tone === 'ink';
  const background = tone === 'ink' ? 'bg-ink-900' : tone === 'warm' ? 'bg-paper-warm' : 'bg-paper';

  return (
    <section className={`${background} py-16 md:py-24`}>
      <div className="mx-auto grid max-w-site gap-12 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
        <div className="md:col-span-4">
          <Reveal>
            <SectionLabel tone={isLight ? 'light' : 'dark'}>{eyebrow}</SectionLabel>
            <h2 className={`display mt-6 text-[clamp(2.4rem,4vw,3.75rem)] ${isLight ? 'text-paper' : 'text-ink-900'}`}>
              {title}
            </h2>
            <p className={`mt-6 max-w-xs text-[0.95rem] leading-[1.85] ${isLight ? 'text-paper/60' : 'text-ink-500'}`}>
              {intro}
            </p>
            <div className={`mt-8 h-px w-16 ${isLight ? 'bg-gold-light/50' : 'bg-gold-bronze/50'}`} aria-hidden="true" />
          </Reveal>
        </div>

        <Reveal delay={100} className="md:col-span-7 md:col-start-6">
          <Accordion items={items.map((item) => ({ question: item.question, answer: item.answer }))} tone={isLight ? 'light' : 'dark'} />
        </Reveal>
      </div>
    </section>
  );
}
