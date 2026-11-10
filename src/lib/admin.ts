import { z } from 'zod';

export const bookingStatuses = ['pending', 'awaiting_payment', 'confirmed', 'cancelled', 'expired', 'checked_in', 'checked_out'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export type StatusFilter = 'all' | BookingStatus;

export const paymentStatuses = ['not_required', 'not_initiated', 'awaiting_payment', 'processing', 'paid', 'failed', 'refunded', 'expired', 'paid_unassigned'] as const;

export const bookingRequestSchema = z.array(
  z.object({
    id: z.string(),
    booking_reference: z.string().nullable(),
    apartment_slug: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    guests: z.number(),
    adults: z.number(),
    children: z.number(),
    guest_name: z.string(),
    guest_email: z.string(),
    guest_phone: z.string(),
    guest_country: z.string().nullable(),
    estimated_arrival_time: z.string().nullable(),
    policies_accepted_at: z.string().nullable(),
    policy_version: z.string().nullable(),
    accepted_house_rule_ids: z.array(z.string()),
    accepted_house_rules: z.array(z.object({
      id: z.string(),
      category: z.string(),
      title: z.string(),
      details: z.string(),
      revision: z.number(),
    })),
    notes: z.string(),
    status: z.enum(bookingStatuses),
    payment_status: z.enum(paymentStatuses),
    payment_reference: z.string().nullable(),
    total_amount: z.coerce.number().nullable(),
    currency: z.enum(['USD', 'EUR']).nullable(),
    payment_transaction_id: z.string().nullable(),
    payment_verified_at: z.string().nullable(),
    hold_expires_at: z.string().nullable(),
    created_at: z.string(),
  }),
);

export type BookingRequest = z.infer<typeof bookingRequestSchema>[number];

export function formatAdminDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
