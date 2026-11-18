import { Link } from 'react-router-dom';

interface BrandMarkProps {
  light?: boolean;
  size?: 'sm' | 'lg';
}

/**
 * Typographic wordmark. The supplied logo file is a full contact card and is
 * illegible at header scale, so it is retained unchanged as the site icon
 * (/logo.jpeg) while the brand name is set in the display serif here.
 */
export default function BrandMark({ light = false, size = 'sm' }: BrandMarkProps) {
  const isLarge = size === 'lg';

  return (
    <Link
      to="/"
      className={`group inline-flex flex-col ${light ? 'text-paper' : 'text-ink-900'}`}
      aria-label="DEMI APARTMENT, home"
    >
      <span
        className={`font-display leading-none tracking-[0.26em] transition-colors duration-500 group-hover:text-gold-bronze ${
          isLarge ? 'text-[2rem]' : 'text-[1.4rem]'
        }`}
      >
        DEMI
      </span>
      <span className="mt-1.5 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`h-px transition-all duration-700 group-hover:w-7 ${
            isLarge ? 'w-6' : 'w-4'
          } ${light ? 'bg-gold-light/70' : 'bg-gold-bronze/70'}`}
        />
        <span
          className={`font-sans font-medium uppercase transition-colors duration-500 ${
            isLarge ? 'text-[0.62rem] tracking-[0.4em]' : 'text-[0.5rem] tracking-[0.36em]'
          } ${light ? 'text-paper/60' : 'text-ink-400'}`}
        >
          Apartment
        </span>
      </span>
    </Link>
  );
}
