ALTER TABLE public.property_apartments
  DROP CONSTRAINT IF EXISTS property_apartments_starting_price_currency_check;

ALTER TABLE public.property_apartments
  ADD CONSTRAINT property_apartments_starting_price_currency_check
  CHECK (starting_price_currency IS NULL OR starting_price_currency IN ('USD', 'EUR')) NOT VALID;

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_status_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('pending', 'awaiting_payment', 'confirmed', 'cancelled', 'checked_in', 'checked_out'));

DROP POLICY IF EXISTS "anon_insert_pending_booking_requests" ON public.booking_requests;
REVOKE INSERT ON TABLE public.booking_requests FROM anon, authenticated;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required', 'awaiting_payment', 'paid', 'failed', 'expired', 'paid_unassigned')),
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS currency text CHECK (currency IS NULL OR currency IN ('USD', 'EUR'));

CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_payment_reference_idx
  ON public.booking_requests (payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_payment_transaction_idx
  ON public.booking_requests (payment_transaction_id)
  WHERE payment_transaction_id IS NOT NULL;

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_no_confirmed_overlap;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_no_confirmed_overlap
  EXCLUDE USING gist (
    apartment_slug WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status IN ('awaiting_payment', 'confirmed', 'checked_in'));

CREATE OR REPLACE FUNCTION public.get_booked_dates(p_apartment_slug text)
RETURNS TABLE (check_in date, check_out date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT b.check_in, b.check_out
  FROM public.booking_requests b
  WHERE b.apartment_slug = p_apartment_slug
    AND (
      b.status IN ('confirmed', 'checked_in')
      OR (b.status = 'awaiting_payment' AND b.hold_expires_at > now())
    )
    AND b.check_out >= current_date
  ORDER BY b.check_in;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booked_dates(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_dates(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_booking_payment_hold(
  p_apartment_slug text,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_notes text DEFAULT ''
)
RETURNS TABLE (
  booking_id uuid,
  tx_ref text,
  amount numeric,
  currency text,
  apartment_name text,
  hold_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_apartment public.property_apartments%ROWTYPE;
  v_id uuid := gen_random_uuid();
  v_reference text := 'DEMI-' || upper(replace(gen_random_uuid()::text, '-', ''));
  v_nights integer;
  v_expires_at timestamptz := now() + interval '15 minutes';
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in OR p_check_in < current_date THEN
    RAISE EXCEPTION 'Choose valid future check-in and check-out dates.' USING ERRCODE = '22023';
  END IF;
  IF p_guests IS NULL OR p_guests < 1 OR p_guests > 20 THEN
    RAISE EXCEPTION 'Choose between 1 and 20 guests.' USING ERRCODE = '22023';
  END IF;
  IF p_guest_name IS NULL OR char_length(btrim(p_guest_name)) NOT BETWEEN 1 AND 120
    OR p_guest_email IS NULL OR char_length(btrim(p_guest_email)) NOT BETWEEN 3 AND 254
    OR btrim(p_guest_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_guest_phone IS NULL OR char_length(btrim(p_guest_phone)) NOT BETWEEN 4 AND 40
    OR btrim(p_guest_phone) !~ '^\+?[0-9\s()-]{4,40}$'
    OR char_length(COALESCE(p_notes, '')) > 2000 THEN
    RAISE EXCEPTION 'Guest details are invalid.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_apartment_slug));

  UPDATE public.booking_requests
  SET status = 'cancelled', payment_status = 'expired'
  WHERE apartment_slug = p_apartment_slug
    AND status = 'awaiting_payment'
    AND hold_expires_at <= now();

  SELECT * INTO v_apartment
  FROM public.property_apartments
  WHERE slug = p_apartment_slug AND published = true
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This residence is not available for online booking.' USING ERRCODE = '22023';
  END IF;
  IF v_apartment.starting_price_amount IS NULL OR v_apartment.starting_price_amount <= 0
    OR v_apartment.starting_price_currency NOT IN ('USD', 'EUR') THEN
    RAISE EXCEPTION 'Online booking is not available until this residence has a valid USD or EUR nightly rate.' USING ERRCODE = '22023';
  END IF;
  IF v_apartment.max_occupancy IS NOT NULL AND p_guests > v_apartment.max_occupancy THEN
    RAISE EXCEPTION 'Guest count exceeds this residence capacity.' USING ERRCODE = '22023';
  END IF;

  v_nights := p_check_out - p_check_in;
  IF v_apartment.minimum_stay IS NOT NULL AND v_nights < v_apartment.minimum_stay THEN
    RAISE EXCEPTION 'This residence requires a minimum stay of % nights.', v_apartment.minimum_stay USING ERRCODE = '22023';
  END IF;
  IF round(v_apartment.starting_price_amount * v_nights, 2) <= 0 THEN
    RAISE EXCEPTION 'The configured nightly rate is too low for online checkout.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.booking_requests (
    id, apartment_slug, check_in, check_out, guests, guest_name, guest_email,
    guest_phone, notes, status, payment_status, payment_reference,
    hold_expires_at, total_amount, currency
  )
  VALUES (
    v_id, p_apartment_slug, p_check_in, p_check_out, p_guests, btrim(p_guest_name),
    lower(btrim(p_guest_email)), btrim(p_guest_phone), COALESCE(btrim(p_notes), ''),
    'awaiting_payment', 'awaiting_payment', v_reference, v_expires_at,
    round(v_apartment.starting_price_amount * v_nights, 2), v_apartment.starting_price_currency
  );

  RETURN QUERY SELECT
    v_id, v_reference,
    round(v_apartment.starting_price_amount * v_nights, 2),
    v_apartment.starting_price_currency, v_apartment.name, v_expires_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_booking_payment_hold(text, date, date, integer, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_payment_hold(text, date, date, integer, text, text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.complete_paid_booking(
  p_tx_ref text,
  p_transaction_id text,
  p_amount numeric,
  p_currency text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking public.booking_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_booking
  FROM public.booking_requests
  WHERE payment_reference = p_tx_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_booking.payment_status IN ('paid', 'paid_unassigned') THEN
    IF v_booking.payment_transaction_id = p_transaction_id THEN
      RETURN CASE WHEN v_booking.status = 'confirmed' THEN 'confirmed' ELSE 'paid_unassigned' END;
    END IF;
    RETURN 'already_processed';
  END IF;

  IF p_transaction_id IS NULL OR p_amount IS DISTINCT FROM v_booking.total_amount
    OR p_currency IS DISTINCT FROM v_booking.currency THEN
    RETURN 'payment_mismatch';
  END IF;

  IF v_booking.status <> 'awaiting_payment' OR v_booking.hold_expires_at <= now() THEN
    UPDATE public.booking_requests
    SET status = 'cancelled',
        payment_status = 'paid_unassigned',
        payment_transaction_id = p_transaction_id,
        payment_verified_at = now()
    WHERE id = v_booking.id;
    RETURN 'paid_unassigned';
  END IF;

  BEGIN
    UPDATE public.booking_requests
    SET status = 'confirmed',
        payment_status = 'paid',
        payment_transaction_id = p_transaction_id,
        payment_verified_at = now()
    WHERE id = v_booking.id;
  EXCEPTION WHEN exclusion_violation THEN
    UPDATE public.booking_requests
    SET status = 'cancelled',
        payment_status = 'paid_unassigned',
        payment_transaction_id = p_transaction_id,
        payment_verified_at = now()
    WHERE id = v_booking.id;
    RETURN 'paid_unassigned';
  END;

  RETURN 'confirmed';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_paid_booking(text, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_paid_booking(text, text, numeric, text) TO service_role;

CREATE OR REPLACE FUNCTION public.require_verified_booking_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'checked_in', 'checked_out')
    AND OLD.status NOT IN ('confirmed', 'checked_in', 'checked_out')
    AND NEW.payment_status NOT IN ('paid', 'paid_unassigned') THEN
    RAISE EXCEPTION 'A booking cannot be confirmed until its payment is verified.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_requests_require_verified_payment ON public.booking_requests;
CREATE TRIGGER booking_requests_require_verified_payment
  BEFORE UPDATE OF status ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.require_verified_booking_payment();
