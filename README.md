# DEMI APARTMENT

Website for DEMI APARTMENT, nine luxury serviced residences in Kimironko, Kigali, Rwanda.

## Stack

- React 18, TypeScript, Vite
- Tailwind CSS with the DEMI gold palette
- React Router for pages
- React Hook Form and Zod for the booking form
- Supabase (PostgreSQL) for booking requests

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings (Project Settings, API).
3. Start the local site: `npm run dev`

## Supabase database

The schema lives in migrations applied to your Supabase project. The current migrations are:

1. `create_booking_requests`: the `booking_requests` table, row level security, and an anonymous insert policy that only accepts `pending` requests.
2. `prevent_overlapping_confirmed_bookings`: an exclusion constraint that stops two confirmed or checked-in stays from overlapping at the same residence, and the `get_booked_dates` function, which returns booked date ranges only (no guest details).
3. `admin_booking_access`: allows authenticated staff with the `admin` Supabase Auth app metadata role to read booking requests and update their status.

Apply them with the Supabase CLI (`supabase db push`) or by running each SQL file in the Supabase SQL editor, in order. All migrations are idempotent.

Public visitors can create pending requests and read booked date ranges. They cannot read guest details, and they cannot change or confirm a booking.

## Admin dashboard

The booking dashboard is available at `/admin`. Apply all migrations, create the staff account in Supabase Auth, then set that user's **app metadata** to include `"role": "admin"` (for example, in the Supabase dashboard under the user's app metadata). The role must be assigned by a trusted administrator; do not use user metadata or expose a service-role key in the client. After the user's next sign-in, they can review guest and room details, then manage all booking statuses from the dashboard. Confirmations that overlap another confirmed stay are rejected by the database.

## Booking flow

1. A guest selects a residence, dates and guests, then submits their details.
2. The form validates every field before sending anything.
3. The request is saved as `pending`. The guest sees the confirmation page only after the save succeeds.
4. A stay becomes confirmed when its status is changed to `confirmed` in the database. The database rejects a second confirmation that overlaps an existing confirmed or checked-in stay.

Statuses: `pending`, `confirmed`, `cancelled`, `checked_in`, `checked_out`.

## Placeholder content

Content that must be replaced before launch is marked as placeholder:

- `src/data/site.ts`: contact email, telephone, address and social links (empty until confirmed). Verified reviews are empty by design.
- `src/data/apartments.ts`: the nine room names, descriptions, room-specific photo galleries, bed configurations, bedroom and bathroom counts, occupancy, sizes, check-in/check-out times, nightly rates, minimum stays, amenities and house rules. Update these source records with owner-confirmed details; unknown values show "To be confirmed". Guests can open each numbered room from `/apartments`; the general gallery page redirects there.
- `src/data/policies.ts`: policy wording. Bracketed values such as `[retention period]` must be completed by the property.
- `src/data/media.ts`: demonstration photography from Pexels. Replace each room's images with owner-approved photographs of that specific room.

## Not yet built

- Channel manager and booking platform adapters (Airbnb, Booking.com). No live connection or data import is implemented.

## Scripts

- `npm run dev`: local development server
- `npm run typecheck`: TypeScript checks
- `npm run lint`: linting
- `npm run build`: production build in `dist/`
