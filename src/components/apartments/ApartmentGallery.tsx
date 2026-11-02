import { useCallback, useState } from 'react';
import type { Photo } from '@/data/media';
import Reveal from '@/components/Reveal';
import GalleryLightbox from '@/components/home/GalleryLightbox';

interface ApartmentGalleryProps {
  roomName: string;
  photos: Photo[];
}

export default function ApartmentGallery({ roomName, photos }: ApartmentGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const close = useCallback(() => setActiveIndex(null), []);

  return (
    <section aria-label={`${roomName} photo gallery`} className="bg-paper-warm py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Room photographs</p>
            <h2 className="display mt-3 text-3xl text-ink-900 md:text-4xl">{roomName}</h2>
          </div>
          <p className="text-sm text-ink-500">{photos.length} photographs</p>
        </div>

        <div className="grid gap-3 md:grid-cols-12">
          {photos.map((photo, index) => (
            <Reveal
              key={photo.src}
              delay={index * 80}
              className={index === 0 ? 'md:col-span-8' : 'md:col-span-4'}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View ${roomName} photo ${index + 1}: ${photo.alt}`}
                className={`media-frame group relative block w-full overflow-hidden bg-paper-muted ${
                  index === 0
                    ? 'aspect-[4/3] md:aspect-auto md:h-[min(60vw,46rem)]'
                    : 'aspect-[4/3] md:aspect-auto md:h-full'
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-3 right-3 bg-ink-900/75 px-3 py-2 text-[0.6rem] uppercase tracking-[0.16em] text-paper">
                  View photo
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={close}
        />
      )}
    </section>
  );
}
