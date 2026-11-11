import type { ReactNode } from 'react';
import type { Photo } from '@/data/media';
import Reveal from '@/components/Reveal';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  image: Photo;
}

export default function PageHeader({ eyebrow, title, intro, image }: PageHeaderProps) {
  return (
    <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-ink-900 pb-16 pt-40 text-paper md:pb-24">
      <img
        src={image.src}
        alt={image.alt}
        className="page-header-media absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(14,13,11,0.82),rgba(14,13,11,0.3)_72%),linear-gradient(0deg,rgba(14,13,11,0.7),rgba(14,13,11,0.04)_75%)]"
      />

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-6 md:px-12 lg:px-16">
        <Reveal>
          <p className="eyebrow inline-flex items-center gap-3 text-gold-light">
            <span className="h-px w-8 bg-gold-light" aria-hidden="true" />
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="page-title display mt-6 max-w-5xl break-words text-[clamp(2.8rem,6.4vw,6.5rem)] text-paper">{title}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={240}>
            <p className="mt-7 max-w-2xl border-l border-gold/70 pl-5 text-base leading-relaxed text-paper/75 md:text-lg">
              {intro}
            </p>
          </Reveal>
        )}
        <div className="editorial-rule mt-10 max-w-2xl opacity-70" aria-hidden="true" />
      </div>
    </section>
  );
}
