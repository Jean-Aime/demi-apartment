ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_status_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('pending', 'awaiting_payment', 'confirmed', 'cancelled', 'expired', 'checked_in', 'checked_out'));

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS booking_reference text,
  ADD COLUMN IF NOT EXISTS checkout_token uuid,
  ADD COLUMN IF NOT EXISTS adults integer,
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guest_country text,
  ADD COLUMN IF NOT EXISTS estimated_arrival_time text,
  ADD COLUMN IF NOT EXISTS policies_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS policy_version text;

UPDATE public.booking_requests
SET adults = guests
WHERE adults IS NULL;

ALTER TABLE public.booking_requests
  ALTER COLUMN adults SET NOT NULL,
  DROP CONSTRAINT IF EXISTS booking_requests_payment_status_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_payment_status_check
  CHECK (payment_status IN ('not_required', 'not_initiated', 'awaiting_payment', 'processing', 'paid', 'failed', 'refunded', 'expired', 'paid_unassigned'));

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_guest_counts_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_guest_counts_check
  CHECK (adults BETWEEN 1 AND 20 AND children BETWEEN 0 AND 19 AND guests = adults + children);

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_policy_acceptance_pair_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_policy_acceptance_pair_check
  CHECK (
    (policies_accepted_at IS NULL AND policy_version IS NULL)
    OR (policies_accepted_at IS NOT NULL AND policy_version IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_booking_reference_idx
  ON public.booking_requests (booking_reference)
  WHERE booking_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_checkout_token_idx
  ON public.booking_requests (checkout_token)
  WHERE checkout_token IS NOT NULL;

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_no_confirmed_overlap;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_no_confirmed_overlap
  EXCLUDE USING gist (
    apartment_slug WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status IN ('awaiting_payment', 'confirmed', 'checked_in'));

CREATE TABLE IF NOT EXISTS public.booking_rate_limits (
  email text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0)
);

ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_rate_limits FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.booking_requests(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  old_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_audit_log_booking_created_idx
  ON public.booking_audit_log (booking_id, created_at DESC);

ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.booking_audit_log TO authenticated;

REVOKE INSERT ON public.booking_requests FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "anon_insert_pending_booking_requests" ON public.booking_requests;

DROP POLICY IF EXISTS "admin_read_booking_audit_log" ON public.booking_audit_log;
CREATE POLICY "admin_read_booking_audit_log" ON public.booking_audit_log
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.audit_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.booking_audit_log (booking_id, actor_id, action, old_status, new_status)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_requests_audit_status_change ON public.booking_requests;
CREATE TRIGGER booking_requests_audit_status_change
  AFTER UPDATE OF status ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_booking_status_change();

CREATE OR REPLACE FUNCTION public.create_reservation_hold(
  p_apartment_slug text,
  p_check_in date,
  p_check_out date,
  p_adults integer,
  p_children integer,
  p_guest_first_name text,
  p_guest_last_name text,
  p_guest_email text,
  p_guest_phone text,
  p_guest_country text,
  p_policies_accepted boolean,
  p_special_requests text DEFAULT '',
  p_estimated_arrival_time text DEFAULT NULL
)
RETURNS TABLE (
  booking_id uuid,
  booking_reference text,
  checkout_token uuid,
  apartment_slug text,
  apartment_name text,
  photo_src text,
  check_in date,
  check_out date,
  adults integer,
  children integer,
  guests integer,
  nightly_rate numeric,
  total_amount numeric,
  currency text,
  hold_expires_at timestamptz,
  status text,
  payment_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_apartment public.property_apartments%ROWTYPE;
  v_booking_id uuid := gen_random_uuid();
  v_checkout_token uuid := gen_random_uuid();
  v_booking_reference text;
  v_nights integer;
  v_guests integer;
  v_rate_limit_count integer;
  v_hold_expires_at timestamptz := now() + interval '15 minutes';
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL
    OR p_check_out <= p_check_in OR p_check_in < current_date THEN
    RAISE EXCEPTION 'Choose valid future check-in and check-out dates.' USING ERRCODE = '22023';
  END IF;

  IF p_adults IS NULL OR p_adults < 1 OR p_children IS NULL OR p_children < 0
    OR p_adults + p_children > 20 THEN
    RAISE EXCEPTION 'Choose at least one adult and no more than 20 total guests.' USING ERRCODE = '22023';
  END IF;

  IF p_guest_first_name IS NULL OR char_length(btrim(p_guest_first_name)) NOT BETWEEN 1 AND 60
    OR p_guest_last_name IS NULL OR char_length(btrim(p_guest_last_name)) NOT BETWEEN 1 AND 60
    OR p_guest_email IS NULL OR char_length(btrim(p_guest_email)) NOT BETWEEN 3 AND 254
    OR btrim(p_guest_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_guest_phone IS NULL OR char_length(btrim(p_guest_phone)) NOT BETWEEN 7 AND 40
    OR btrim(p_guest_phone) !~ '^\+?[0-9\s()-]{7,40}$'
    OR p_guest_country IS NULL OR char_length(btrim(p_guest_country)) NOT BETWEEN 2 AND 80
    OR char_length(COALESCE(p_special_requests, '')) > 2000
    OR (p_estimated_arrival_time IS NOT NULL AND p_estimated_arrival_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') THEN
    RAISE EXCEPTION 'Guest details are invalid.' USING ERRCODE = '22023';
  END IF;

  IF p_apartment_slug IS NULL OR char_length(btrim(p_apartment_slug)) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Choose a valid residence.' USING ERRCODE = '22023';
  END IF;
  IF p_policies_accepted IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Accept the reservation terms, privacy information and cancellation policy to continue.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.booking_rate_limits (email, window_started_at, request_count)
  VALUES (lower(btrim(p_guest_email)), now(), 1)
  ON CONFLICT (email) DO UPDATE
  SET request_count = CASE
        WHEN public.booking_rate_limits.window_started_at <= now() - interval '15 minutes' THEN 1
        ELSE public.booking_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN public.booking_rate_limits.window_started_at <= now() - interval '15 minutes' THEN now()
        ELSE public.booking_rate_limits.window_started_at
      END
  RETURNING request_count INTO v_rate_limit_count;

  IF v_rate_limit_count > 5 THEN
    RAISE EXCEPTION 'Too many reservation attempts. Please wait 15 minutes before trying again.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.booking_rate_limits
  WHERE window_started_at < now() - interval '1 day';

  PERFORM pg_advisory_xact_lock(hashtext(p_apartment_slug));

  UPDATE public.booking_requests
  SET status = 'expired',
      payment_status = 'expired'
  WHERE apartment_slug = p_apartment_slug
    AND status = 'awaiting_payment'
    AND hold_expires_at <= now();

  SELECT * INTO v_apartment
  FROM public.property_apartments
  WHERE slug = p_apartment_slug AND published = true
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This residence is not available for reservation.' USING ERRCODE = '22023';
  END IF;

  v_guests := p_adults + p_children;
  IF v_apartment.max_occupancy IS NOT NULL AND v_guests > v_apartment.max_occupancy THEN
    RAISE EXCEPTION 'Guest count exceeds this residence capacity.' USING ERRCODE = '22023';
  END IF;
  IF v_apartment.max_occupancy IS NULL THEN
    RAISE EXCEPTION 'This residence cannot accept online reservations until its maximum occupancy is configured.' USING ERRCODE = '22023';
  END IF;

  IF v_apartment.starting_price_amount IS NULL OR v_apartment.starting_price_amount <= 0
    OR v_apartment.starting_price_currency IS NULL
    OR v_apartment.starting_price_currency NOT IN ('USD', 'EUR') THEN
    RAISE EXCEPTION 'This residence does not have a valid online reservation rate configured.' USING ERRCODE = '22023';
  END IF;

  v_nights := p_check_out - p_check_in;
  IF v_apartment.minimum_stay IS NOT NULL AND v_nights < v_apartment.minimum_stay THEN
    RAISE EXCEPTION 'This residence requires a minimum stay of % nights.', v_apartment.minimum_stay USING ERRCODE = '22023';
  END IF;

  LOOP
    v_booking_reference := 'DEMI-' || to_char(current_date, 'YYYY') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.booking_requests b WHERE b.booking_reference = v_booking_reference
    );
  END LOOP;

  INSERT INTO public.booking_requests (
    id, apartment_slug, check_in, check_out, guests, adults, children,
    guest_name, guest_email, guest_phone, guest_country, notes,
    estimated_arrival_time, policies_accepted_at, policy_version,
    status, payment_status, booking_reference,
    checkout_token, hold_expires_at, total_amount, currency
  )
  VALUES (
    v_booking_id, p_apartment_slug, p_check_in, p_check_out, v_guests,
    p_adults, p_children,
    btrim(p_guest_first_name) || ' ' || btrim(p_guest_last_name),
    lower(btrim(p_guest_email)), btrim(p_guest_phone), btrim(p_guest_country),
    COALESCE(btrim(p_special_requests), ''), p_estimated_arrival_time,
    now(), 'draft-v1',
    'awaiting_payment', 'awaiting_payment', v_booking_reference,
    v_checkout_token, v_hold_expires_at,
    round(v_apartment.starting_price_amount * v_nights, 2),
    v_apartment.starting_price_currency
  );

  RETURN QUERY SELECT
    v_booking_id, v_booking_reference, v_checkout_token,
    v_apartment.slug, v_apartment.name, v_apartment.photo_src,
    p_check_in, p_check_out, p_adults, p_children, v_guests,
    v_apartment.starting_price_amount,
    round(v_apartment.starting_price_amount * v_nights, 2),
    v_apartment.starting_price_currency, v_hold_expires_at,
    'awaiting_payment'::text, 'awaiting_payment'::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_booking_payment_hold(text, date, date, integer, text, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_booking_payment_hold(text, date, date, integer, text, text, text, text) FROM service_role;

CREATE OR REPLACE FUNCTION public.get_reservation_checkout(p_checkout_token uuid)
RETURNS TABLE (
  booking_reference text,
  apartment_slug text,
  apartment_name text,
  photo_src text,
  check_in date,
  check_out date,
  adults integer,
  children integer,
  guests integer,
  guest_email text,
  nightly_rate numeric,
  total_amount numeric,
  currency text,
  reservation_status text,
  payment_status text,
  hold_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.booking_requests b
  SET status = 'expired',
      payment_status = 'expired'
  WHERE b.checkout_token = p_checkout_token
    AND b.status = 'awaiting_payment'
    AND b.hold_expires_at <= now();

  RETURN QUERY
  SELECT
    b.booking_reference, b.apartment_slug, a.name, a.photo_src,
    b.check_in, b.check_out, COALESCE(b.adults, b.guests), b.children,
    b.guests, b.guest_email, a.starting_price_amount,
    b.total_amount, b.currency, b.status, b.payment_status,
    b.hold_expires_at
  FROM public.booking_requests b
  JOIN public.property_apartments a ON a.slug = b.apartment_slug
  WHERE b.checkout_token = p_checkout_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reservation_checkout(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservation_checkout(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_expire_booking_holds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Administrator access is required.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.booking_requests
  SET status = 'expired',
      payment_status = 'expired'
  WHERE status = 'awaiting_payment'
    AND hold_expires_at <= now();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_expire_booking_holds() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_expire_booking_holds() TO authenticated;
