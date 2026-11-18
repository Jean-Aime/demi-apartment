import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apartmentPhotos, media } from '@/data/media';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

export default function GalleryPreview() {
  const frames = [
    media.introWide,
    apartmentPhotos[1],
    media.architectureDetail,
    apartmentPhotos[7],
    media.experienceSmall,
  ];

  return (
    <section className="overflow-hidden bg-ink-900 py-20 text-paper md:py-24">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal>
            <SectionLabel tone="light" index="07">A visual record</SectionLabel>
            <h2 className="display mt-6 max-w-2xl text-[clamp(2.6rem,4.6vw,4.5rem)] text-paper">
              The property, <span className="italic text-gold-light">unhurried.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Link to="/gallery" className="link-line text-gold-light">
              View the gallery
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </div>

      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-6 md:mt-14 md:gap-6 md:px-12 lg:px-16">
        {frames.map((photo, index) => (
          <Reveal
            key={`${photo.src}-${index}`}
            delay={index * 70}
            className={`shrink-0 snap-start ${index % 2 === 0 ? 'w-[70vw] sm:w-[34vw] lg:w-[23vw]' : 'w-[58vw] sm:w-[26vw] lg:w-[18vw]'}`}
          >
            <Link to="/gallery" className="group block">
              <div className={`overflow-hidden bg-ink-800 ${index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}>
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-85 transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04] group-hover:opacity-100"
                />
              </div>
              <p className="mt-3 font-sans text-[0.55rem] uppercase tracking-[0.24em] text-paper/40">
                {String(index + 1).padStart(2, '0')} — Kimironko
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
