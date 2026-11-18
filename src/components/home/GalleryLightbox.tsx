import { useEffect, useRef, type TouchEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '@/data/media';
import { EASE } from '@/lib/motion';

interface GalleryLightboxProps {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  label?: string;
}

const SWIPE_THRESHOLD_PX = 48;

export default function GalleryLightbox({ photos, index, onIndexChange, onClose, label = 'Photo viewer' }: GalleryLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const total = photos.length;
  const current = photos[index];

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % total);
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [index, total, onClose, onIndexChange]);

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD_PX) onIndexChange((index + 1) % total);
    if (delta >= SWIPE_THRESHOLD_PX) onIndexChange((index - 1 + total) % total);
  };

  if (!current) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="fixed inset-0 z-[70] flex flex-col bg-ink-900/97 text-paper backdrop-blur-sm"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between gap-6 border-b border-paper/10 px-5 py-4 md:px-10">
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-gold-light/80">
          {String(index + 1).padStart(2, '0')} <span className="text-paper/30">/ {String(total).padStart(2, '0')}</span>
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center border border-paper/25 text-paper transition-colors hover:border-gold-light hover:text-gold-light"
        >
          <span className="sr-only">Close viewer</span>
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-6 sm:px-14 md:px-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={current.src}
            src={current.src}
            alt={current.alt}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="max-h-full max-w-full object-contain"
          />
        </AnimatePresence>

        <button
          type="button"
          onClick={() => onIndexChange((index - 1 + total) % total)}
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/20 bg-ink-900/40 text-paper transition-colors hover:border-gold-light hover:text-gold-light md:left-5"
        >
          <span className="sr-only">Previous image</span>
          <ChevronLeft className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onIndexChange((index + 1) % total)}
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/20 bg-ink-900/40 text-paper transition-colors hover:border-gold-light hover:text-gold-light md:right-5"
        >
          <span className="sr-only">Next image</span>
          <ChevronRight className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
        </button>
      </div>

      <p className="border-t border-paper/10 px-5 py-4 text-center font-sans text-[0.7rem] leading-relaxed text-paper/55 md:px-10">
        {current.alt}
      </p>
    </motion.div>
  );
}
