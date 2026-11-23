import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import SpecItem from '@/components/apartments/SpecItem';
import ApartmentGallery from '@/components/apartments/ApartmentGallery';
import Reveal from '@/components/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import Accordion from '@/components/ui/Accordion';
import NotFoundPage from '@/pages/NotFoundPage';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath, getApartmentPublicId } from '@/lib/apartmentRoutes';
import {
  fetchPublicAmenities,
  fetchPublishedHouseRules,
  type PropertyAmenity,
  type PropertyHouseRule,
} from '@/lib/propertyContent';
import { EASE } from '@/lib/motion';
import { fetchApartmentGroups, fetchPublicSharedFacilities, type ApartmentGroup, type SharedFacility } from '@/lib/propertyApartmentGroups';
import { subscribeToPropertyDataChanges } from '@/lib/propertyDataEvents';

function priceLabel(apartmentPrice: { amount: number; currency: string } | undefined) {
  if (!apartmentPrice) return 'On request';
  if (apartmentPrice.currency !== 'USD' && apartmentPrice.currency !== 'EUR') return 'On request';
  return new Intl.NumberFormat('en', { style: 'currency', currency: apartmentPrice.currency, maximumFractionDigits: 0 }).format(
    apartmentPrice.amount,
  );
}

export default function ApartmentDetailPage() {
  const { slug } = useParams();
  const { apartments, loading } = useApartments();
  const [amenities, setAmenities] = useState<PropertyAmenity[]>([]);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [publishedRules, setPublishedRules] = useState<PropertyHouseRule[]>([]);
  const [rulesError, setRulesError] = useState('');
  const [groups, setGroups] = useState<ApartmentGroup[]>([]);
  const [sharedFacilities, setSharedFacilities] = useState<SharedFacility[]>([]);
  const reduceMotion = useReducedMotion();

  const roomIndex = apartments.findIndex(
    (room) => getApartmentPublicId(room) === slug || room.slug === slug,
  );
  const apartment = apartments[roomIndex];

  useEffect(() => {
    let active = true;
    const loadPublicContent = async () => {
      try {
        const [items, rules, nextGroups, nextFacilities] = await Promise.all([
          fetchPublicAmenities(),
          fetchPublishedHouseRules(),
          fetchApartmentGroups(),
          fetchPublicSharedFacilities(),
        ]);
        if (active) {
          setAmenities(items);
          setPublishedRules(rules);
          setGroups(nextGroups);
          setSharedFacilities(nextFacilities);
          setAmenitiesError('');
          setRulesError('');
        }
      } catch (cause: unknown) {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : 'Public property information is unavailable.';
        setAmenitiesError(message);
        setRulesError(message);
      }
    };
    void loadPublicContent();
    const unsubscribe = subscribeToPropertyDataChanges(() => { void loadPublicContent(); });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [slug]);

  if (!apartment) {
    if (loading) {
      return (
        <main className="min-h-[60vh] bg-paper" aria-label="Loading residence">
          <div className="mx-auto max-w-site px-5 pt-40 md:px-12 lg:px-16">
            <p className="eyebrow text-gold-ink">Loading residence</p>
          </div>
        </main>
      );
    }
    return <NotFoundPage />;
  }
  if (apartment.slug === slug) {
    return <Navigate to={getApartmentPath(apartment)} replace />;
  }

  const roomAmenities = amenities.filter((item) => item.scope === 'room' && item.apartment_slug === apartment.slug);
  const otherRooms = apartments.filter((room) => room.slug !== apartment.slug);
  const alignRight = roomIndex % 2 === 1;
  const galleryPhotos = alignRight ? [...apartment.photos].reverse() : apartment.photos;
  const rate = priceLabel(apartment.startingPrice);

  return (
    <main>
      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-ink-900 pb-12 pt-36 text-paper md:pb-16">
        <motion.img
          src={apartment.photo.src}
          alt={apartment.photo.alt}
          initial={reduceMotion ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-75"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,8,0.88)_0%,rgba(8,8,8,0.42)_58%,rgba(8,8,8,0.2)_100%),linear-gradient(0deg,rgba(8,8,8,0.9)_0%,rgba(8,8,8,0.08)_62%,rgba(8,8,8,0.35)_100%)]"
        />

        <div className="mx-auto w-full max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <Reveal>
            <nav
              aria-label="Breadcrumb"
              className="mb-10 flex flex-wrap items-center gap-3 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-paper/50"
            >
              <Link to="/" className="transition-colors hover:text-gold-light">Home</Link>
              <span aria-hidden="true" className="text-gold-light/60">/</span>
              <Link to="/apartments" className="transition-colors hover:text-gold-light">Residences</Link>
              <span aria-hidden="true" className="text-gold-light/60">/</span>
              <span aria-current="page" className="text-paper">{apartment.name}</span>
            </nav>
          </Reveal>

          <div className={`grid gap-10 md:grid-cols-12 md:items-end md:gap-x-8 ${alignRight ? 'text-left' : ''}`}>
            <div className={`md:col-span-7 ${alignRight ? 'md:col-start-6' : ''}`}>
              <Reveal>
                <SectionLabel tone="light">Residence {apartment.number}</SectionLabel>
                <h1 className="display-tight mt-5 text-[clamp(4.5rem,11vw,10rem)] text-paper">{apartment.name}</h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-6 max-w-xl border-l border-gold/60 pl-5 text-[0.95rem] leading-[1.85] text-paper/70 md:text-base">
                  {apartment.summary}
                </p>
              </Reveal>
              <Reveal delay={200}>
                <a
                  href="#room-gallery"
                  className="group mt-8 inline-flex items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-paper/70 transition-colors hover:text-gold-light"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/30 transition-colors group-hover:border-gold-light">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  Discover the residence
                </a>
              </Reveal>
            </div>

            <Reveal delay={240} className="md:col-span-4 md:col-start-9 md:justify-self-end">
              <div className="w-full border border-gold-light/30 bg-ink-900/45 p-5 backdrop-blur-sm md:max-w-xs">
                <p className="eyebrow text-gold-light/80">Nightly rate</p>
                <p className="mt-3 font-display text-[2.4rem] leading-none text-paper">
                  {rate}
                  {apartment.startingPrice ? <span className="ml-2 font-sans text-[0.6rem] uppercase tracking-[0.18em] text-paper/50">/ night</span> : null}
                </p>
                <p className="mt-3 text-[0.7rem] leading-relaxed text-paper/50">
                  {apartment.bookingEnabled
                    ? 'Availability is checked before a reservation is confirmed.'
                    : 'This residence is currently offered by request.'}
                </p>
                <Link
                  to={`/booking?apartment=${apartment.slug}`}
                  className="btn-gold group mt-5 w-full !px-4 !py-3.5"
                >
                  {apartment.bookingEnabled ? 'Check dates' : 'Request a stay'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <ApartmentGallery key={`${apartment.slug}-${galleryPhotos[0]?.src}`} roomName={`Residence ${apartment.name}`} photos={galleryPhotos} />

      <section className="bg-paper py-16 md:py-24">
        <div className="mx-auto grid max-w-site gap-14 px-5 sm:px-6 md:grid-cols-12 md:gap-x-8 md:px-12 lg:px-16">
          <div className="md:col-span-7">
            <Reveal>
              <SectionLabel index="01">The residence</SectionLabel>
              <h2 className="display mt-6 text-[clamp(2.3rem,4vw,3.75rem)] text-ink-900">
                Stay essentials, <span className="italic text-gold-ink">verified.</span>
              </h2>
              <p className="mt-6 max-w-xl text-[0.975rem] leading-[1.9] text-ink-500">
                Everything below is published from the property’s records. Where a detail has not been verified, it is
                shown as “to be confirmed” rather than estimated.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <dl className="mt-10 grid grid-cols-2 border-t border-ink-200 sm:grid-cols-3">
                {[
                  { label: 'Beds', value: apartment.bedConfiguration },
                  { label: 'Bedrooms', value: apartment.bedrooms ? String(apartment.bedrooms) : undefined },
                  { label: 'Bathrooms', value: apartment.bathrooms ? String(apartment.bathrooms) : undefined },
                  { label: 'Guests', value: apartment.maxOccupancy ? `Up to ${apartment.maxOccupancy}` : undefined },
                  { label: 'Size', value: apartment.sizeSqm ? `${apartment.sizeSqm} m²` : undefined },
                  { label: 'Minimum stay', value: apartment.minimumStay ? `${apartment.minimumStay} nights` : undefined },
                  { label: 'Check-in', value: apartment.checkIn },
                  { label: 'Check-out', value: apartment.checkOut },
                  { label: 'Rate', value: apartment.startingPrice ? `${rate} per night` : undefined },
                ].map((item) => (
                  <div key={item.label} className="border-b border-ink-200 py-5 pr-4">
                    <SpecItem label={item.label} value={item.value} />
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={160} className="mt-10">
              <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link to="/terms" className="link-line text-ink-900">Booking terms</Link>
                <Link to="/cancellation" className="link-line text-ink-600 hover:text-ink-900">Cancellation policy</Link>
                <Link to="/contact" className="link-line text-ink-600 hover:text-ink-900">Ask a question</Link>
              </div>
            </Reveal>

            <div className="mt-14 border-t border-ink-200 pt-10">
              <Reveal>
                <SectionLabel index="02">Amenities</SectionLabel>
                <h2 className="display mt-5 text-[clamp(2rem,3.2vw,2.8rem)] text-ink-900">
                  Included with <span className="italic text-gold-ink">your stay.</span>
                </h2>
              </Reveal>
              {amenitiesError ? (
                <p className="mt-6 text-sm text-[#a8402c]" role="alert">{amenitiesError}</p>
              ) : roomAmenities.length > 0 ? (
                <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  {roomAmenities.map((amenity, index) => (
                    <Reveal key={amenity.id} delay={index * 60}>
                      <li className="border-t border-ink-200 pt-4">
                        {amenity.photo_path && (
                          <img
                            src={amenity.photo_path}
                            alt={amenity.photo_alt}
                            loading="lazy"
                            className="mb-4 aspect-[4/3] w-full object-cover"
                          />
                        )}
                        <h3 className="font-display text-[1.35rem] text-ink-900">{amenity.name}</h3>
                        {amenity.description && (
                          <p className="mt-2 text-[0.875rem] leading-[1.8] text-ink-500">{amenity.description}</p>
                        )}
                      </li>
                    </Reveal>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 max-w-lg border-t border-ink-200 pt-6 text-[0.9rem] italic leading-relaxed text-ink-400">
                  Room amenities are being confirmed by the property. Ask the team if you need something specific.
                </p>
              )}
            </div>

            <div className="mt-14 border-t border-ink-200 pt-10">
              <Reveal>
                <SectionLabel index="03">House rules</SectionLabel>
                <h2 className="display mt-5 text-[clamp(2rem,3.2vw,2.8rem)] text-ink-900">
                  The <span className="italic text-gold-ink">understanding.</span>
                </h2>
              </Reveal>
              {rulesError ? (
                <p className="mt-6 text-sm text-[#a8402c]" role="alert">{rulesError}</p>
              ) : publishedRules.length > 0 ? (
                <div className="mt-8">
                  <Accordion
                    items={publishedRules.map((rule) => ({
                      question: `${rule.category} — ${rule.title}`,
                      answer: rule.details,
                    }))}
                  />
                </div>
              ) : (
                <p className="mt-6 max-w-lg border-t border-ink-200 pt-6 text-[0.9rem] italic leading-relaxed text-ink-400">
                  The property has not published verified house rules yet. Any rules in force will be confirmed with
                  your reservation.
                </p>
              )}
            </div>

            {apartment.apartmentGroup && (
              <div className="mt-14 border-t border-ink-200 pt-10">
                <Reveal>
                  <SectionLabel index="04">Your apartment&apos;s shared spaces</SectionLabel>
                  <h2 className="display mt-5 text-[clamp(2rem,3.2vw,2.8rem)] text-ink-900">
                    Apartment {apartment.apartmentGroup} shared <span className="italic text-gold-ink">spaces.</span>
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500">
                    This private bedroom is in Apartment {apartment.apartmentGroup}. Its living room and kitchen are shared with guests staying in the other bedrooms of Apartment {apartment.apartmentGroup}.
                  </p>
                </Reveal>
                <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  {sharedFacilities
                    .filter((facility) => groups.find((group) => group.id === facility.apartment_group_id)?.identifier === apartment.apartmentGroup)
                    .map((facility, index) => (
                    <Reveal key={facility.id} delay={index * 60}>
                      <li className="border-t border-ink-200 pt-4">
                        {facility.photos[0] && (
                          <img
                            src={facility.photos[0].src}
                            alt={facility.photos[0].alt}
                            loading="lazy"
                            className="mb-4 aspect-[4/3] w-full object-cover"
                          />
                        )}
                        <p className="eyebrow text-gold-ink">{facility.facility_type === 'living_room' ? 'Shared living room' : 'Shared kitchen'}</p>
                        <p className="mt-2 font-display text-[1.35rem] text-ink-900">{facility.name}</p>
                        {facility.description && (
                          <p className="mt-2 text-[0.875rem] leading-[1.8] text-ink-500">{facility.description}</p>
                        )}
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <Reveal delay={120}>
              <aside className="md:sticky md:top-32">
                <div className="border border-ink-200/80 bg-paper-warm p-6">
                  <p className="eyebrow text-gold-ink">{apartment.bookingEnabled ? 'Reserve directly' : 'By request'}</p>
                  <h2 className="display mt-4 text-3xl text-ink-900">Residence {apartment.name}</h2>
                  <p className="mt-4 border-t border-ink-300/60 pt-4 font-display text-[1.75rem] leading-none text-ink-900">
                    {rate}
                    {apartment.startingPrice && (
                      <span className="ml-2 font-sans text-[0.6rem] uppercase tracking-[0.16em] text-ink-400">/ night</span>
                    )}
                  </p>
                  <Link
                    to={`/booking?apartment=${apartment.slug}`}
                    className="btn-gold group mt-5 w-full !px-5 !py-3.5"
                  >
                    {apartment.bookingEnabled ? 'Book this residence' : 'Request this residence'}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                  <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-500">
                    {apartment.bookingEnabled
                      ? 'Availability is checked before your reservation is confirmed.'
                      : 'Requests are reviewed by the property before any stay is confirmed. Dates are not held and no payment is taken.'}
                  </p>
                  <dl className="mt-5 space-y-2.5 border-t border-ink-300/60 pt-4 text-[0.8rem] text-ink-600">
                    {apartment.checkIn && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-400">Check-in</dt>
                        <dd>{apartment.checkIn}</dd>
                      </div>
                    )}
                    {apartment.checkOut && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-400">Check-out</dt>
                        <dd>{apartment.checkOut}</dd>
                      </div>
                    )}
                    {apartment.maxOccupancy && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-400">Guests</dt>
                        <dd>Up to {apartment.maxOccupancy}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="mt-4 border border-ink-200/80 p-5">
                  <p className="eyebrow text-ink-400">Need help?</p>
                  <p className="mt-3 text-[0.85rem] leading-[1.8] text-ink-500">
                    The team can confirm details, arrival arrangements and group questions before you book.
                  </p>
                  <Link to="/contact" className="link-line mt-4 text-ink-900">
                    Contact the team
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-paper-warm py-16 md:py-24">
        <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink-300/60 pb-6">
            <div>
              <SectionLabel>Continue exploring</SectionLabel>
              <h2 className="display mt-4 text-[clamp(2rem,3.4vw,3rem)] text-ink-900">Other residences</h2>
            </div>
            <Link to="/apartments" className="link-line text-ink-900">
              All private bedrooms
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {otherRooms.slice(0, 4).map((room, index) => (
              <Reveal key={room.slug} delay={index * 80}>
                <Link to={getApartmentPath(room)} className="group block">
                  <div className="aspect-[3/4] w-full overflow-hidden bg-paper-muted">
                    <img
                      src={room.photo.src}
                      alt={room.photo.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3 border-b border-ink-300/50 pb-2">
                    <span className="font-display text-[1.4rem] text-ink-900 transition-colors group-hover:text-gold-ink">
                      {room.name}
                    </span>
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.18em] text-ink-400">
                      {room.number}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
