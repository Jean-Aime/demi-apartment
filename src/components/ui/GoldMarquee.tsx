interface GoldMarqueeProps {
  items: string[];
  className?: string;
}

/** A gold ribbon of small caps, used once per page as a graphic device. */
export default function GoldMarquee({ items, className = '' }: GoldMarqueeProps) {
  if (items.length === 0) return null;

  return (
    <div className={`overflow-hidden border-y border-ink-900/10 bg-gold text-ink-900 ${className}`}>
      <div className="marquee-track flex w-max items-center py-3.5 md:py-4">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? 'true' : undefined}
            className="flex shrink-0 items-center"
          >
            {items.map((item) => (
              <span key={`${copy}-${item}`} className="flex items-center">
                <span className="whitespace-nowrap px-6 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.3em] md:px-9">
                  {item}
                </span>
                <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-ink-900/45" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
