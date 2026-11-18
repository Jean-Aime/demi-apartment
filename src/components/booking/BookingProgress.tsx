import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookingProgressProps {
  steps: string[];
  step: number;
  ariaLabel?: string;
}

export default function BookingProgress({ steps, step, ariaLabel = 'Reservation progress' }: BookingProgressProps) {
  return (
    <nav aria-label={ariaLabel} className="border-y border-ink-200/70 py-4">
      <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((label, index) => {
          const current = index + 1;
          const active = current === step;
          const complete = current < step;

          return (
            <li key={label} aria-current={active ? 'step' : undefined} className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={`flex h-7 w-7 items-center justify-center border font-sans text-[0.65rem] tabular-nums transition-colors duration-500 ${
                  complete
                    ? 'border-ink-900 bg-ink-900 text-paper'
                    : active
                      ? 'border-gold-bronze bg-gold text-ink-900'
                      : 'border-ink-200 bg-transparent text-ink-400'
                }`}
              >
                {complete ? <Check className="h-3 w-3" aria-hidden="true" /> : current}
              </span>
              <span
                className={`px-1 font-sans text-[0.5rem] uppercase leading-tight tracking-[0.14em] sm:text-[0.58rem] ${
                  active ? 'font-semibold text-ink-900' : complete ? 'text-ink-500' : 'text-ink-400'
                }`}
              >
                {label}
              </span>
              {active && (
                <motion.span
                  layoutId="booking-step-indicator"
                  className="absolute -bottom-[17px] left-1/2 h-[2px] w-8 -translate-x-1/2 bg-gold-bronze"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
