import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { navigation, siteName, socialLinks } from '@/data/site';
import { policyLinks } from '@/data/policies';
import BrandMark from '@/components/layout/BrandMark';
import { usePropertySettings } from '@/hooks/usePropertySettings';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Kimironko+Kigali+Rwanda';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const contact = usePropertySettings();
  const { apartments } = useApartments();

  return (
    <footer className="relative overflow-hidden bg-ink-900 text-paper/55">
      <div className="surface-gold h-[3px] w-full" aria-hidden="true" />

      <div className="relative mx-auto max-w-site px-5 pb-10 pt-16 sm:px-6 md:px-12 md:pt-20 lg:px-16">
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-12">
          <div className="md:col-span-12 lg:col-span-5">
            <BrandMark size="lg" />
            <p className="mt-8 max-w-md font-display text-[clamp(1.9rem,3vw,2.75rem)] leading-[1.08] tracking-[-0.02em] text-paper">
              Eight private bedrooms across three apartment groups, composed around light, quiet and <span className="italic text-gold-light">arrival.</span>
            </p>
            <p className="mt-7 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-gold-light/80">
              Kimironko · Kigali · Rwanda
            </p>
            <Link to="/booking" className="btn-outline-light mt-8 w-fit">
              Reserve a residence
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <nav aria-label="Footer navigation" className="md:col-span-4 lg:col-span-2 lg:col-start-7">
            <h2 className="eyebrow text-gold-light/80">Explore</h2>
            <ul className="mt-6 space-y-3.5 text-[0.9rem]">
              {navigation.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors duration-300 hover:text-gold-light">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4 lg:col-span-2">
            <h2 className="eyebrow text-gold-light/80">The collection</h2>
            <ul className="mt-6 space-y-3.5 text-[0.9rem]">
              {apartments.slice(0, 5).map((room) => (
                <li key={room.slug}>
                  <Link to={getApartmentPath(room)} className="transition-colors duration-300 hover:text-gold-light">
                    Residence {room.number}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/apartments" className="text-gold-light/90 transition-colors duration-300 hover:text-gold-light">
                  All private bedrooms
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-3">
            <h2 className="eyebrow text-gold-light/80">Contact</h2>
            <ul className="mt-6 space-y-3.5 text-[0.9rem]">
              <li>
                <a href={`mailto:${contact.email}`} className="break-all transition-colors duration-300 hover:text-gold-light">
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="transition-colors duration-300 hover:text-gold-light"
                >
                  {contact.phone}
                </a>
              </li>
              <li className="text-paper/45">{contact.address}</li>
              <li>
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-gold-light/90 transition-colors hover:text-gold-light"
                >
                  Directions
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>

            {socialLinks.length > 0 && (
              <>
                <h2 className="eyebrow mt-8 text-gold-light/80">Follow</h2>
                <ul className="mt-4 space-y-3 text-[0.9rem]">
                  {socialLinks.map((link) => (
                    <li key={link.to}>
                      <a
                        href={link.to}
                        className="transition-colors duration-300 hover:text-gold-light"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 border-t border-paper/10 pt-7">
          <div className="flex flex-col gap-6 text-[0.6rem] uppercase tracking-[0.18em] md:flex-row md:items-center md:justify-between">
            <p>
              &copy; {year} {siteName}
            </p>
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {policyLinks.map((policy) => (
                <li key={policy.to}>
                  <Link to={policy.to} className="transition-colors duration-300 hover:text-gold-light">
                    {policy.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-paper/30">Direct reservations</p>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none -mb-6 mt-10 select-none overflow-hidden whitespace-nowrap font-display text-[clamp(4rem,14vw,12rem)] leading-[0.72] tracking-[-0.04em] text-paper/[0.045]"
        >
          DEMI APARTMENT
        </p>
      </div>
    </footer>
  );
}
