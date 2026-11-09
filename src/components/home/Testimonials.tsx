import { verifiedReviews } from '@/data/site';
import Reveal from '@/components/Reveal';

export default function Testimonials() {
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-16">
        <Reveal>
          <p className="eyebrow">Guest experiences</p>
          <h2 className="display mt-6 max-w-3xl text-[clamp(2.5rem,5vw,4.75rem)] text-ink-900">
            Words from those who have <span className="italic text-gold">stayed.</span>
          </h2>
        </Reveal>

        {verifiedReviews.length === 0 ? (
          <Reveal delay={150} className="mt-14 border border-ink-100 px-8 py-14 text-center md:px-20">
            <p className="display text-3xl text-ink-400 md:text-4xl">Reviews coming soon.</p>
            <p className="mx-auto mt-6 max-w-md text-sm leading-[1.5] text-ink-400">
              Verified guest reviews will appear here once they are collected. We do not publish fabricated testimonials.
            </p>
          </Reveal>
        ) : (
          <ul className="mt-14 grid gap-8 md:grid-cols-3">
            {verifiedReviews.map((review) => (
              <li key={review.quote}>
                <Reveal>
                  <figure className="flex h-full flex-col border-t border-ink-100 pt-8">
                    <blockquote className="font-serif text-2xl leading-[1.3] text-ink-800">{review.quote}</blockquote>
                    <figcaption className="mt-auto pt-10 text-xs uppercase tracking-[0.18em] text-ink-400">
                      {review.guestName}, {review.stayLabel}
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
