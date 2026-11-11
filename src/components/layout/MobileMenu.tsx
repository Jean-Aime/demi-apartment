import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { navigation } from '@/data/site';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      id="site-navigation"
      aria-hidden={!open}
      className={`fixed inset-0 z-40 text-ink-900 transition-[opacity,visibility] duration-500 ${
        open ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-ink-900/45 transition-opacity duration-500"
      />

      <aside
        aria-label="Site menu"
        className={`relative ml-auto h-full max-h-[100svh] w-full max-w-[500px] overflow-y-auto border-l border-gold/20 bg-paper shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 pb-10 pt-28 sm:px-8"
        >
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-ink-200 pb-5 sm:mb-10">
            <div>
              <p className="eyebrow">Explore DEMI</p>
              <h2 className="display mt-2 text-2xl text-ink-900 sm:text-3xl">Find your way around.</h2>
            </div>
            <p className="hidden text-right text-[0.6rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-ink-400 sm:block">
              Kimironko
              <br />
              Kigali · Rwanda
            </p>
          </div>

          <ul className="grid border-y border-ink-200">
            {navigation.map((item, index) => (
              <li
                key={item.to}
                className="overflow-hidden border-b border-ink-200 last:border-b-0"
                style={{ transitionDelay: open ? `${index * 70 + 100}ms` : '0ms' }}
              >
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  tabIndex={open ? 0 : -1}
                  className={({ isActive }) =>
                    `group flex min-h-16 items-center justify-between gap-4 py-4 font-serif text-[clamp(1.65rem,3vw,2.5rem)] leading-none transition-all duration-700 hover:text-gold-deep ${
                      isActive ? 'text-gold-deep' : 'text-ink-900'
                    } ${open ? 'translate-y-0' : 'translate-y-full'}`
                  }
                >
                  <span>{item.label}</span>
                  <span className="font-sans text-[0.6rem] font-medium tracking-[0.18em] text-gold-deep/70">
                    0{index + 1}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-5 sm:mt-10">
            <p className="max-w-md text-sm leading-relaxed text-ink-500">
              Discover our residences, the experience, and the details of a stay at DEMI.
            </p>
            <Link
              to="/booking"
              onClick={onClose}
              tabIndex={open ? 0 : -1}
              className="btn-gold inline-flex w-fit items-center px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em] sm:px-8"
            >
              Book now
            </Link>
          </div>
        </nav>
      </aside>
    </div>
  );
}
