import { media } from '@/data/media';
import Reveal from '@/components/Reveal';

const pillars = [
  {
    title: 'Thoughtfully designed interiors',
    body: 'Considered proportions, natural materials and warm light shape every residence.',
  },
  {
    title: 'Comfortable private spaces',
    body: 'Each apartment is designed for privacy, so the stay remains entirely your own.',
  },
  {
    title: 'Contemporary living',
    body: 'A calm, modern setting for rest, work and unhurried time.',
  },
  {
    title: 'A personal welcome',
    body: 'Warm, attentive hospitality makes every arrival feel considered.',
  },
];

export default function Experience() {
  return (
    <section className="bg-paper py-32 md:py-44">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <div className="grid gap-16 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-5">
            <Reveal>
              <p className="eyebrow">The details of a stay</p>
              <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.75rem)] text-ink-900">
                Comfort in the <span className="italic text-gold">details.</span>
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-8 max-w-md text-base text-ink-500 md:text-lg">
                Life at DEMI APARTMENT is quiet and intentional. The rooms are made to be lived in, and the welcome is
                warm from the first moment.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <Reveal delay={100}>
              <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
                {pillars.map((pillar, index) => (
                  <li key={pillar.title} className="border-t border-ink-100 pt-6">
                    <span className="font-serif text-lg text-gold">0{index + 1}</span>
                    <h3 className="mt-3 font-serif text-2xl leading-[1.2] text-ink-900">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-[1.5] text-ink-500">{pillar.body}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:mt-32 md:grid-cols-12 md:items-start">
          <Reveal className="md:col-span-7">
            <figure className="media-frame">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={media.experienceLarge.src}
                  alt={media.experienceLarge.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </figure>
          </Reveal>
          <Reveal delay={200} className="md:col-span-4 md:col-start-9 md:mt-32">
            <figure className="media-frame">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={media.experienceSmall.src}
                  alt={media.experienceSmall.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
