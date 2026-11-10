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
7. `allow_manual_reservation_confirmation`: keeps staff status management available while payment processing is not configured.
8. `full_reservation_journey`: adds server-priced 15-minute holds, guest details, a private checkout capability, reference-based admin search, rate limiting, expiry and status audit logging.
9. `configurable_room_content_and_availability`: names and publishes A1–C3 with photo-based editable descriptions, defaults all rooms to booking-disabled, adds verified room/shared amenities, editable house rules, uploaded property media, and admin-managed date blocks.
10. `room_specification_verification`: adds structured bed details and explicit bed/capacity verification; applies the supplied 2-guest, one-bedroom, one-bathroom, $35 USD, 15:00 check-in and 11:00 check-out values to A1–C3 while keeping all rooms booking-disabled.
11. `verify_capacity_for_all_rooms`: marks the user-confirmed two-guest capacity verified on A1–C3 while keeping online reservations disabled until each room's bed details are entered and verified.
12. `public_reservation_requests_for_unbookable_rooms`: lets guests send a clearly labeled, unconfirmed request for a selected published room while its instant-booking setup is incomplete. Requests do not hold dates or take payment.
13. `secure_checkout_for_existing_holds`: gives the server a payment reference for an existing private checkout hold; it does not create a second booking.

Apply them with the Supabase CLI (`supabase db push`) or by running each SQL file in the Supabase SQL editor, in order. All migrations are idempotent.

Public visitors can read booked date ranges and create a reservation only through the validated database function. They cannot read booking rows, change a booking, or mark a payment as paid. A random checkout token grants access only to that reservation's safe summary. Authorized admins can review guest details, search by booking reference, filter by status and check-in dates, and manage booking status.

## Admin dashboard

The admin workspace is available at `/admin` with sections for overview, bookings, apartments, room availability, amenities, house rules, calendar, guests, reports, and property settings. Apply all migrations, create a unique staff account in Supabase Dashboard → Authentication → Users, then set that user's **app metadata** to include `"role": "admin"`. Room profiles and gallery images, guest-visible amenity records, shared property facilities, verified house rules, and date blocks are managed in the dashboard and stored in Supabase. Only amenities/rules marked both verified and published are public. New rooms default to unpublished and booking-disabled; seeded A1–C3 are public but booking-disabled until required facts are verified. The database independently enforces booking readiness and date availability.

The `property-media` Supabase Storage bucket is public-read for website photographs and write-protected to admin accounts. Dashboard image upload accepts JPG, PNG, or WebP up to 5 MB.

## Booking setup and channel management

Beds24 is the selected property-management and channel-management platform for the nine residences. Its published channel-manager information describes two-way connections with Airbnb and Booking.com, plus a direct booking engine. Set up and verify the property, room inventory, rates and restrictions in Beds24 before taking direct online bookings.

The website can embed the property's Beds24 booking engine by setting `VITE_BEDS24_BOOKING_URL` to the secure booking URL from the Beds24 account. The embed is restricted to HTTPS Beds24 domains and is shown only when every published room has booking enabled. Configure and verify the external inventory and channel synchronization before enabling direct bookings.

The website's Supabase calendar includes confirmed stays, unexpired holds and admin-created room-specific date blocks. It is not automatically synchronized with Beds24, Airbnb or Booking.com. Do not accept direct confirmed website reservations alongside OTA bookings until inventory is connected and kept in sync.

## Reservation journey

The public booking page guides guests through five steps for an instant reservation and six for an unbookable-room request:

1. Select check-in/check-out dates and the number of adults and children.
2. Search the database-backed website calendar and choose an available, booking-enabled residence. Booked stays, unexpired holds and admin date blocks are excluded; the database rechecks availability when the hold is created.
3. Provide first/last name, email, international phone, country, optional arrival time and special requests.
4. Review the room, dates, guests and database-configured nightly-rate estimate, then acknowledge the terms, privacy and cancellation information.
5. For a booking-enabled room, create a 15-minute database hold and continue to hosted payment. For a room not enabled for instant booking, guests send a request and review a separate payment step explaining that payment comes only after property confirmation; the request remains pending and does not hold dates or accept payment. The checkout link for a hold is refresh-safe and uses a random capability token distinct from the guest-visible `DEMI-YYYY-XXXXXX` reference.

