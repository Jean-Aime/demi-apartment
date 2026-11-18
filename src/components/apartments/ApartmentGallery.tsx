import { useCallback, useState } from 'react';
import { Expand } from 'lucide-react';
import type { Photo } from '@/data/media';
import Reveal from '@/components/Reveal';
import GalleryLightbox from '@/components/home/GalleryLightbox';
import SectionLabel from '@/components/ui/SectionLabel';

interface ApartmentGalleryProps {
  roomName: string;
  photos: Photo[];
}

/** Editorial mosaic: one commanding frame, then a measured supporting column. */
export default function ApartmentGallery({ roomName, photos }: ApartmentGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const close = useCallback(() => setActiveIndex(null), []);
  const [featured, ...rest] = photos;

  if (!featured) return null;

  return (
    <section id="room-gallery" aria-label={`${roomName} photo gallery`} className="scroll-mt-24 bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink-200/70 pb-6">
          <div>
            <SectionLabel>A closer look</SectionLabel>
            <h2 className="display mt-4 text-[clamp(2rem,3.4vw,3rem)] text-ink-900">{roomName}</h2>
          </div>
          <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-400">
            {String(photos.length).padStart(2, '0')} photographs · select to enlarge
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-12 md:gap-5">
          <Reveal className="md:col-span-7">
            <button
              type="button"
              onClick={() => setActiveIndex(0)}
              aria-label={`View photo 1 of ${photos.length}: ${featured.alt}`}
              className="group relative block w-full overflow-hidden bg-paper-muted"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={featured.src}
                  alt={featured.alt}
                  loading="eager"
                  className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.03]"
                />
              </div>
              <span className="absolute left-4 top-4 bg-paper/95 px-3 py-2 font-sans text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ink-800">
                01 / {String(photos.length).padStart(2, '0')}
              </span>
              <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center border border-paper/50 bg-ink-900/40 text-paper backdrop-blur-sm transition-colors group-hover:border-gold-light group-hover:bg-gold group-hover:text-ink-900">
                <Expand className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </button>
          </Reveal>

          <div className={`md:col-span-5 ${rest.length > 1 ? 'grid gap-4 md:gap-5' : ''}`}>
            {rest.map((photo, index) => (
              <Reveal key={photo.src} delay={(index + 1) * 100} className={rest.length === 1 ? 'h-full' : ''}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index + 1)}
                  aria-label={`View photo ${index + 2} of ${photos.length}: ${photo.alt}`}
                  className={`group relative block w-full overflow-hidden bg-paper-muted ${rest.length === 1 ? 'h-full' : ''}`}
                >
                  <div className={`w-full overflow-hidden ${rest.length === 1 ? 'aspect-[4/3] md:h-full' : 'aspect-[16/11]'}`}>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <span className="absolute left-4 top-4 bg-paper/95 px-3 py-2 font-sans text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ink-800">
                    {String(index + 2).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
                  </span>
                  <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center border border-paper/50 bg-ink-900/40 text-paper backdrop-blur-sm transition-colors group-hover:border-gold-light group-hover:bg-gold group-hover:text-ink-900">
                    <Expand className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={close}
          label={`${roomName} photo gallery`}
        />
      )}
    </section>
  );
}
