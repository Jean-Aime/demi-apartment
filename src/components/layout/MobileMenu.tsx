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
      id="mobile-menu"
      aria-hidden={!open}
      className={`fixed inset-0 z-40 bg-paper text-ink-900 transition-opacity duration-500 lg:hidden ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <nav aria-label="Mobile" className="flex max-h-[100svh] flex-col overflow-y-auto px-6 py-24 sm:px-8">
        <ul className="space-y-4 sm:space-y-6">
          {navigation.map((item, index) => (
            <li
              key={item.to}
              className="overflow-hidden"
              style={{ transitionDelay: open ? `${index * 60 + 120}ms` : '0ms' }}
            >
              <NavLink
                to={item.to}
                onClick={onClose}
                tabIndex={open ? 0 : -1}
                className={({ isActive }) =>
                  `block font-serif text-[clamp(2.5rem,10vw,3rem)] leading-[1.2] transition-all duration-700 hover:text-gold ${
                    isActive ? 'text-gold' : 'text-ink-900'
                  } ${open ? 'translate-y-0' : 'translate-y-full'}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <Link
          to="/contact"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="btn-gold mt-8 inline-flex w-fit items-center px-6 py-4 text-xs font-medium uppercase tracking-[0.16em] sm:mt-12 sm:px-8 sm:tracking-[0.2em]"
        >
          Reserve your stay
        </Link>
      </nav>
    </div>
  );
}
