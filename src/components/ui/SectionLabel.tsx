import type { ReactNode } from 'react';

interface SectionLabelProps {
  children: ReactNode;
  index?: string;
  tone?: 'dark' | 'light' | 'muted';
  className?: string;
}

const tones = {
  dark: 'text-gold-ink',
  light: 'text-gold-light',
  muted: 'text-ink-400',
} as const;

export default function SectionLabel({ children, index, tone = 'dark', className = '' }: SectionLabelProps) {
  return (
    <p className={`eyebrow inline-flex items-center gap-3 ${tones[tone]} ${className}`}>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />
      {index ? <span className="tabular-nums opacity-60">{index}</span> : null}
      <span>{children}</span>
    </p>
  );
}
