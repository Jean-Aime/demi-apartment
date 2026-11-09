import { z } from 'zod';

export const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export type StatusFilter = 'all' | BookingStatus;

export const bookingRequestSchema = z.array(
  z.object({
    id: z.string(),
    apartment_slug: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    guests: z.number(),
    guest_name: z.string(),
    guest_email: z.string(),
    guest_phone: z.string(),
    notes: z.string(),
    status: z.enum(bookingStatuses),
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
