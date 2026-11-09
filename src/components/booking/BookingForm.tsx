import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApartments } from '@/hooks/useApartments';
import DateRangeCalendar from '@/components/booking/DateRangeCalendar';
import {
  MAX_GUESTS,
  bookingSchema,
  createBookingRequest,
  fetchBookedRanges,
  formatIsoDate,
  overlapsBookedRange,
  type BookedRange,
  type BookingData,
  type BookingInput,
} from '@/lib/bookings';

type Availability =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; ranges: BookedRange[] }
  | { status: 'error' };

const fieldClass =
  'mt-3 w-full min-w-0 border-0 border-b border-ink-100 bg-transparent px-0 py-3 font-sans text-base text-ink-900 placeholder:text-ink-300 transition-colors duration-500 focus:border-gold focus:outline-none aria-[invalid=true]:border-[#C75D4A]';

const labelClass = 'block text-xs font-medium uppercase tracking-[0.2em] text-ink-500';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#D88A78]">
          {error}
        </p>
      )}
    </div>
  );
}

function AvailabilityNote({ availability }: { availability: Availability }) {
  if (availability.status === 'idle') return null;
  if (availability.status === 'loading') {
    return <p className="text-sm text-ink-500">Checking availability for this residence...</p>;
  }
  if (availability.status === 'error') {
    return (
      <p className="text-sm text-ink-500">
        Live availability could not be loaded. The team will check your dates before confirming.
      </p>
    );
  }
  if (availability.ranges.length === 0) {
    return <p className="text-sm text-ink-500">No confirmed stays are currently booked for this residence.</p>;
  }
  return (
    <div>
      <p className="text-sm text-ink-500">Confirmed stays already booked:</p>
      <ul className="mt-3 space-y-2 text-sm text-ink-700">
        {availability.ranges.map((range) => (
          <li key={`${range.checkIn}-${range.checkOut}`}>
            {formatIsoDate(range.checkIn)} to {formatIsoDate(range.checkOut)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BookingForm({ initialApartmentSlug }: { initialApartmentSlug?: string }) {
  const navigate = useNavigate();
  const { apartments } = useApartments();
  const [availability, setAvailability] = useState<Availability>({ status: 'idle' });

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput, unknown, BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      apartmentSlug: initialApartmentSlug ?? '',
      checkIn: '',
      checkOut: '',
      guests: 2,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      notes: '',
    },
  });

  const apartmentSlug = watch('apartmentSlug');
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');

  useEffect(() => {
    if (initialApartmentSlug && apartments.some((apartment) => apartment.slug === initialApartmentSlug)) {
      setValue('apartmentSlug', initialApartmentSlug);
    }
  }, [apartments, initialApartmentSlug, setValue]);

  useEffect(() => {
    if (!apartmentSlug) {
      setAvailability({ status: 'idle' });
      return;
    }
    let active = true;
    setAvailability({ status: 'loading' });
    fetchBookedRanges(apartmentSlug).then((ranges) => {
      if (!active) return;
      setAvailability(ranges ? { status: 'ready', ranges } : { status: 'error' });
    });
    return () => {
      active = false;
    };
  }, [apartmentSlug]);

  const onSubmit = async (values: BookingData) => {
    if (availability.status === 'ready' && overlapsBookedRange(values.checkIn, values.checkOut, availability.ranges)) {
      setError('checkIn', { message: 'These dates overlap a confirmed stay. Please choose different dates.' });
      return;
    }

    const result = await createBookingRequest(values);
    if (!result.ok) {
      setError('root', {
        message:
          result.reason === 'conflict'
            ? 'These nights have just been confirmed for another guest. Please choose different dates.'
            : result.reason === 'unavailable'
              ? 'Booking requests are temporarily unavailable because the booking service is not configured. Please contact the team.'
              : 'We could not send your request. Please check your connection and try again.',
      });
      return;
    }

    navigate('/booking/confirmation', {
      state: {
        reference: result.id.slice(0, 8).toUpperCase(),
        apartmentName: apartments.find((apartment) => apartment.slug === values.apartmentSlug)?.name ?? values.apartmentSlug,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: values.guests,
        guestEmail: values.guestEmail,
      },
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-14" aria-label="Booking request">
      <fieldset className="space-y-10">
        <legend className="eyebrow mb-10">Your stay</legend>

        <Field id="apartmentSlug" label="Residence" error={errors.apartmentSlug?.message}>
          <select
            id="apartmentSlug"
            aria-invalid={Boolean(errors.apartmentSlug)}
            aria-describedby={errors.apartmentSlug ? 'apartmentSlug-error' : undefined}
            className={`${fieldClass} cursor-pointer`}
            {...register('apartmentSlug')}
          >
            <option value="">Choose a residence</option>
            {apartments.map((apartment) => (
              <option key={apartment.slug} value={apartment.slug}>
                {apartment.name}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className={labelClass}>Stay dates</p>
          <div className="mt-4 border border-ink-100 bg-paper p-4 sm:p-6">
            <DateRangeCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              bookedRanges={availability.status === 'ready' ? availability.ranges : []}
              onChange={(nextCheckIn, nextCheckOut) => {
                setValue('checkIn', nextCheckIn, { shouldDirty: true, shouldValidate: true });
                setValue('checkOut', nextCheckOut, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </div>
          <input type="hidden" {...register('checkIn')} />
          <input type="hidden" {...register('checkOut')} />
          {(errors.checkIn?.message || errors.checkOut?.message) && (
            <p className="mt-2 text-sm text-[#D88A78]" role="alert">
              {errors.checkIn?.message ?? errors.checkOut?.message}
            </p>
          )}
        </div>

        <AvailabilityNote availability={availability} />
        <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-xs leading-relaxed text-ink-600">
          The calendar reflects website records only. Airbnb and Booking.com availability will be synchronized after the Beds24 connection is configured. Sending this form is a request, not a confirmed reservation.
        </p>

        <Field id="guests" label="Guests" error={errors.guests?.message}>
          <input
            id="guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_GUESTS}
            aria-invalid={Boolean(errors.guests)}
            aria-describedby={errors.guests ? 'guests-error' : undefined}
            className={fieldClass}
            {...register('guests', { valueAsNumber: true })}
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-10">
        <legend className="eyebrow mb-10">Your details</legend>

        <div className="grid gap-10 sm:grid-cols-2">
          <Field id="guestName" label="Full name" error={errors.guestName?.message}>
            <input
              id="guestName"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.guestName)}
              aria-describedby={errors.guestName ? 'guestName-error' : undefined}
              className={fieldClass}
              {...register('guestName')}
            />
          </Field>
          <Field id="guestEmail" label="Email" error={errors.guestEmail?.message}>
            <input
              id="guestEmail"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.guestEmail)}
              aria-describedby={errors.guestEmail ? 'guestEmail-error' : undefined}
              className={fieldClass}
              {...register('guestEmail')}
            />
          </Field>
        </div>

        <Field id="guestPhone" label="Phone" error={errors.guestPhone?.message}>
          <input
            id="guestPhone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.guestPhone)}
            aria-describedby={errors.guestPhone ? 'guestPhone-error' : undefined}
            className={fieldClass}
            {...register('guestPhone')}
          />
        </Field>

        <Field id="notes" label="Notes (optional)" error={errors.notes?.message}>
          <textarea
            id="notes"
            rows={4}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? 'notes-error' : undefined}
            className={`${fieldClass} resize-none`}
            {...register('notes')}
          />
        </Field>
      </fieldset>

      {errors.root?.message && (
        <p role="alert" className="border-l-2 border-[#C75D4A] bg-paper-warm px-5 py-4 text-sm text-ink-800">
          {errors.root.message}
        </p>
      )}

      <div className="space-y-5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gold group inline-flex w-full items-center justify-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Sending your request' : 'Send booking request'}
        </button>
        <p className="max-w-lg text-sm leading-[1.5] text-ink-500">
          Sending this form creates a pending request. Your stay is confirmed only after the team has reviewed and
          accepted it.
        </p>
      </div>
    </form>
  );
}
