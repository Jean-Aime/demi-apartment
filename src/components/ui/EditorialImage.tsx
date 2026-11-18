import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';

const aspects = {
  '4/5': 'aspect-[4/5]',
  '3/4': 'aspect-[3/4]',
  '3/5': 'aspect-[3/5]',
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
  '16/11': 'aspect-[16/11]',
  '16/9': 'aspect-[16/9]',
  square: 'aspect-square',
} as const;

export type ImageAspect = keyof typeof aspects;

interface EditorialImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  label?: string;
  caption?: string;
  tone?: 'dark' | 'light';
  aspect?: ImageAspect;
}

/**
 * Photography treated as art direction: a slow scale-in behind a mask,
 * a restrained hover drift, and optional catalogue labelling.
 */
export default function EditorialImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  eager = false,
  label,
  caption,
  tone = 'dark',
  aspect,
}: EditorialImageProps) {
  const reduceMotion = useReducedMotion();
  const metaColor = tone === 'light' ? 'text-paper/60' : 'text-ink-400';

  return (
    <figure className={`group relative ${className}`}>
      <div
        className={`relative w-full overflow-hidden bg-paper-muted ${
          aspect ? aspects[aspect] : 'h-full min-h-[12rem]'
        }`}
      >
        <motion.img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          initial={reduceMotion ? false : { scale: 1.09 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.6, ease: EASE }}
          className={`h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035] ${imgClassName}`}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 border border-ink-900/5" />
      </div>
      {(label || caption) && (
        <figcaption className={`mt-4 flex items-baseline justify-between gap-6 text-[0.6rem] font-medium uppercase tracking-[0.22em] ${metaColor}`}>
          {label ? <span>{label}</span> : <span />}
          {caption ? <span className="text-right normal-case tracking-[0.08em]">{caption}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}
