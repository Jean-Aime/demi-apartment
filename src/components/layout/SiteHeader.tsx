import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useIsScrolled } from '@/hooks/useIsScrolled';
import BrandMark from '@/components/layout/BrandMark';
import MobileMenu from '@/components/layout/MobileMenu';

export default function SiteHeader() {
  const { pathname } = useLocation();
  const scrolled = useIsScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  const solid = scrolled || menuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,color,box-shadow,border-color] duration-500 ${
          solid
            ? 'border-ink-100/70 bg-paper/90 text-ink-900 shadow-[0_8px_30px_rgba(14,13,11,0.04)] backdrop-blur-xl'
            : 'border-paper/10 bg-ink-900/10 text-paper backdrop-blur-[2px]'
        }`}
      >
        <div className="mx-auto flex h-[5.5rem] max-w-[1440px] items-center justify-between px-5 sm:px-6 md:px-12 lg:px-16">
          <BrandMark light={!solid} />

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/booking"
              className={`hidden items-center px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition-all duration-500 sm:inline-flex ${
                solid
                  ? 'btn-outline border-ink-300/70 text-ink-800'
                  : 'border border-paper/55 text-paper hover:border-gold-light hover:bg-paper/10 hover:text-gold-light'
              }`}
            >
              Book now
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="site-navigation"
              className={`flex h-11 w-11 items-center justify-center border transition-all duration-500 hover:border-gold hover:text-gold ${
                menuOpen ? 'border-gold text-gold' : solid ? 'border-ink-200 text-ink-900' : 'border-paper/40 text-paper'
              }`}
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
