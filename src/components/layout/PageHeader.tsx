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
    <section className="relative isolate flex min-h-[70svh] items-end overflow-hidden bg-ink-900 pb-20 pt-40 text-paper md:pb-28">
      <img src={image.src} alt={image.alt} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/40" />

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-6 md:px-12 lg:px-16">
        <Reveal>
          <p className="eyebrow text-gold-light">{eyebrow}</p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="display mt-6 max-w-4xl break-words text-[clamp(2.5rem,7vw,6rem)] text-paper">{title}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={240}>
            <p className="mt-8 max-w-xl text-base leading-[1.5] text-paper/70 md:text-lg">{intro}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
