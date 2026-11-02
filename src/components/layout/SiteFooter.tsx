import { Link } from 'react-router-dom';
import { contact, navigation, siteName, socialLinks } from '@/data/site';
import { policyLinks } from '@/data/policies';
import BrandMark from '@/components/layout/BrandMark';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-paper-warm text-ink-400">
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-12 px-5 py-16 sm:grid-cols-3 sm:px-6 sm:py-20 md:grid-cols-6 md:gap-x-8 md:px-12 lg:grid-cols-12 lg:gap-y-16 lg:px-16 lg:py-24">
        <div className="col-span-2 sm:col-span-3 md:col-span-6 lg:col-span-4">
          <BrandMark size="lg" />
          <p className="mt-8 max-w-sm font-serif text-2xl leading-[1.2] text-ink-800">
            A considered place to stay, shaped around privacy and comfort.
          </p>
        </div>

        <nav aria-label="Footer" className="col-span-1 min-w-0 sm:col-span-1 md:col-span-2 lg:col-start-6">
          <h2 className="eyebrow">Explore</h2>
          <ul className="mt-6 space-y-4 text-sm">
            {navigation.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors duration-300 hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-1 min-w-0 sm:col-span-2 md:col-span-2 lg:col-span-3">
          <h2 className="eyebrow">Contact</h2>
          <ul className="mt-6 space-y-4 text-sm">
            <li>
              <a href={`mailto:${contact.email}`} className="break-all transition-colors duration-300 hover:text-gold">
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="transition-colors duration-300 hover:text-gold"
              >
                {contact.phone}
              </a>
            </li>
          </ul>
        </div>

        {socialLinks.length > 0 && (
          <div className="col-span-1 min-w-0 md:col-span-2">
            <h2 className="eyebrow">Follow</h2>
            <ul className="mt-6 space-y-4 text-sm">
              {socialLinks.map((link) => (
                <li key={link.to}>
                  <a
                    href={link.to}
                    className="transition-colors duration-300 hover:text-gold"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 text-xs uppercase tracking-[0.14em] sm:px-6 md:flex-row md:items-center md:justify-between md:px-12 md:tracking-[0.18em] lg:px-16">
          <p>
            &copy; {year} {siteName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {policyLinks.map((policy) => (
              <li key={policy.to}>
                <Link to={policy.to} className="transition-colors duration-300 hover:text-gold">
                  {policy.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
