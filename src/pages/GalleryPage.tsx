import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Expand } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import GalleryLightbox from '@/components/home/GalleryLightbox';
import ReservationCta from '@/components/sections/ReservationCta';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import GoldMarquee from '@/components/ui/GoldMarquee';
import { galleryCategories, galleryPhotos, type GalleryCategory } from '@/data/gallery';
import { media } from '@/data/media';
import { EASE } from '@/lib/motion';

const ratios = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-square'];

export default function GalleryPage() {
  const [category, setCategory] = useState<GalleryCategory>('All');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const photos = useMemo(
    () => (category === 'All' ? galleryPhotos : galleryPhotos.filter((photo) => photo.category === category)),
    [category],
  );

  function selectCategory(next: GalleryCategory) {
    setCategory(next);
    setActiveIndex(null);
  }

  return (
    <main>
      <PageHeader
        eyebrow="The gallery"
        title={
          <>
            Light, material and <span className="italic text-gold-light">quiet detail.</span>
          </>
        }
        intro="A visual record of the private bedrooms and shared apartment environments photographed on the property in Kimironko."
        image={media.introWide}
        meta={`${galleryPhotos.length} photographs`}
      />

      <section id="gallery-top" className="scroll-mt-28 bg-paper py-14 md:py-20">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="grid gap-8 border-b border-ink-200/70 pb-7 md:grid-cols-12 md:items-end md:gap-x-8">
            <Reveal className="md:col-span-6">
              <SectionLabel>The collection in images</SectionLabel>
              <h2 className="display mt-5 text-[clamp(2.2rem,3.8vw,3.4rem)] text-ink-900">
                A property seen <span className="italic text-gold-ink">slowly.</span>
              </h2>
            </Reveal>
            <div className="md:col-span-6 md:justify-self-end">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter photographs by category">
                {galleryCategories.map((item) => {
                  const active = category === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectCategory(item)}
                      className={`relative px-4 py-2.5 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                        active ? 'bg-ink-900 text-paper' : 'border border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <motion.div
              key={category}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="columns-1 gap-4 sm:columns-2 md:gap-5 lg:columns-3"
            >
              {photos.map((photo, index) => (
                <button
                  key={`${photo.src}-${photo.title}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Open photograph: ${photo.title}`}
                  className="group mb-4 block w-full break-inside-avoid overflow-hidden bg-paper-muted text-left md:mb-5"
                >
                  <span className={`relative block w-full overflow-hidden ${ratios[index % ratios.length]}`}>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
                    <span className="absolute bottom-3 left-3 flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-paper opacity-0 transition-all duration-500 group-hover:opacity-100">
                      <Expand className="h-3.5 w-3.5" aria-hidden="true" />
                      {photo.category}
                    </span>
                    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-paper/40 bg-ink-900/35 text-paper backdrop-blur-sm transition-colors duration-500 group-hover:border-gold-light group-hover:bg-gold group-hover:text-ink-900">
                      <Expand className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </span>
                  <span className="flex items-baseline justify-between gap-4 border-b border-ink-200/60 py-3">
                    <span className="font-display text-[1.1rem] text-ink-900">{photo.title}</span>
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-ink-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </span>
                </button>
              ))}
            </motion.div>
          </div>

          {photos.length === 0 && (
            <p className="border border-ink-200 px-5 py-8 text-sm text-ink-500">
              No photographs are published in this category yet.
            </p>
          )}
        </div>
      </section>

      <GoldMarquee
        items={['Photographed on the property', 'A1 — C2', 'Kimironko · Kigali', 'Eight private bedrooms']}
      />

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-10 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-6">
            <p className="display text-[clamp(1.8rem,3vw,2.75rem)] leading-[1.2] text-ink-800">
              “Photography is the most honest description of a residence. Ours is made on site, not borrowed from a
              stock library.”
            </p>
          </Reveal>
          <Reveal delay={120} className="md:col-span-4 md:col-start-8">
            <p className="text-[0.95rem] leading-[1.85] text-ink-500">
              Each apartment’s gallery is its own. When owner-approved photography changes, the website’s residence
              galleries change with it, managed from the property dashboard.
            </p>
            <a href="#gallery-top" className="link-line mt-6 text-ink-900">
              Back to the gallery
            </a>
          </Reveal>
        </div>
      </section>

      <ReservationCta
        eyebrow="See it in person"
        title="Stay a while."
        body="Choose a residence from the collection and check the dates you have in mind."
        image={media.architectureDetail}
      />

      {activeIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
          label="Property gallery"
        />
      )}
    </main>
  );
}
