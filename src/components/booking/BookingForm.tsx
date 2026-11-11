import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, Loader2, Search, ShieldCheck } from 'lucide-react';
import type { Apartment } from '@/data/apartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';
import DateRangeCalendar from '@/components/booking/DateRangeCalendar';
import {
  MAX_GUESTS,
  bookingSchema,
  createReservationRequest,
  createReservationHold,
  fetchBookedRanges,
  formatIsoDate,
  overlapsBookedRange,
  type BookingData,
  type BookingInput,
} from '@/lib/bookings';
import {
  fetchPublicAmenities,
  fetchPublishedHouseRules,
  type PropertyAmenity,
  type PropertyHouseRule,
} from '@/lib/propertyContent';

type SearchResult = {
  apartment: Apartment;
  amenities: PropertyAmenity[];
  available: boolean;
  requestOnly: boolean;
  reason?: string;
};

const fieldClass = 'booking-field';
const labelClass = 'block text-xs font-medium uppercase tracking-[0.2em] text-ink-500';
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-2 text-sm text-[#D88A78]" role="alert">{error}</p>}
    </div>
  );
}

function priceLabel(amount: number, currency: string): string {
  if (currency !== 'USD' && currency !== 'EUR') return 'Rate to be confirmed';
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
}

export default function BookingForm({
  apartments,
  initialApartmentSlug,
}: {
  apartments: Apartment[];
  initialApartmentSlug?: string;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [rootError, setRootError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [publishedRules, setPublishedRules] = useState<PropertyHouseRule[]>([]);
  const [sharedAmenities, setSharedAmenities] = useState<PropertyAmenity[]>([]);
  const [submittedRequest, setSubmittedRequest] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState('');
  const {
    register,
    trigger,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<BookingInput, unknown, BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      apartmentSlug: initialApartmentSlug ?? '',
      checkIn: '',
      checkOut: '',
      adults: 2,
      children: 0,
      firstName: '',
      lastName: '',
      guestEmail: '',
      guestPhone: '',
      guestCountry: '',
      estimatedArrivalTime: '',
      notes: '',
    },
  });

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const adults = watch('adults') || 0;
  const children = watch('children') || 0;
  const apartmentSlug = watch('apartmentSlug');
  const selectedApartment = apartments.find((apartment) => apartment.slug === apartmentSlug);
  const requestOnly = Boolean(selectedApartment && !selectedApartment.bookingEnabled);
  const steps = requestOnly
    ? ['Dates', 'Residence', 'Your details', 'Review', 'Request', 'Payment']
    : ['Dates', 'Residence', 'Your details', 'Review', 'Payment'];
  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000)
    : 0;
  const guests = adults + children;
  const nightlyRate = selectedApartment?.startingPrice;
  const estimate = nightlyRate && nights > 0 ? nightlyRate.amount * nights : undefined;

  useEffect(() => {
    let active = true;
    fetchPublishedHouseRules()
      .then((rules) => {
        if (active) {
          setPublishedRules(rules);
          setRulesError('');
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setRulesError(cause instanceof Error ? cause.message : 'Published house rules could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  async function searchAvailability() {
    setRootError('');
    setSearchError('');
    const valid = await trigger(['checkIn', 'checkOut', 'adults', 'children']);
    if (!valid) return;

    setSearching(true);
    try {
      const apartmentsToCheck = initialApartmentSlug
        ? apartments.filter((apartment) => apartment.slug === initialApartmentSlug)
        : apartments;
      const [availabilityByRoom, amenities] = await Promise.all([
        Promise.all(apartmentsToCheck
          .map(async (apartment) => [apartment.slug, await fetchBookedRanges(apartment.slug)] as const)),
        fetchPublicAmenities(),
      ]);
      const rangesByRoom = new Map(availabilityByRoom);
      const results = apartmentsToCheck.map((apartment): SearchResult => {
        const roomAmenities = amenities.filter((item) => item.scope === 'room' && item.apartment_slug === apartment.slug);
        const ranges = rangesByRoom.get(apartment.slug) ?? [];
        const available = !overlapsBookedRange(checkIn, checkOut, ranges);
        if (!available) return { apartment, amenities: roomAmenities, available: false, requestOnly: !apartment.bookingEnabled, reason: 'Dates are already booked, held, or blocked' };
        if (!apartment.bookingEnabled) {
          return { apartment, amenities: roomAmenities, available: true, requestOnly: true };
        }
        if (apartment.minimumStay && nights < apartment.minimumStay) {
          return { apartment, amenities: roomAmenities, available: false, requestOnly: false, reason: `Minimum stay: ${apartment.minimumStay} nights` };
        }
        if (!apartment.startingPrice || apartment.startingPrice.amount <= 0 ||
          !['USD', 'EUR'].includes(apartment.startingPrice.currency)) {
          return { apartment, amenities: roomAmenities, available: false, requestOnly: false, reason: 'A valid nightly rate is not configured' };
        }
        if (!apartment.maxOccupancy) {
          return { apartment, amenities: roomAmenities, available: false, requestOnly: false, reason: 'Maximum occupancy must be configured by the property' };
        }
        if (guests > apartment.maxOccupancy) {
          return { apartment, amenities: roomAmenities, available: false, requestOnly: false, reason: `Maximum occupancy: ${apartment.maxOccupancy}` };
        }
        return { apartment, amenities: roomAmenities, available: true, requestOnly: false };
      });

      setSearchResults(results);
      setSharedAmenities(amenities.filter((amenity) => amenity.scope === 'shared'));
      setStep(2);
      if (initialApartmentSlug && results.some((result) => result.apartment.slug === initialApartmentSlug)) {
        setValue('apartmentSlug', initialApartmentSlug);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Availability could not be checked.');
    } finally {
      setSearching(false);
    }
  }

  async function continueToReview() {
    const valid = await trigger([
      'firstName',
      'lastName',
      'guestEmail',
      'guestPhone',
      'guestCountry',
      'estimatedArrivalTime',
      'notes',
    ]);
    if (!valid) return;
    clearErrors('root');
    setRootError('');
    setStep(4);
  }

  async function createHold() {
    if (!acceptedTerms) {
      setRootError('Please accept the terms, privacy and cancellation information before continuing.');
      return;
    }

    const valid = await trigger();
    if (!valid) {
      setRootError('Check the guest and stay details before continuing.');
      return;
    }

    setCreating(true);
    setRootError('');
    try {
      const values = bookingSchema.parse(watch());
      if (rulesError) {
        setRootError(`Published house rules could not be verified: ${rulesError}`);
        return;
      }
      const ruleVersions = publishedRules
        .map((rule) => ({ id: rule.id, revision: rule.revision }))
        .sort((left, right) => left.id.localeCompare(right.id));
      if (!selectedApartment) {
        setRootError('Choose a residence before continuing.');
        return;
      }
      if (!selectedApartment.bookingEnabled) {
        const requestResult = await createReservationRequest(values, acceptedTerms, ruleVersions);
        if (!requestResult.ok) {
          setRootError(requestResult.message);
          if (requestResult.reason === 'conflict') {
            setStep(1);
            setSearchResults([]);
          }
          return;
        }
        setSubmittedRequest(requestResult.request.request_reference);
        setStep(5);
        return;
      }
      const result = await createReservationHold(values, acceptedTerms, ruleVersions);
      if (!result.ok) {
        setRootError(result.message);
        if (result.reason === 'conflict') {
          setStep(1);
          setSearchResults([]);
        }
        return;
      }
      navigate(`/booking/checkout?token=${encodeURIComponent(result.reservation.checkout_token)}`);
    } catch (error) {
      setRootError(error instanceof Error ? error.message : 'Could not create the reservation hold.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="booking-form min-w-0 space-y-8" aria-label="Reservation">
      <ol aria-label="Reservation progress" className="grid grid-cols-5 border-y border-ink-100 py-4">
        {steps.map((label, index) => {
          const current = index + 1;
          const active = current === step;
          const complete = current < step;
          return (
            <li key={label} aria-current={active ? 'step' : undefined} className="flex flex-col items-center gap-2 text-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${complete || active ? 'bg-ink-900 text-paper' : 'bg-paper-warm text-ink-400'}`}>
                {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : current}
              </span>
              <span className={`text-[0.55rem] uppercase tracking-[0.08em] sm:text-[0.65rem] ${active ? 'font-medium text-ink-900' : 'text-ink-400'}`}>{label}</span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <section className="space-y-8" aria-labelledby="stay-search-title">
          <div>
            <p className="eyebrow">Step 1 of {steps.length}</p>
            <h2 id="stay-search-title" className="mt-2 font-serif text-3xl text-ink-900">
              {initialApartmentSlug
                ? `${apartments.find((room) => room.slug === initialApartmentSlug)?.bookingEnabled ? 'Book' : 'Request'} ${apartments.find((room) => room.slug === initialApartmentSlug)?.name ?? 'this room'}`
                : 'Search your stay'}
            </h2>
            <p className="mt-3 text-sm text-ink-500">
              {initialApartmentSlug
                ? `Choose dates and guest numbers for this room. We’ll check the website calendar before you ${requestOnly ? 'send a request' : 'continue with your booking'}.`
                : 'Choose dates and guest numbers. We check the live website calendar before showing available residences.'}
            </p>
          </div>
          <div>
            <p className={labelClass}>Check-in and check-out</p>
            <div className="mt-4 border border-ink-100 bg-paper p-4 sm:p-6">
              <DateRangeCalendar
                checkIn={checkIn}
                checkOut={checkOut}
                bookedRanges={[]}
                onChange={(nextCheckIn, nextCheckOut) => {
                  setValue('checkIn', nextCheckIn, { shouldDirty: true, shouldValidate: true });
                  setValue('checkOut', nextCheckOut, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>
            <input type="hidden" {...register('checkIn')} />
            <input type="hidden" {...register('checkOut')} />
            {(errors.checkIn?.message || errors.checkOut?.message) && (
              <p className="mt-2 text-sm text-[#D88A78]" role="alert">{errors.checkIn?.message ?? errors.checkOut?.message}</p>
            )}
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <Field id="adults" label="Adults" error={errors.adults?.message}>
              <input id="adults" type="number" min={1} max={MAX_GUESTS} inputMode="numeric" className={fieldClass} {...register('adults', { valueAsNumber: true })} />
            </Field>
            <Field id="children" label="Children" error={errors.children?.message}>
              <input id="children" type="number" min={0} max={MAX_GUESTS - 1} inputMode="numeric" className={fieldClass} {...register('children', { valueAsNumber: true })} />
            </Field>
          </div>
          <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-xs leading-relaxed text-ink-600">
            One residence per reservation. Airbnb and Booking.com calendars are not connected yet, so only this website’s bookings and active holds can be checked.
          </p>
          {searchError && <p className="text-sm text-rose-700" role="alert">Live availability check failed: {searchError}</p>}
          <button type="button" onClick={() => void searchAvailability()} disabled={searching} className="btn-gold inline-flex w-full items-center justify-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] disabled:opacity-60 sm:w-auto">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {searching ? 'Checking dates' : initialApartmentSlug ? 'Check dates for this room' : 'Search available residences'}
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-8" aria-labelledby="residence-results-title">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="eyebrow">Step 2 of {steps.length}</p>
              <h2 id="residence-results-title" className="mt-2 font-serif text-3xl text-ink-900">
                {initialApartmentSlug ? 'Your selected residence' : 'Choose your residence'}
              </h2>
              <p className="mt-3 text-sm text-ink-500">{formatIsoDate(checkIn)} – {formatIsoDate(checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'} · {guests} {guests === 1 ? 'guest' : 'guests'}</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="link-line shrink-0 text-sm text-ink-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Edit search</button>
          </div>
          {initialApartmentSlug && (
            <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-sm leading-relaxed text-ink-700">
              You selected this room. We’ll check the dates for this room only; you won’t be asked to choose another.
            </p>
          )}
          <div className="space-y-4">
            {searchResults.map(({ apartment, amenities, available, requestOnly: isRequestOnly, reason }) => (
              <article key={apartment.slug} className={`grid gap-5 border bg-paper p-4 sm:grid-cols-[150px_1fr_auto] sm:items-center ${available ? 'border-ink-100' : 'border-ink-100 opacity-75'}`}>
                <img src={apartment.photo.src} alt={apartment.photo.alt} className="h-36 w-full object-cover sm:h-28" />
                <div>
                  <h3 className="font-serif text-2xl text-ink-900">{apartment.name}</h3>
                  <p className="mt-2 text-sm text-ink-500">{apartment.summary}</p>
                  <p className="mt-2 text-xs text-ink-500">
                    {apartment.bedConfiguration ?? 'Bed details to be confirmed'}
                    {apartment.maxOccupancy ? ` · Up to ${apartment.maxOccupancy} guests` : ' · Guest capacity to be confirmed'}
                  </p>
                  {amenities.length > 0 && (
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {amenities.slice(0, 3).map((amenity) => (
                        <li key={amenity.id} className="border border-ink-100 p-2 text-xs text-ink-600">
                          {amenity.photo_path && <img src={amenity.photo_path} alt={amenity.photo_alt} className="mb-2 h-20 w-full object-cover" loading="lazy" />}
                          <p className="font-medium text-ink-800">{amenity.name}</p>
                          {amenity.description && <p className="mt-1 leading-relaxed">{amenity.description}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-sm font-medium text-ink-900">{priceLabel(apartment.startingPrice?.amount ?? 0, apartment.startingPrice?.currency ?? '')}<span className="font-normal text-ink-500"> / night</span></p>
                  {reason && <p className="mt-2 text-xs text-rose-700">{reason}</p>}
                  {isRequestOnly && available && (
                    <p className="mt-2 text-xs leading-relaxed text-ink-600">Request only: the property will verify availability, guest capacity, and room details before confirming. No dates are held and no payment is taken.</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    setValue('apartmentSlug', apartment.slug);
                    setRootError('');
                    setStep(3);
                  }}
                  className="btn-outline inline-flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {available ? isRequestOnly ? 'Request this room' : 'Choose room' : 'Unavailable'}
                  {available && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              </article>
            ))}
          </div>
          {sharedAmenities.length > 0 && (
            <section className="border-t border-ink-100 pt-6">
              <h3 className="font-serif text-xl text-ink-900">Verified shared facilities</h3>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {sharedAmenities.map((amenity) => (
                  <li key={amenity.id} className="flex gap-3 border border-ink-100 p-3">
                    {amenity.photo_path && <img src={amenity.photo_path} alt={amenity.photo_alt} className="h-16 w-20 object-cover" loading="lazy" />}
                    <div><p className="text-sm font-medium text-ink-900">{amenity.name}</p>{amenity.description && <p className="mt-1 text-xs text-ink-500">{amenity.description}</p>}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {searchResults.length === 0 && <p className="border border-ink-100 p-6 text-sm text-ink-500">No residences were returned. Please try another date range.</p>}
          {!initialApartmentSlug && <p className="text-xs leading-relaxed text-ink-400">Requests are not confirmed bookings. The property will verify availability and room details before confirming.</p>}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-8" aria-labelledby="guest-details-title">
          <div>
            <p className="eyebrow">Step 3 of {steps.length}</p>
            <h2 id="guest-details-title" className="mt-2 font-serif text-3xl text-ink-900">Your details</h2>
            <p className="mt-3 text-sm text-ink-500">
              {requestOnly
                ? 'Share your details so the property can check your request and contact you.'
                : 'We need these details to create and manage your reservation.'}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <Field id="firstName" label="First name" error={errors.firstName?.message}>
              <input id="firstName" autoComplete="given-name" className={fieldClass} {...register('firstName')} />
            </Field>
            <Field id="lastName" label="Last name" error={errors.lastName?.message}>
              <input id="lastName" autoComplete="family-name" className={fieldClass} {...register('lastName')} />
            </Field>
          </div>
          <Field id="guestEmail" label="Email address" error={errors.guestEmail?.message}>
            <input id="guestEmail" type="email" autoComplete="email" className={fieldClass} {...register('guestEmail')} />
          </Field>
          <div className="grid gap-8 sm:grid-cols-2">
            <Field id="guestPhone" label="Phone (include country code)" error={errors.guestPhone?.message}>
              <input id="guestPhone" type="tel" autoComplete="tel" placeholder="+250 ..." className={fieldClass} {...register('guestPhone')} />
            </Field>
            <Field id="guestCountry" label="Country of residence" error={errors.guestCountry?.message}>
              <input id="guestCountry" autoComplete="country-name" className={fieldClass} {...register('guestCountry')} />
            </Field>
          </div>
          <Field id="estimatedArrivalTime" label="Estimated arrival time (optional)" error={errors.estimatedArrivalTime?.message}>
            <input id="estimatedArrivalTime" type="time" className={fieldClass} {...register('estimatedArrivalTime')} />
          </Field>
          <Field id="notes" label="Special requests (optional)" error={errors.notes?.message}>
            <textarea id="notes" rows={4} className={`${fieldClass} resize-none`} {...register('notes')} />
          </Field>
          {rootError && <p className="text-sm text-rose-700" role="alert">{rootError}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(2)} className="btn-outline inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.12em]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
            <button type="button" onClick={() => void continueToReview()} className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.12em]">{requestOnly ? 'Review request' : 'Review reservation'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </section>
      )}

      {step === 4 && selectedApartment && (
        <section className="space-y-8" aria-labelledby="review-title">
          <div>
            <p className="eyebrow">Step 4 of {steps.length}</p>
            <h2 id="review-title" className="mt-2 font-serif text-3xl text-ink-900">{requestOnly ? 'Review your room request' : 'Review your reservation'}</h2>
            <p className="mt-3 text-sm text-ink-500">
              {requestOnly
                ? 'Check your details before sending this request. The room is not held or confirmed.'
                : 'Check the dates, guest details and estimated price before placing a temporary hold.'}
            </p>
          </div>
          <div className="border border-ink-100 bg-paper p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row">
              <img src={selectedApartment.photo.src} alt={selectedApartment.photo.alt} className="h-40 w-full object-cover sm:w-52" />
              <div>
                <h3 className="font-serif text-2xl text-ink-900">{selectedApartment.name}</h3>
                <p className="mt-3 text-sm text-ink-600">{formatIsoDate(checkIn)} – {formatIsoDate(checkOut)} ({nights} {nights === 1 ? 'night' : 'nights'})</p>
                <p className="mt-2 text-sm text-ink-600">{adults} {adults === 1 ? 'adult' : 'adults'}{children > 0 ? `, ${children} ${children === 1 ? 'child' : 'children'}` : ''}</p>
              </div>
            </div>
            <dl className="mt-6 grid gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
              <div><dt className="eyebrow">Guest</dt><dd className="mt-2 text-sm text-ink-900">{watch('firstName')} {watch('lastName')}</dd></div>
              <div><dt className="eyebrow">Email</dt><dd className="mt-2 break-all text-sm text-ink-900">{watch('guestEmail')}</dd></div>
              <div><dt className="eyebrow">Phone</dt><dd className="mt-2 text-sm text-ink-900">{watch('guestPhone')}</dd></div>
              <div><dt className="eyebrow">Country</dt><dd className="mt-2 text-sm text-ink-900">{watch('guestCountry')}</dd></div>
              {watch('estimatedArrivalTime') && <div><dt className="eyebrow">Estimated arrival</dt><dd className="mt-2 text-sm text-ink-900">{watch('estimatedArrivalTime')}</dd></div>}
            </dl>
            <div className="mt-6 border-t border-ink-100 pt-5">
              <div className="flex justify-between gap-4 text-sm text-ink-600">
                <span>{nights} nights × {priceLabel(nightlyRate?.amount ?? 0, nightlyRate?.currency ?? '')}</span>
                <span>{estimate !== undefined ? priceLabel(estimate, nightlyRate?.currency ?? '') : 'To be confirmed'}</span>
              </div>
              <div className="mt-4 flex justify-between gap-4 border-t border-ink-100 pt-4 font-medium text-ink-900">
                <span>{requestOnly ? 'Estimated stay total' : 'Estimated total'}</span>
                <span>{estimate !== undefined ? priceLabel(estimate, nightlyRate?.currency ?? '') : 'To be confirmed'}</span>
              </div>
              <p className="mt-3 text-xs text-ink-400">
                {requestOnly
                  ? 'This is an estimate only. The property will confirm the final price and availability. No payment is taken.'
                  : 'The database recalculates the total using the current residence rate. No taxes or additional fees are configured.'}
              </p>
            </div>
          </div>
          <div className="border border-ink-100 bg-paper p-5">
            <h3 className="font-serif text-xl text-ink-900">Published house rules</h3>
            {rulesError ? (
              <p className="mt-3 text-sm text-rose-700" role="alert">Rules could not be loaded: {rulesError}</p>
            ) : publishedRules.length ? (
              <ul className="mt-4 space-y-4">
                {publishedRules.map((rule) => (
                  <li key={rule.id} className="border-t border-ink-100 pt-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-gold-deep">{rule.category}</p>
                    <h4 className="mt-1 text-sm font-medium text-ink-900">{rule.title}</h4>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-600">{rule.details}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-500">The property has not published any verified house rules yet.</p>
            )}
          </div>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-600">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-[#B49A62]" />
            <span>
              I have reviewed the <a className="underline hover:text-gold" href="/terms" target="_blank" rel="noreferrer">terms</a> and <a className="underline hover:text-gold" href="/privacy" target="_blank" rel="noreferrer">privacy information</a>, and accept the verified house rules listed above.
              {requestOnly
                ? ' I understand this is a request only; my stay is not confirmed or held, and the property must verify the details and availability.'
                : ' I understand the draft cancellation policy must be confirmed by the property before payment.'}
            </span>
          </label>
          {rootError && <p className="text-sm text-rose-700" role="alert">{rootError}</p>}
          <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-xs leading-relaxed text-ink-600">
            {requestOnly
              ? 'Sending this request does not reserve the room or charge you. The property will contact you to confirm availability, capacity, details, and the final price.'
              : 'Continuing creates a database-backed 15-minute hold. It does not charge you or confirm the stay. The payment gateway is not configured; do not enter card details.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={creating} onClick={() => setStep(3)} className="btn-outline inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.12em]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
            <button type="button" disabled={creating} onClick={() => void createHold()} className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-60">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : requestOnly ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <Clock3 className="h-4 w-4" aria-hidden="true" />}
              {creating ? requestOnly ? 'Sending request' : 'Creating secure hold' : requestOnly ? 'Send booking request' : 'Continue to awaiting payment'}
            </button>
          </div>
        </section>
      )}
      {step === 5 && submittedRequest && selectedApartment && (
        <section className="space-y-6 border border-ink-100 bg-paper p-6 sm:p-8" aria-labelledby="request-sent-title">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-warm text-gold-deep">
            <Check className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Step 5 of 6 · Request received</p>
            <h2 id="request-sent-title" className="mt-2 font-serif text-3xl text-ink-900">Your request is with the property.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Your request for {selectedApartment.name} was sent to the property. This is not a confirmed booking and the dates are not held. The team will verify availability, capacity, room details, and the final price before contacting you.
            </p>
          </div>
          <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-sm text-ink-700">
            Request reference: <span className="font-semibold">{submittedRequest}</span>
          </p>
          <p className="text-sm text-ink-500">No payment has been taken. Continue to the payment step for information about what happens next.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(6)} className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]">
              Continue to payment <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link to={getApartmentPath(selectedApartment)} className="btn-outline px-5 py-3 text-xs uppercase tracking-[0.12em]">Back to {selectedApartment.name}</Link>
          </div>
        </section>
      )}
      {step === 6 && submittedRequest && selectedApartment && (
        <section className="space-y-6 border border-ink-100 bg-paper p-6 sm:p-8" aria-labelledby="request-payment-title">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-warm text-gold-deep">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Step 6 of 6 · Payment</p>
            <h2 id="request-payment-title" className="mt-2 font-serif text-3xl text-ink-900">Payment comes after confirmation.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Your request for {selectedApartment.name} is not yet a booking. The property must first confirm the room, guest capacity, dates, and final price. There is no payment due now, and no payment link has been created for this request.
            </p>
          </div>
          <div className="border-l-2 border-gold bg-paper-warm px-4 py-4">
            <p className="text-sm font-medium text-ink-900">Request reference: {submittedRequest}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              After the property confirms your stay, contact the team to arrange payment. Never send card numbers or security codes by email or through this form.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="border border-ink-100 p-4">
              <p className="text-sm font-medium text-ink-900">Card payment</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Available only after the property confirms your request. Card details will be entered on Flutterwave’s secure checkout, never on this website.
              </p>
            </article>
            <article className="border border-ink-100 p-4">
              <p className="text-sm font-medium text-ink-900">Bank transfer</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Bank transfer instructions are not available yet. The property will provide verified account details after confirming your request.
              </p>
            </article>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(5)} className="btn-outline inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to request
            </button>
            <Link to="/contact" className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]">
              Contact the property <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
