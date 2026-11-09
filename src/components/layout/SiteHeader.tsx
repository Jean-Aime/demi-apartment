import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { navigation } from '@/data/site';
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

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,box-shadow,border-color] duration-500 ${
          solid
            ? 'bg-paper/95 text-ink-900 shadow-[0_1px_0_0_rgba(184,149,74,0.2)] backdrop-blur-md'
            : 'bg-transparent text-paper'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:px-12 lg:px-16">
          <BrandMark light={!solid} />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={`link-line ${solid ? 'text-ink-500' : 'text-paper'}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <Link
                  to="/booking"
                  className={`inline-flex items-center px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] ${
                    solid
                      ? 'btn-outline'
                      : 'border border-paper/50 text-paper transition-colors duration-500 hover:border-gold hover:text-gold'
                  }`}
                >
                  Reserve
                </Link>
              </li>
            </ul>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 items-center justify-center transition-colors duration-500 hover:text-gold lg:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {menuOpen ? (
              <X className="h-6 w-6" strokeWidth={1.25} aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.25} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