The database owns price calculation, occupancy/minimum-stay checks, collision prevention, the 15-minute expiry, policy-acceptance timestamp (`draft-v1`) and a per-email request limit. Flutterwave hosted checkout is integrated with the existing hold: the server creates the payment session, verifies the provider callback and webhook, and confirms only a verified payment. Card data is entered on Flutterwave and is never collected or stored by this site. Real payments remain unavailable until the migration is applied, the Edge Functions are deployed, and the Flutterwave test/live secrets and site URL are securely configured. Requests for rooms not enabled for online booking are not holds and cannot be paid; staff must verify and enable a room before guests can use the payment flow. Taxes and fees are not configured; the displayed estimate is nightly rate × nights.

The nine published units are named A1, A2, A3, B1, B2, B3, C1, C2 and C3. Their descriptions are neutral, photo-based and editable. The current supplied values are 2 guests, one bedroom, one bathroom, $35 USD per night, check-in at 15:00 and check-out at 11:00. Bed type, quantity and dimensions are deliberately blank and marked pending verification. In `/admin/apartments`, enter the verified bed details and explicitly verify both the bed configuration and maximum occupancy for each room before enabling instant online reservations. The database enforces these checks independently. Until then, guests can submit a request for a selected room; staff must verify and confirm the stay, and no dates are held by an inquiry. Add confirmed amenities in `/admin/amenities` and approved policies in `/admin/house-rules`; no sample amenities or house rules are seeded. Use `/admin/availability` to block dates for owner use or maintenance. Airbnb/Booking.com synchronization is not implemented by these database tables; it needs the external channel manager.

Statuses include `pending` (legacy requests), `awaiting_payment`, `confirmed`, `cancelled`, `expired`, `checked_in` and `checked_out`. Payment state is separate. Admin status changes are audited; payment is never marked paid from the browser. Confirm a booking manually only after checking inventory and agreeing payment arrangements with the guest.

### Payment deployment and configuration

The selected provider is Flutterwave. Before enabling real payments:

1. Apply `secure_checkout_for_existing_holds` after the other migrations.
2. Deploy `create-checkout`, `verify-payment` and `flutterwave-webhook` to the same Supabase project used by the app.
3. Configure `FLW_SECRET_KEY`, `FLW_SECRET_HASH` and `SITE_URL` in Supabase Edge Function secrets. Use Flutterwave test credentials first; never put secrets in frontend `VITE_*` variables or commit them.
4. Configure the Flutterwave webhook URL as `https://<project-ref>.supabase.co/functions/v1/flutterwave-webhook` and use the same webhook secret hash as `FLW_SECRET_HASH`.
5. Test successful, failed, cancelled and expired payments in Flutterwave test mode before using live credentials.

The checkout session is created for the existing 15-minute reservation hold using its private checkout token; it does not create a duplicate booking. Payment success is trusted only after server-side transaction verification. A paid transaction arriving after the hold expires or after its dates are reassigned is reported for staff resolution rather than silently confirming an overlapping stay. Never ask guests to submit card numbers or security codes through this website.

## Placeholder content

Content that must be replaced before launch is marked as placeholder:

- `src/data/site.ts`: contact email, telephone, address and social links (empty until confirmed). Verified reviews are empty by design.
- Supabase `/admin/apartments`: edit all room names, descriptions, photos, bed configurations, bedroom and bathroom counts, occupancy, sizes, check-in/check-out times, nightly rates, and minimum stays. Room records can be changed without source-code edits.
- Supabase `/admin/amenities` and `/admin/house-rules`: add verified room/shared facilities and approved house rules. Draft or unverified records are hidden from guests.
- `src/data/policies.ts`: policy wording. Bracketed values such as `[retention period]` must be completed by the property.
- `src/data/media.ts`: demonstration photography from Pexels. Replace each room's images with owner-approved photographs of that specific room.

## Not yet built

- Beds24 account configuration, property/room mapping, booking-engine URL, and channel activation. No live Airbnb or Booking.com connection or data import is implemented by this repository.

## Scripts

- `npm run dev`: local development server
- `npm run typecheck`: TypeScript checks
- `npm run lint`: linting
- `npm run build`: production build in `dist/`
