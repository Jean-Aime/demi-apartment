import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import SpecItem from '@/components/apartments/SpecItem';
import ApartmentGallery from '@/components/apartments/ApartmentGallery';
import Reveal from '@/components/Reveal';
import NotFoundPage from '@/pages/NotFoundPage';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath, getApartmentPublicId } from '@/lib/apartmentRoutes';
import {
  fetchPublicAmenities,
  fetchPublishedHouseRules,
  type PropertyAmenity,
  type PropertyHouseRule,
} from '@/lib/propertyContent';

export default function ApartmentDetailPage() {
  const { slug } = useParams();
  const { apartments, loading } = useApartments();
  const [amenities, setAmenities] = useState<PropertyAmenity[]>([]);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [publishedRules, setPublishedRules] = useState<PropertyHouseRule[]>([]);
  const [rulesError, setRulesError] = useState('');
  const apartment = apartments.find(
    (room) => getApartmentPublicId(room) === slug || room.slug === slug,
  );

  useEffect(() => {
    let active = true;
    Promise.all([fetchPublicAmenities(), fetchPublishedHouseRules()])
      .then(([items, rules]) => {
        if (active) {
          setAmenities(items);
          setPublishedRules(rules);
          setAmenitiesError('');
          setRulesError('');
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : 'Public property information is unavailable.';
        setAmenitiesError(message);
        setRulesError(message);
      });
    return () => { active = false; };
  }, []);

  if (!apartment) {
    if (loading) {
      return <main className="min-h-[40vh] bg-paper" aria-label="Loading residence" />;
    }
    return <NotFoundPage />;
  }
  if (apartment.slug === slug) {
    return <Navigate to={getApartmentPath(apartment)} replace />;
  }

  return (
    <main>
      <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-ink-900 pb-14 pt-40 text-paper md:pb-20">
        <img
          src={apartment.photo.src}
          alt={apartment.photo.alt}
          className="page-header-media absolute inset-0 -z-10 h-full w-full object-cover opacity-65"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(14,13,11,0.82),rgba(14,13,11,0.24)_75%),linear-gradient(0deg,rgba(14,13,11,0.8),rgba(14,13,11,0.02)_80%)]"
        />
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-6 md:px-12 lg:px-16">
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-12 flex items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-paper/65">
              <Link to="/apartments" className="transition-colors hover:text-gold-light">The collection</Link>
              <span aria-hidden="true" className="text-gold-light">/</span>
              <span aria-current="page" className="text-paper">{apartment.name}</span>
            </nav>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <Reveal delay={80}>
                <p className="eyebrow inline-flex items-center gap-3 text-gold-light">
                  <span className="h-px w-8 bg-gold-light" aria-hidden="true" />
                  Residence {apartment.number}
                </p>
                <h1 className="display mt-5 text-[clamp(4rem,10vw,9rem)] text-paper">{apartment.name}</h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-4 max-w-2xl border-l border-gold/70 pl-5 text-base leading-relaxed text-paper/75 md:text-lg">
                  {apartment.summary}
                </p>
              </Reveal>
            </div>
            <Reveal delay={260} className="md:col-span-3 md:col-start-10 md:justify-self-end">
              <a
                href="#room-gallery"
                className="group inline-flex items-center gap-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:text-gold-light"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-paper/40 transition-colors group-hover:border-gold-light">
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </span>
                Discover the residence
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <ApartmentGallery key={apartment.slug} roomName={apartment.name} photos={apartment.photos} />

      <section className="bg-paper py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-7">
            <p className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
              Stay essentials
            </p>
            <h2 className="display mt-5 text-4xl text-ink-900">Room details</h2>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink-100 bg-paper-warm/55 p-6 sm:grid-cols-3 sm:p-8">
              <SpecItem label="Beds" value={apartment.bedConfiguration} />
              <SpecItem label="Bedrooms" value={apartment.bedrooms ? String(apartment.bedrooms) : undefined} />
              <SpecItem label="Bathrooms" value={apartment.bathrooms ? String(apartment.bathrooms) : undefined} />
              <SpecItem label="Guests" value={apartment.maxOccupancy ? `Up to ${apartment.maxOccupancy}` : undefined} />
              <SpecItem label="Size" value={apartment.sizeSqm ? `${apartment.sizeSqm} m²` : undefined} />
              <SpecItem
                label="Nightly rate"
                value={
                  apartment.startingPrice
                    ? `${apartment.startingPrice.amount} ${apartment.startingPrice.currency} per night`
                    : undefined
                }
              />
              <SpecItem label="Check-in" value={apartment.checkIn} />
              <SpecItem label="Check-out" value={apartment.checkOut} />
              <SpecItem
                label="Minimum stay"
                value={apartment.minimumStay ? `${apartment.minimumStay} nights` : undefined}
              />
            </dl>
          </Reveal>

          <Reveal delay={150} className="md:col-span-4 md:col-start-9">
            <aside className="mb-12 border border-gold/25 bg-paper-warm p-6 sm:p-8">
              <p className="eyebrow">Make it your stay</p>
              <h2 className="display mt-4 text-3xl text-ink-900">{apartment.name}</h2>
              <p className="mt-5 border-t border-ink-100 pt-5 text-sm text-ink-500">
                {apartment.startingPrice
                  ? `${apartment.startingPrice.amount} ${apartment.startingPrice.currency} per night`
                  : 'Contact the property for availability and rates.'}
              </p>
              <Link
                to={`/booking?apartment=${apartment.slug}`}
                className="btn-gold group mt-6 inline-flex w-full items-center justify-center gap-3 px-5 py-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
              >
                {apartment.bookingEnabled ? 'Book this residence' : 'Request this residence'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                {apartment.bookingEnabled
                  ? 'Availability is checked before your reservation is confirmed.'
                  : 'Requests are reviewed by the property before any stay is confirmed.'}
              </p>
            </aside>
            <p className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
              Amenities
            </p>
            <h2 className="display mt-5 text-3xl text-ink-900">Included with your stay</h2>
            {amenitiesError ? (
              <p className="mt-8 border-t border-ink-100 pt-8 text-sm text-rose-700" role="alert">{amenitiesError}</p>
            ) : amenities.filter((item) => item.scope === 'room' && item.apartment_slug === apartment.slug).length > 0 ? (
              <ul className="mt-8 grid gap-4 border-t border-ink-100 pt-8">
                {amenities.filter((item) => item.scope === 'room' && item.apartment_slug === apartment.slug).map((amenity) => (
                  <li key={amenity.id} className="border-t border-ink-100 pt-4 text-ink-800">
                    {amenity.photo_path && <img src={amenity.photo_path} alt={amenity.photo_alt} className="mb-3 max-h-56 w-full object-cover" loading="lazy" />}
                    <h3 className="font-medium">{amenity.name}</h3>
                    {amenity.description && <p className="mt-1 text-sm leading-relaxed text-ink-500">{amenity.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 border-t border-ink-100 pt-8 italic text-ink-400">
                Room amenities are being confirmed by the property.
              </p>
            )}

            <div className="mt-10 border-t border-ink-100 pt-8">
              <h3 className="eyebrow">House rules</h3>
              {rulesError ? (
                <p className="mt-4 text-sm text-rose-700" role="alert">{rulesError}</p>
              ) : publishedRules.length > 0 ? (
                <ul className="mt-5 space-y-3 text-sm text-ink-700">
                  {publishedRules.map((rule) => <li key={rule.id}><span className="font-medium">{rule.title}: </span>{rule.details}</li>)}
                </ul>
              ) : (
                <p className="mt-4 text-sm italic text-ink-400">
                  The property has not published verified house rules yet.
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <Link to="/terms" className="link-line text-ink-900">Booking terms</Link>
                <Link to="/cancellation" className="link-line text-ink-900">Cancellation policy</Link>
              </div>
            </div>

            {amenities.filter((item) => item.scope === 'shared').length > 0 && (
              <div className="mt-10 border-t border-ink-100 pt-8">
                <h3 className="eyebrow">Verified shared facilities</h3>
                <ul className="mt-5 space-y-5">
                  {amenities.filter((item) => item.scope === 'shared').map((amenity) => (
                    <li key={amenity.id}>
                      {amenity.photo_path && <img src={amenity.photo_path} alt={amenity.photo_alt} className="mb-3 max-h-56 w-full object-cover" loading="lazy" />}
                      <p className="text-sm font-medium text-ink-900">{amenity.name}</p>
                      {amenity.description && <p className="mt-1 text-sm leading-relaxed text-ink-500">{amenity.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 flex flex-col gap-6">
              <Link to="/apartments" className="link-line text-ink-900">
                View all nine rooms
              </Link>
            </div>
          </Reveal>
        </div>

        <nav
          aria-label="All nine rooms"
          className="mx-auto mt-16 max-w-[1440px] border-t border-ink-100 px-6 pt-8 md:px-12 lg:px-16"
        >
          <p className="eyebrow inline-flex items-center gap-3">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            Continue exploring
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
            {apartments.map((room) => (
              <Link
                key={room.slug}
                to={getApartmentPath(room)}
                aria-current={room.slug === apartment.slug ? 'page' : undefined}
                aria-label={`View residence ${room.number}`}
                className={`group min-w-0 overflow-hidden border transition-colors ${
                  room.slug === apartment.slug
                    ? 'border-gold bg-paper-warm text-ink-900'
                    : 'border-ink-100 text-ink-500 hover:border-gold hover:text-ink-900'
                }`}
              >
                <img
                  src={room.photo.src}
                  alt=""
                  loading="lazy"
                  className="h-20 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="flex items-center justify-between gap-2 px-3 py-3">
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.1em]">Room {room.number}</span>
                  {room.slug === apartment.slug && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </main>
  );
}
