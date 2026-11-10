import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import SpecItem from '@/components/apartments/SpecItem';
import ApartmentGallery from '@/components/apartments/ApartmentGallery';
import Reveal from '@/components/Reveal';
import NotFoundPage from '@/pages/NotFoundPage';
import { useApartments } from '@/hooks/useApartments';
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
  const apartment = apartments.find((room) => room.slug === slug);

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

  return (
    <main>
      <PageHeader
        eyebrow={`Residence ${apartment.number}`}
        title={apartment.name}
        intro={apartment.summary}
        image={apartment.photo}
      />

      <ApartmentGallery key={apartment.slug} roomName={apartment.name} photos={apartment.photos} />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-16 px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <Reveal className="md:col-span-7">
            <p className="eyebrow">Stay essentials</p>
            <h2 className="display mt-5 text-3xl text-ink-900">Room details</h2>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink-100 pt-8 sm:grid-cols-3">
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
            <p className="eyebrow">Amenities</p>
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
              <div className="border-l-2 border-gold bg-paper-warm px-4 py-4">
                <p className="text-sm text-ink-700">
                  {apartment.bookingEnabled
                    ? 'Choose your dates and guest details to check availability for this room.'
                    : 'This room is not available for instant booking yet. You can still send a request for this room; the property will verify availability and details before confirming.'}
                </p>
              </div>
              <Link
                to={`/booking?apartment=${apartment.slug}`}
                className="btn-gold group inline-flex items-center justify-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
              >
                {apartment.bookingEnabled ? 'Book this residence' : 'Request this residence'}
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
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
          <p className="eyebrow">Explore the collection</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
            {apartments.map((room) => (
              <Link
                key={room.slug}
                to={`/apartments/${room.slug}`}
                aria-current={room.slug === apartment.slug ? 'page' : undefined}
                className={`min-w-0 border px-3 py-3 transition-colors sm:px-4 sm:py-4 ${
                  room.slug === apartment.slug
                    ? 'border-gold bg-paper-warm text-ink-900'
                    : 'border-ink-100 text-ink-500 hover:border-gold hover:text-ink-900'
                }`}
              >
                <span className="block text-[0.6rem] uppercase tracking-[0.18em] text-gold">Residence</span>
                <span className="mt-2 block font-serif text-xl">{room.number}</span>
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </main>
  );
}
