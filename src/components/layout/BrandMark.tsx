import { Link } from 'react-router-dom';

interface BrandMarkProps {
  size?: 'sm' | 'lg';
}

export default function BrandMark({ size = 'sm' }: BrandMarkProps) {
  const isLarge = size === 'lg';

  return (
    <Link
      to="/"
      className={`group inline-flex shrink-0 items-center justify-center overflow-hidden bg-paper ${
        isLarge ? 'h-[88px] w-[152px] p-1.5' : 'h-[64px] w-[112px] p-1 sm:h-[72px] sm:w-[128px]'
      }`}
      aria-label="DEMI APARTMENT, home"
    >
      <img
        src="/images/Logo.png"
        alt=""
        width={1624}
        height={970}
        className="h-full w-full object-contain"
      />
    </Link>
  );
}
