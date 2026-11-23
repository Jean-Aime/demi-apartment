import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import type { Photo } from '@/data/media';
import GalleryLightbox from '@/components/home/GalleryLightbox';
import SectionLabel from '@/components/ui/SectionLabel';

interface ApartmentGalleryProps {
  roomName: string;
  photos: Photo[];
}

export default function ApartmentGallery({ roomName, photos }: ApartmentGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [canGoPrevious, setCanGoPrevious] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const close = useCallback(() => setActiveIndex(null), []);
  const carouselRef = useRef<HTMLDivElement>(null);
  const visiblePhotos = useMemo(() => photos.filter((photo) => photo.src.trim()), [photos]);

  const updateScrollState = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    setCanGoPrevious(carousel.scrollLeft > 1);
    setCanGoNext(carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 1);
  }, []);

  const moveCarousel = useCallback((direction: -1 | 1) => {
    const carousel = carouselRef.current;
    const track = carousel?.firstElementChild;
    const firstSlide = track?.firstElementChild;
    if (!carousel || !track || !(firstSlide instanceof HTMLElement)) return;

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    carousel.scrollBy({
      left: direction * (firstSlide.getBoundingClientRect().width + gap),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState, visiblePhotos.length]);

  if (!visiblePhotos.length) return null;

  return (
    <section id="room-gallery" aria-label={`${roomName} photo gallery`} className="scroll-mt-24 bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink-200/70 pb-6">
          <div>
            <SectionLabel>A closer look</SectionLabel>
            <h2 className="display mt-4 text-[clamp(2rem,3.4vw,3rem)] text-ink-900">{roomName}</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-400">
              {String(visiblePhotos.length).padStart(2, '0')} photographs
            </p>
            <button
              type="button"
              onClick={() => setActiveIndex(0)}
              className="inline-flex items-center gap-2 border border-ink-200 px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink-700 transition-colors hover:border-gold hover:text-gold-ink"
            >
              <Expand className="h-3.5 w-3.5" aria-hidden="true" />
              View gallery
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex min-h-10 items-center justify-between gap-4">
            <p className="text-xs text-ink-500">
              <span className="md:hidden">Showing up to 2 photos at a time</span>
              <span className="hidden md:inline">Showing up to 4 photos at a time</span>
            </p>
            {(canGoPrevious || canGoNext) && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveCarousel(-1)}
                  disabled={!canGoPrevious}
                  aria-label="Previous room photos"
                  className="flex h-10 w-10 items-center justify-center border border-ink-200 text-ink-800 transition-colors hover:border-gold hover:text-gold-ink disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCarousel(1)}
                  disabled={!canGoNext}
                  aria-label="Next room photos"
                  className="flex h-10 w-10 items-center justify-center border border-ink-200 text-ink-800 transition-colors hover:border-gold hover:text-gold-ink disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={carouselRef}
            onScroll={updateScrollState}
            className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-3 md:gap-4">
              {visiblePhotos.map((photo, index) => (
                <button
                  key={`${photo.src}-${index}`}
                  type="button"
                  data-gallery-slide
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View photo ${index + 1} of ${visiblePhotos.length}: ${photo.alt}`}
                  className="group relative w-[calc((100%-0.75rem)/2)] shrink-0 snap-start overflow-hidden bg-paper-muted md:w-[calc((100%-3rem)/4)]"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <span className="absolute bottom-3 left-3 right-3 truncate bg-paper/95 px-2.5 py-2 text-left font-sans text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-ink-800">
                    {String(index + 1).padStart(2, '0')} / {String(visiblePhotos.length).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          photos={visiblePhotos}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={close}
          label={`${roomName} photo gallery`}
        />
      )}
    </section>
  );
}
