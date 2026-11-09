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
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project settings (Project Settings, API). The legacy `VITE_SUPABASE_ANON_KEY` is also supported. Never put a service-role key or database connection string in client-side environment variables.
3. Start the local site: `npm run dev`

## Supabase database

The schema lives in migrations applied to your Supabase project. The current migrations are:

1. `create_booking_requests`: the `booking_requests` table, row level security, and an anonymous insert policy that only accepts `pending` requests.
2. `prevent_overlapping_confirmed_bookings`: an exclusion constraint that stops two confirmed or checked-in stays from overlapping at the same residence, and the `get_booked_dates` function, which returns booked date ranges only (no guest details).
3. `admin_booking_access`: allows authenticated staff with the `admin` Supabase Auth app metadata role to read booking requests and update their status.
4. `property_management`: creates managed residence and property contact tables, seeds the current nine residences, and enables admin-only editing with public reads for published listings.

Apply them with the Supabase CLI (`supabase db push`) or by running each SQL file in the Supabase SQL editor, in order. All migrations are idempotent.

Public visitors can create pending requests and read booked date ranges. They cannot read guest details, and they cannot change or confirm a booking.

## Admin dashboard

The admin workspace is available at `/admin` with sections for overview, bookings, apartments, calendar, guests, reports, and property settings. Apply all migrations, create a unique staff account in Supabase Dashboard → Authentication → Users, then set that user's **app metadata** to include `"role": "admin"` (for example, in the Supabase dashboard under the user's app metadata). Use a strong, unique password stored in a password manager; do not use shared/default credentials. The role must be assigned by a trusted administrator; do not use user metadata or expose a service-role key in the client. After changing app metadata, refresh the session by signing out and in again. If the panel says the account is not an administrator, verify the displayed user ID and project, and confirm the role is under **App Metadata**, not **User Metadata**. Room and contact edits in the admin panel are stored in Supabase and are used by public apartment/contact pages. Confirmations that overlap another confirmed stay are rejected by the database.

## Booking setup and channel management

Beds24 is the selected property-management and channel-management platform for the nine residences. Its published channel-manager information describes two-way connections with Airbnb and Booking.com, plus a direct booking engine. Set up and verify the property, room inventory, rates and restrictions in Beds24 before taking direct online bookings.

The website can embed the property's Beds24 booking engine by setting `VITE_BEDS24_BOOKING_URL` to the secure booking URL from the Beds24 account. The embed is restricted to HTTPS Beds24 domains. This is the preferred direct-booking calendar because Beds24 can supply current availability and bookings from the same inventory connected to the OTAs.

Until that property-specific URL is configured, the site falls back to its request-only form. That calendar reads only confirmed stays stored in this site's Supabase database; it is not synchronized with Beds24, Airbnb or Booking.com and must not be presented as live channel availability. Configure the Beds24 account and connect the individual rooms and channels before taking direct online bookings.

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

- Beds24 account configuration, property/room mapping, booking-engine URL, and channel activation. No live Airbnb or Booking.com connection or data import is implemented by this repository.

## Scripts

- `npm run dev`: local development server
- `npm run typecheck`: TypeScript checks
- `npm run lint`: linting
- `npm run build`: production build in `dist/`
