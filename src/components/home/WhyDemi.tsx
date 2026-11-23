import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

const reasons = [
  {
    title: 'Three shared apartment environments',
    body: 'Eight private bedrooms, numbered A1 to C2, with shared living rooms and kitchens.',
  },
  {
    title: 'Verified information',
    body: 'Details are published only once the property has confirmed them.',
  },
  {
    title: 'Direct reservations',
    body: 'Book through the property’s own calendar and team, not a middleman.',
  },
  {
    title: 'A considered address',
    body: 'Kimironko, Kigali — a calmer base with the city within reach.',
  },
];

export default function WhyDemi() {
  return (
    <section className="bg-paper py-20 md:py-24">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
          <div className="md:col-span-6">
            <Reveal>
              <SectionLabel index="09">Why Demi Apartment</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.5rem,4.4vw,4.25rem)] text-ink-900">
                A stay with <span className="italic text-gold-ink">fewer compromises.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={100} className="md:col-span-4 md:col-start-9">
            <p className="text-[0.95rem] leading-[1.85] text-ink-500">
              Privacy, clarity and a direct relationship with the people who look after the property.
            </p>
          </Reveal>
        </div>

        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <Reveal key={reason.title} delay={index * 90}>
              <li className="group border-t border-ink-900/25 pt-5 transition-colors duration-500 hover:border-gold-bronze">
                <span className="font-display text-[3.25rem] leading-none tracking-[-0.03em] text-gold/70 transition-colors duration-500 group-hover:text-gold-bronze">
                  0{index + 1}
                </span>
                <h3 className="mt-5 font-display text-[1.5rem] leading-[1.2] text-ink-900">{reason.title}</h3>
                <p className="mt-3 text-[0.875rem] leading-[1.8] text-ink-500">{reason.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
