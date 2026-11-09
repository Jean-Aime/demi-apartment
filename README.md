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

1. `create_booking_requests`: the `booking_requests` table, row level security, and the original pending-request policy.
2. `prevent_overlapping_confirmed_bookings`: an exclusion constraint that stops two confirmed or checked-in stays from overlapping at the same residence, and the `get_booked_dates` function, which returns booked date ranges only (no guest details).
3. `admin_booking_access`: allows authenticated staff with the `admin` Supabase Auth app metadata role to read booking requests and update their status.
4. `property_management`: creates managed residence and property contact tables, seeds the current nine residences, and enables admin-only editing with public reads for published listings.
5. `paid_booking_checkout`: adds temporary payment holds, USD/EUR rate validation, verified payment metadata, and the database functions that atomically reserve dates and confirm verified payments.
6. `set_initial_room_rates`: applies USD 35/night to the nine seeded residences, as requested.

Apply them with the Supabase CLI (`supabase db push`) or by running each SQL file in the Supabase SQL editor, in order. All migrations are idempotent.

Public visitors can read booked date ranges and start checkout through the Edge Functions. They cannot read guest details, insert or change bookings, or confirm a stay.

## Admin dashboard

The admin workspace is available at `/admin` with sections for overview, bookings, apartments, calendar, guests, reports, and property settings. Apply all migrations, create a unique staff account in Supabase Dashboard → Authentication → Users, then set that user's **app metadata** to include `"role": "admin"` (for example, in the Supabase dashboard under the user's app metadata). Use a strong, unique password stored in a password manager; do not use shared/default credentials. The role must be assigned by a trusted administrator; do not use user metadata or expose a service-role key in the client. After changing app metadata, refresh the session by signing out and in again. If the panel says the account is not an administrator, verify the displayed user ID and project, and confirm the role is under **App Metadata**, not **User Metadata**. Room and contact edits in the admin panel are stored in Supabase and are used by public apartment/contact pages. Confirmations that overlap another confirmed stay are rejected by the database.

## Booking setup and channel management

Beds24 is the selected property-management and channel-management platform for the nine residences. Its published channel-manager information describes two-way connections with Airbnb and Booking.com, plus a direct booking engine. Set up and verify the property, room inventory, rates and restrictions in Beds24 before taking direct online bookings.

The website can embed the property's Beds24 booking engine by setting `VITE_BEDS24_BOOKING_URL` to the secure booking URL from the Beds24 account. The embed is restricted to HTTPS Beds24 domains. This is the preferred direct-booking calendar because Beds24 can supply current availability and bookings from the same inventory connected to the OTAs.

When a Beds24 booking URL is configured, the booking page embeds Beds24 and does not display the Supabase/Flutterwave form. Otherwise, guests can use the site's direct checkout after prices are configured. The direct calendar reads confirmed stays and active payment holds stored in Supabase; it is not synchronized with Beds24, Airbnb or Booking.com. Do not accept direct website bookings until the Beds24 room/channel inventory is connected and its availability is kept in sync, or there is a risk of double bookings.

## Booking flow

1. A guest selects a residence, dates and guests, then submits their details.
2. The server validates the stay, applies the residence's current nightly rate and creates a 15-minute atomic hold. Overlapping holds/bookings cannot be created for the same residence.
3. Flutterwave hosts checkout. The browser redirect alone never confirms a stay; the server verifies the transaction reference, successful status, exact amount and currency with Flutterwave.
4. A booking is confirmed only after the verification function records the payment. Expired holds are released when another checkout starts. If a valid payment arrives after its hold has expired, the booking is left unconfirmed and flagged `paid_unassigned` for staff resolution.

Statuses: `pending` (legacy requests), `awaiting_payment`, `confirmed`, `cancelled`, `checked_in`, `checked_out`. Payment state is tracked separately.

### Flutterwave deployment

1. Apply every migration in order, including `paid_booking_checkout`, to the same Supabase project used by the app. The earlier `property_management` migration is a prerequisite.
2. Set Edge Function secrets in Supabase (never in Vite environment variables): `FLW_SECRET_KEY`, `FLW_SECRET_HASH`, and `SITE_URL` (the public origin, without a trailing slash). Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.
3. Deploy `create-checkout`, `verify-payment`, and `flutterwave-webhook` from `supabase/functions/`.
4. In Flutterwave dashboard webhook settings, add `https://<project-ref>.supabase.co/functions/v1/flutterwave-webhook` and configure its secret hash to match `FLW_SECRET_HASH`. Enable webhook retries.
5. Apply `set_initial_room_rates` to set the requested USD 35/night rate on all nine seeded residences. Change rates in `/admin/apartments` if needed. The checkout currently charges nightly rate × nights; configure any taxes or additional fees separately before production.
6. Use Flutterwave test credentials and a non-production site first. Payment behavior cannot be tested end-to-end until valid provider credentials, deployed functions and the database migration are configured.

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
