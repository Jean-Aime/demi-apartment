import { useEffect, useRef, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '@/data/media';

interface GalleryLightboxProps {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const SWIPE_THRESHOLD_PX = 50;

export default function GalleryLightbox({ photos, index, onIndexChange, onClose }: GalleryLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const total = photos.length;
  const current = photos[index];

  const next = () => onIndexChange((index + 1) % total);
  const previous = () => onIndexChange((index - 1 + total) % total);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % total);
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [index, total, onClose, onIndexChange]);

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD_PX) next();
    if (delta >= SWIPE_THRESHOLD_PX) previous();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gallery image viewer"
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-ink-900/95 text-paper"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between px-6 py-5 md:px-12">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-ink-400">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center transition-colors duration-300 hover:text-gold"
        >
          <span className="sr-only">Close viewer</span>
          <X className="h-6 w-6" strokeWidth={1.25} aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 md:px-24">
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className="max-h-full max-w-full animate-fade-in object-contain"
        />
        <button
          type="button"
          onClick={previous}
          className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center transition-colors duration-300 hover:text-gold md:left-6"
        >
          <span className="sr-only">Previous image</span>
          <ChevronLeft className="h-7 w-7" strokeWidth={1.25} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center transition-colors duration-300 hover:text-gold md:right-6"
        >
          <span className="sr-only">Next image</span>
          <ChevronRight className="h-7 w-7" strokeWidth={1.25} aria-hidden="true" />
        </button>
      </div>

      <p className="px-6 py-6 text-center text-sm text-ink-400 md:px-12">{current.alt}</p>
    </div>
  );
}
