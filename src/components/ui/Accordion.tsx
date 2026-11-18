import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EASE } from '@/lib/motion';

export interface AccordionItem {
  question: string;
  answer: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  tone?: 'dark' | 'light';
  className?: string;
}

export default function Accordion({ items, tone = 'dark', className = '' }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const id = useId();
  const isLight = tone === 'light';

  return (
    <div className={`border-t ${isLight ? 'border-paper/15' : 'border-ink-200/70'} ${className}`}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${id}-panel-${index}`;
        const buttonId = `${id}-button-${index}`;

        return (
          <div key={item.question} className={`border-b ${isLight ? 'border-paper/15' : 'border-ink-200/70'}`}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className={`group flex w-full items-start justify-between gap-6 py-6 text-left md:py-7 ${
                  isLight ? 'text-paper' : 'text-ink-900'
                }`}
              >
                <span className="flex min-w-0 items-baseline gap-4 md:gap-8">
                  <span className={`eyebrow shrink-0 tabular-nums ${isLight ? 'text-gold-light/70' : 'text-gold-ink/70'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[1.35rem] leading-[1.25] tracking-[-0.01em] md:text-[1.6rem]">
                    {item.question}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${
                    open
                      ? isLight
                        ? 'border-gold-light text-gold-light'
                        : 'border-gold-bronze text-gold-ink'
                      : isLight
                        ? 'border-paper/25 text-paper/60 group-hover:border-gold-light group-hover:text-gold-light'
                        : 'border-ink-300 text-ink-500 group-hover:border-gold-bronze group-hover:text-gold-ink'
                  }`}
                >
                  <Plus className={`h-3.5 w-3.5 transition-transform duration-500 ${open ? 'rotate-45' : ''}`} strokeWidth={1.5} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div
                    className={`max-w-2xl pb-8 pl-0 text-[0.95rem] leading-[1.85] md:pl-[4.5rem] ${
                      isLight ? 'text-paper/65' : 'text-ink-500'
                    }`}
                  >
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
