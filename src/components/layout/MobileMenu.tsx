import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { navigation } from '@/data/site';
import { usePropertySettings } from '@/hooks/usePropertySettings';
import { EASE } from '@/lib/motion';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const contact = usePropertySettings();
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
        <motion.div
          id="site-navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="fixed inset-0 z-[55] overflow-y-auto bg-ink-900 text-paper xl:hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(231,169,35,0.16),transparent_55%)]"
          />
          <div className="relative mx-auto flex min-h-[100svh] max-w-site flex-col px-5 pb-10 pt-6 sm:px-6 md:px-12">
            <div className="flex items-center justify-between border-b border-paper/15 pb-5">
              <p className="eyebrow text-gold-light">DEMI APARTMENT</p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center border border-paper/30 text-paper transition-colors hover:border-gold-light hover:text-gold-light"
              >
                <span className="sr-only">Close menu</span>
                <X className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Site" className="flex flex-1 flex-col justify-center py-10">
              <ul>
                {navigation.map((item, index) => (
                  <motion.li
                    key={item.to}
                    initial={reduceMotion ? false : { opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 + index * 0.06, ease: EASE }}
                    className="border-b border-paper/12"
                  >
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-baseline justify-between gap-6 py-4 transition-colors duration-500 ${
                          isActive ? 'text-gold-light' : 'text-paper hover:text-gold-light'
                        }`
                      }
                    >
                      <span className="font-display text-[clamp(2.2rem,8vw,3.4rem)] leading-none tracking-[-0.02em]">
                        {item.label}
                      </span>
                      <span className="font-sans text-[0.6rem] font-medium uppercase tracking-[0.24em] text-gold-light/50">
                        0{index + 1}
                      </span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
                className="mt-10 flex flex-col gap-6"
              >
                <Link to="/booking" onClick={onClose} className="btn-gold w-full">
                  Check availability
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <div className="flex flex-col gap-1 font-sans text-[0.7rem] leading-relaxed text-paper/55">
                  <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-gold-light">
                    {contact.email}
                  </a>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-gold-light">
                    {contact.phone}
                  </a>
                  <span className="mt-2 uppercase tracking-[0.22em] text-gold-light/70">Kimironko · Kigali · Rwanda</span>
                </div>
              </motion.div>
            </nav>
          </div>
        </motion.div>
  );
}
