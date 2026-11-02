/*
# Prevent overlapping confirmed bookings and expose booked dates

1. Summary
- Stops two confirmed (or checked-in) stays from overlapping at the same apartment.
- Adds a public, read-only function that returns only the booked date ranges for an apartment, so the booking page can show availability without exposing guest details.

2. Changes
- Extension `btree_gist` is enabled in the `extensions` schema (needed for the exclusion constraint).
- Exclusion constraint `booking_requests_no_confirmed_overlap` on `booking_requests`: for the same apartment, the stay ranges of rows whose status is 'confirmed' or 'checked_in' cannot overlap. Pending requests are not blocked, so public visitors cannot hold dates hostage; the admin confirms one request and the database rejects a second confirmation for the same nights.
- Function `get_booked_dates(text)` returns check_in and check_out for confirmed or checked-in stays of an apartment that have not ended yet.

3. Security
- The function is SECURITY DEFINER with a fixed search_path, returns only dates, and is granted EXECUTE to anon and authenticated only.
- No new table access is granted. The public still cannot read booking_requests.

4. Notes
- Idempotent: the constraint is added inside a DO block only when missing, and the function uses CREATE OR REPLACE.
- Ranges are half-open [check_in, check_out), so a checkout day and a check-in day on the same date do not conflict.
*/

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_requests_no_confirmed_overlap'
      AND conrelid = 'public.booking_requests'::regclass
  ) THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_no_confirmed_overlap
      EXCLUDE USING gist (
        apartment_slug WITH =,
        daterange(check_in, check_out, '[)') WITH &&
      )
      WHERE (status IN ('confirmed', 'checked_in'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_booked_dates(p_apartment_slug text)
RETURNS TABLE (check_in date, check_out date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.check_in, b.check_out
  FROM public.booking_requests b
  WHERE b.apartment_slug = p_apartment_slug
    AND b.status IN ('confirmed', 'checked_in')
    AND b.check_out >= current_date
  ORDER BY b.check_in;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booked_dates(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_dates(text) TO anon, authenticated;
