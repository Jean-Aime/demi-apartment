import { z } from 'zod';
import { apartments } from '@/data/apartments';
import { supabase } from '@/lib/supabase';

export const MAX_GUESTS = 20;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date');

export const bookingSchema = z
  .object({
    apartmentSlug: z
      .string()
      .refine((slug) => apartments.some((apartment) => apartment.slug === slug), 'Choose a residence'),
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

export async function fetchBookedRanges(apartmentSlug: string): Promise<BookedRange[] | null> {
  const { data, error } = await supabase.rpc('get_booked_dates', { p_apartment_slug: apartmentSlug });
  if (error) return null;

  const parsed = bookedDatesResponse.safeParse(data);
  if (!parsed.success) return null;

  return parsed.data.map((row) => ({ checkIn: row.check_in, checkOut: row.check_out }));
}

export type CreateBookingResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'conflict' | 'failed' };

export interface BookingConfirmation {
  reference: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestEmail: string;
}

const EXCLUSION_VIOLATION = '23P01';

export async function createBookingRequest(data: BookingData): Promise<CreateBookingResult> {
  const id = crypto.randomUUID();

  const { error } = await supabase.from('booking_requests').insert({
    id,
    status: 'pending',
    apartment_slug: data.apartmentSlug,
    check_in: data.checkIn,
    check_out: data.checkOut,
    guests: data.guests,
    guest_name: data.guestName,
    guest_email: data.guestEmail,
    guest_phone: data.guestPhone,
    notes: data.notes,
  });

  if (error) {
    return { ok: false, reason: error.code === EXCLUSION_VIOLATION ? 'conflict' : 'failed' };
  }

  return { ok: true, id };
}
