import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { useIsScrolled } from '@/hooks/useIsScrolled';
import { useApartments } from '@/hooks/useApartments';
import BrandMark from '@/components/layout/BrandMark';
import MobileMenu from '@/components/layout/MobileMenu';
import { navigation } from '@/data/site';
import { getApartmentPath } from '@/lib/apartmentRoutes';
import { EASE } from '@/lib/motion';

export default function SiteHeader() {
  const { pathname } = useLocation();
  const scrolled = useIsScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);
  const [residencesOpen, setResidencesOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const { apartments } = useApartments();

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const solid = scrolled || menuOpen;

  useEffect(() => {
    setMenuOpen(false);
    setResidencesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setResidencesOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  function openResidences() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setResidencesOpen(true);
  }

  function scheduleCloseResidences() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setResidencesOpen(false), 180);
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-2 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-500 ${
      solid
        ? isActive
          ? 'text-ink-900'
          : 'text-ink-500 hover:text-ink-900'
        : isActive
          ? 'text-paper'
          : 'text-paper/70 hover:text-paper'
    }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          solid
            ? 'border-ink-200/60 bg-paper/95 text-ink-900 shadow-[0_1px_0_rgba(8,8,8,0.02)] backdrop-blur-md'
            : 'border-transparent bg-gradient-to-b from-ink-900/55 via-ink-900/15 to-transparent text-paper'
        }`}
      >
        <div className="mx-auto grid h-20 max-w-site grid-cols-[auto_1fr_auto] items-center gap-6 px-5 sm:px-6 md:h-24 md:px-12 lg:px-16">
          <BrandMark light={!solid} />

          <nav aria-label="Primary" className="hidden items-center justify-center gap-7 xl:flex">
            {navigation.map((item) =>
              item.to === '/apartments' ? (
                <div
                  key={item.to}
                  className="relative flex items-center gap-1"
                  onMouseEnter={openResidences}
                  onMouseLeave={scheduleCloseResidences}
                  onFocus={openResidences}
                >
                  <NavLink to={item.to} className={navLinkClass}>
                    {({ isActive }) => (
                      <span className="relative inline-flex flex-col items-center">
                        {item.label}
                        {isActive && (
                          <motion.span
                            layoutId="primary-nav-indicator"
                            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                            className="absolute -bottom-1 h-px w-full bg-gold"
                          />
                        )}
                      </span>
                    )}
                  </NavLink>
                  <button
                    type="button"
                    aria-expanded={residencesOpen}
                    aria-controls="residences-menu"
                    aria-label="Show the nine residences"
                    onClick={() => setResidencesOpen((open) => !open)}
                    className="p-1 text-current opacity-60 transition-opacity hover:opacity-100"
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-300 ${residencesOpen ? 'rotate-180' : ''}`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {residencesOpen && (
                      <motion.div
                        id="residences-menu"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="absolute left-1/2 top-full w-[min(44rem,80vw)] -translate-x-1/2 pt-5 text-ink-900"
                        onClick={() => setResidencesOpen(false)}
                      >
                        <div className="border border-ink-200/70 bg-paper p-7 shadow-plate">
                          <div className="flex items-end justify-between gap-6 border-b border-ink-200/70 pb-4">
                            <div>
                              <p className="eyebrow text-gold-ink">The collection</p>
                              <p className="mt-2 font-display text-2xl">Nine residences, one address.</p>
                            </div>
                            <Link to="/apartments" className="link-line text-ink-900">
                              All residences
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          </div>
                          <ul className="mt-4 grid grid-cols-3 gap-x-6 gap-y-1">
                            {apartments.map((room) => (
                              <li key={room.slug}>
                                <Link
                                  to={getApartmentPath(room)}
                                  className="group flex items-baseline justify-between gap-3 border-b border-ink-100 py-3 transition-colors hover:text-gold-ink"
                                >
                                  <span className="font-display text-xl">{room.name}</span>
                                  <span className="font-sans text-[0.55rem] uppercase tracking-[0.18em] text-ink-400">
                                    Residence {room.number}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-5 font-sans text-[0.65rem] leading-relaxed text-ink-400">
                            Each residence is photographed and described individually. Open one to see its gallery,
                            verified details and booking options.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {({ isActive }) => (
                    <span className="relative inline-flex flex-col items-center">
                      {item.label}
                      {isActive && (
                        <motion.span
                          layoutId="primary-nav-indicator"
                          transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                          className="absolute -bottom-1 h-px w-full bg-gold"
                        />
                      )}
                    </span>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <Link
              to="/booking"
              className="btn-gold !px-4 !py-3 sm:!px-5 sm:!py-3.5"
            >
              Reserve
              <ArrowRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="site-navigation"
              className={`flex h-11 w-11 items-center justify-center border transition-colors duration-500 xl:hidden ${
                menuOpen
                  ? 'border-gold-bronze bg-gold text-ink-900'
                  : solid
                    ? 'border-ink-900/20 text-ink-900 hover:border-gold-bronze hover:text-gold-ink'
                    : 'border-paper/35 text-paper hover:border-gold-light hover:text-gold-light'
              }`}
            >
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
