import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const MAX_GUESTS = 20;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date');

export const bookingSchema = z
  .object({
    apartmentSlug: z.string().min(1, 'Choose a residence').max(100, 'Choose a valid residence'),
    checkIn: isoDate,
    checkOut: isoDate,
    adults: z.number().int('Enter a whole number').min(1, 'At least one adult is required').max(MAX_GUESTS),
    children: z.number().int('Enter a whole number').min(0).max(MAX_GUESTS - 1),
    firstName: z.string().trim().min(1, 'Enter your first name').max(60),
    lastName: z.string().trim().min(1, 'Enter your last name').max(60),
    guestEmail: z.email('Enter a valid email address').max(254),
    guestPhone: z.string().trim().regex(/^\+?[0-9\s()-]{7,40}$/, 'Enter an international phone number'),
    guestCountry: z.string().trim().min(2, 'Choose your country').max(80),
    estimatedArrivalTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid arrival time'),
    notes: z.string().trim().max(2000, 'Notes must be under 2000 characters').default(''),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    path: ['checkOut'],
    message: 'Check-out must be after check-in',
  })
  .refine((data) => data.checkIn >= toIsoDate(new Date()), {
    path: ['checkIn'],
    message: 'Check-in cannot be in the past',
  })
  .refine((data) => data.adults + data.children <= MAX_GUESTS, {
    path: ['children'],
    message: `Up to ${MAX_GUESTS} guests can be requested online`,
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

const reservationHoldSchema = z.object({
  booking_id: z.uuid(),
  booking_reference: z.string(),
  checkout_token: z.uuid(),
  apartment_slug: z.string(),
  apartment_name: z.string(),
  photo_src: z.string(),
  check_in: isoDate,
  check_out: isoDate,
  adults: z.number(),
  children: z.number(),
  guests: z.number(),
  nightly_rate: z.number(),
  total_amount: z.number(),
  currency: z.enum(['USD', 'EUR']),
  hold_expires_at: z.string(),
  status: z.literal('awaiting_payment'),
  payment_status: z.literal('awaiting_payment'),
});

export type ReservationHold = z.infer<typeof reservationHoldSchema>;

export type CreateReservationResult =
  | { ok: true; reservation: ReservationHold }
  | { ok: false; reason: 'conflict' | 'rate_limit' | 'invalid' | 'failed' | 'unavailable'; message: string };

export async function createReservationHold(
  data: BookingData,
  policiesAccepted: boolean,
  acceptedHouseRules: { id: string; revision: number }[],
): Promise<CreateReservationResult> {
  if (!supabase) {
    return { ok: false, reason: 'unavailable', message: 'The reservation service is not configured.' };
  }

  const { data: result, error } = await supabase.rpc('create_reservation_hold', {
    p_apartment_slug: data.apartmentSlug,
    p_check_in: data.checkIn,
    p_check_out: data.checkOut,
    p_adults: data.adults,
    p_children: data.children,
    p_guest_first_name: data.firstName,
    p_guest_last_name: data.lastName,
    p_guest_email: data.guestEmail,
    p_guest_phone: data.guestPhone,
    p_guest_country: data.guestCountry,
    p_policies_accepted: policiesAccepted,
    p_accepted_house_rule_ids: acceptedHouseRules.map((rule) => rule.id),
    p_accepted_house_rule_revisions: acceptedHouseRules.map((rule) => rule.revision),
    p_special_requests: data.notes,
    p_estimated_arrival_time: data.estimatedArrivalTime || null,
  });

  if (error) {
    if (error.code === '23P01') {
      return {
        ok: false,
        reason: 'conflict',
        message: 'These dates have just been reserved by another guest. Please search again.',
      };
    }
    if (error.message.includes('Too many reservation attempts')) {
      return { ok: false, reason: 'rate_limit', message: error.message };
    }
    if (error.code === '22023') {
      return { ok: false, reason: 'invalid', message: error.message };
    }
    return {
      ok: false,
      reason: 'failed',
      message: `The reservation could not be created: ${error.message}`,
    };
  }

  const parsed = reservationHoldSchema.array().safeParse(result);
  if (!parsed.success || parsed.data.length !== 1) {
    return {
      ok: false,
      reason: 'failed',
      message: 'The reservation service returned an unexpected response. Please contact the property team.',
    };
  }

  return { ok: true, reservation: parsed.data[0] };
}

const reservationRequestSchema = z.object({
  request_reference: z.string(),
  apartment_name: z.string(),
  check_in: isoDate,
  check_out: isoDate,
  guests: z.number(),
  estimated_total: z.number().nullable(),
  currency: z.enum(['USD', 'EUR']).nullable(),
});

export type ReservationRequest = z.infer<typeof reservationRequestSchema>;

export async function createReservationRequest(
  data: BookingData,
  policiesAccepted: boolean,
  acceptedHouseRules: { id: string; revision: number }[],
): Promise<{ ok: true; request: ReservationRequest } | { ok: false; reason: 'conflict' | 'rate_limit' | 'failed'; message: string }> {
  if (!supabase) {
    return { ok: false, reason: 'failed', message: 'The reservation service is not configured.' };
  }

  const { data: result, error } = await supabase.rpc('create_reservation_request', {
    p_apartment_slug: data.apartmentSlug,
    p_check_in: data.checkIn,
    p_check_out: data.checkOut,
    p_adults: data.adults,
    p_children: data.children,
    p_guest_first_name: data.firstName,
    p_guest_last_name: data.lastName,
    p_guest_email: data.guestEmail,
    p_guest_phone: data.guestPhone,
    p_guest_country: data.guestCountry,
    p_policies_accepted: policiesAccepted,
    p_accepted_house_rule_ids: acceptedHouseRules.map((rule) => rule.id),
    p_accepted_house_rule_revisions: acceptedHouseRules.map((rule) => rule.revision),
    p_special_requests: data.notes,
    p_estimated_arrival_time: data.estimatedArrivalTime || null,
  });

  if (error) {
    if (error.code === '23P01') {
      return { ok: false, reason: 'conflict', message: 'These dates have just become unavailable. Please choose different dates or contact the property.' };
    }
    if (error.message.includes('Too many reservation attempts')) {
      return { ok: false, reason: 'rate_limit', message: error.message };
    }
    return { ok: false, reason: 'failed', message: `Your request could not be sent: ${error.message}` };
  }

  const parsed = reservationRequestSchema.array().safeParse(result);
  if (!parsed.success || parsed.data.length !== 1) {
    return { ok: false, reason: 'failed', message: 'The request service returned an unexpected response. Please contact the property team.' };
  }
  return { ok: true, request: parsed.data[0] };
}

const checkoutSchema = z.object({
  booking_reference: z.string(),
  apartment_slug: z.string(),
  apartment_name: z.string(),
  photo_src: z.string(),
  check_in: isoDate,
  check_out: isoDate,
  adults: z.number(),
  children: z.number(),
  guests: z.number(),
  guest_email: z.email(),
  nightly_rate: z.number().nullable(),
  total_amount: z.number().nullable(),
  currency: z.enum(['USD', 'EUR']).nullable(),
  reservation_status: z.enum(['awaiting_payment', 'confirmed', 'cancelled', 'expired', 'checked_in', 'checked_out', 'pending']),
  payment_status: z.string(),
  hold_expires_at: z.string().nullable(),
});

export type ReservationCheckout = z.infer<typeof checkoutSchema>;

export async function fetchReservationCheckout(token: string): Promise<ReservationCheckout | null> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const parsedToken = z.uuid().safeParse(token);
  if (!parsedToken.success) throw new Error('This reservation link is invalid.');

  const { data, error } = await supabase.rpc('get_reservation_checkout', {
    p_checkout_token: parsedToken.data,
  });
  if (error) throw new Error(`Could not load this reservation: ${error.message}`);

  const parsed = checkoutSchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Reservation details returned an unexpected format.');
  return parsed.data[0] ?? null;
}

const checkoutStartSchema = z.object({ checkoutUrl: z.url() });
const paymentVerificationSchema = z.object({
  state: z.enum(['confirmed', 'paid_unassigned', 'pending', 'failed', 'expired', 'invalid']),
});

async function edgeFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  if (error.context instanceof Response) {
    try {
      const payload: unknown = await error.context.clone().json();
      if (payload && typeof payload === 'object') {
        const message = (payload as Record<string, unknown>).error;
        if (typeof message === 'string') return message;
      }
    } catch {
      return error.message;
    }
  }
  return error.message;
}

export async function startSecureCheckout(checkoutToken: string): Promise<string> {
  if (!supabase) throw new Error('The secure reservation service is not configured.');
  const parsedToken = z.uuid().safeParse(checkoutToken);
  if (!parsedToken.success) throw new Error('This reservation link is invalid.');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { checkoutToken: parsedToken.data },
  });
  if (error) throw new Error(await edgeFunctionErrorMessage(error));

  const parsed = checkoutStartSchema.safeParse(data);
  if (!parsed.success) throw new Error('The secure checkout service returned an invalid response.');
  const url = new URL(parsed.data.checkoutUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.flutterwave.com') {
    throw new Error('The payment service returned an untrusted checkout link.');
  }
  return url.toString();
}

export async function verifySecurePayment(txRef: string, transactionId: string): Promise<string> {
  if (!supabase) throw new Error('The secure reservation service is not configured.');
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { tx_ref: txRef, transaction_id: transactionId },
  });
  if (error) throw new Error(await edgeFunctionErrorMessage(error));

  const parsed = paymentVerificationSchema.safeParse(data);
  if (!parsed.success) throw new Error('The payment verification service returned an invalid response.');
  return parsed.data.state;
}
