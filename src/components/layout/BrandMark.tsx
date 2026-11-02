import { Link } from 'react-router-dom';

const LOGO_SRC = '/logo.jpeg';
const LOGO_WIDTH = 1280;
const LOGO_HEIGHT = 764;

interface BrandMarkProps {
  light?: boolean;
  size?: 'sm' | 'lg';
}

export default function BrandMark({ light = false, size = 'sm' }: BrandMarkProps) {
  const isLarge = size === 'lg';

  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-3 sm:gap-4 ${light ? 'text-paper' : 'text-ink-900'}`}
      aria-label="DEMI APARTMENT, home"
    >
      <span
        className={`shrink-0 border border-gold/50 transition-colors duration-700 group-hover:border-gold ${
          isLarge ? 'p-1' : 'p-0.5'
        }`}
      >
        <img
          src={LOGO_SRC}
          alt="DeMi Apartment"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          decoding="async"
          className={`w-auto object-contain ${isLarge ? 'h-16' : 'h-11'}`}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif tracking-[0.2em] transition-colors duration-500 group-hover:text-gold-deep ${
            isLarge ? 'text-2xl' : 'text-xl'
          }`}
        >
          DEMI
        </span>
        <span
          className={`mt-1 font-sans text-[0.625rem] font-medium tracking-[0.42em] transition-colors duration-500 group-hover:text-gold ${
            light ? 'text-paper/65' : 'text-ink-400'
          }`}
        >
          APARTMENT
        </span>
      </span>
    </Link>
  );
}