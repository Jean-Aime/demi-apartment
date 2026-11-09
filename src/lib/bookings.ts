import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const MAX_GUESTS = 20;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date');

export const bookingSchema = z
  .object({
    apartmentSlug: z.string().min(1, 'Choose a residence').max(100, 'Choose a valid residence'),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z
      .number('Enter the number of guests')
      .int('Enter a whole number of guests')
      .min(1, 'At least one guest is required')
      .max(MAX_GUESTS, `Up to ${MAX_GUESTS} guests can be requested online`),
    guestName: z.string().trim().min(1, 'Enter your full name').max(120, 'Keep your name under 120 characters'),
    guestEmail: z.email('Enter a valid email address').max(254, 'Email address is too long'),
    guestPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s()-]{4,40}$/, 'Enter a valid phone number'),
    notes: z.string().trim().max(2000, 'Notes must be under 2000 characters').default(''),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    path: ['checkOut'],
    message: 'Check-out must be after check-in',
  })
  .refine((data) => data.checkIn >= toIsoDate(new Date()), {
    path: ['checkIn'],
    message: 'Check-in cannot be in the past',
  });

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingData = z.output<typeof bookingSchema>;

export interface BookedRange {
  checkIn: string;
  checkOut: string;
}

const bookedDatesResponse = z.array(z.object({ check_in: isoDate, check_out: isoDate }));

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatIsoDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function overlapsBookedRange(checkIn: string, checkOut: string, ranges: BookedRange[]): boolean {
  return ranges.some((range) => checkIn < range.checkOut && range.checkIn < checkOut);
}

export async function fetchBookedRanges(apartmentSlug: string): Promise<BookedRange[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.rpc('get_booked_dates', { p_apartment_slug: apartmentSlug });
  if (error) throw new Error(error.message);

  const parsed = bookedDatesResponse.safeParse(data);
  if (!parsed.success) throw new Error('Availability data returned an unexpected format.');

  return parsed.data.map((row) => ({ checkIn: row.check_in, checkOut: row.check_out }));
}

export interface BookingCheckout {
  checkoutUrl: string;
  reference: string;
  amount: number;
  currency: 'USD' | 'EUR';
  apartmentName: string;
  holdExpiresAt: string;
}

export type CreateBookingResult =
  | { ok: true; checkout: BookingCheckout }
  | { ok: false; reason: 'conflict' | 'failed' | 'unavailable'; message?: string };

export interface BookingConfirmation {
  reference: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestEmail: string;
}

export async function createBookingCheckout(data: BookingData): Promise<CreateBookingResult> {
  if (!supabase) return { ok: false, reason: 'unavailable' };

  const { data: result, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      apartmentSlug: data.apartmentSlug,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      notes: data.notes,
    },
  });

  if (error) {
    const response = error.context instanceof Response ? error.context : undefined;
    if (response?.status === 404) {
      return {
        ok: false,
        reason: 'failed',
        message: 'Secure checkout is not deployed to this Supabase project yet. Deploy the create-checkout Edge Function, then try again.',
      };
    }

    if (response?.status === 409) {
      return {
        ok: false,
        reason: 'conflict',
        message: 'These dates have just been reserved by another guest. Please choose different dates.',
      };
    }

    if (response) {
      let payload: unknown;
      try {
        payload = await response.clone().json();
      } catch {
        payload = undefined;
      }
      const errorMessage =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : undefined;
      return {
        ok: false,
        reason: 'failed',
        message: errorMessage ?? `Secure checkout service returned HTTP ${response.status}. Please try again or contact the property team.`,
      };
    }

    return {
      ok: false,
      reason: 'failed',
      message: 'Could not connect to the secure checkout service. Check your internet connection and confirm the Supabase Edge Function is deployed.',
    };
  }

  const parsed = z.object({
    checkoutUrl: z.url(),
    reference: z.string(),
    amount: z.number().positive(),
    currency: z.enum(['USD', 'EUR']),
    apartmentName: z.string(),
    holdExpiresAt: z.string(),
  }).safeParse(result);

  if (!parsed.success) {
    return {
      ok: false,
      reason: 'failed',
      message: 'Secure checkout returned an unexpected response. Please contact the property team.',
    };
  }

  const url = new URL(parsed.data.checkoutUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.flutterwave.com') {
    return {
      ok: false,
      reason: 'failed',
      message: 'Secure checkout returned an untrusted payment link. Please contact the property team.',
    };
  }
  return { ok: true, checkout: parsed.data };
}
