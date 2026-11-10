ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS payment_checkout_url text;

CREATE OR REPLACE FUNCTION public.prepare_flutterwave_checkout(p_checkout_token uuid)
RETURNS TABLE (
  booking_id uuid,
  tx_ref text,
  amount numeric,
  currency text,
  apartment_name text,
  guest_name text,
  guest_email text,
  guest_phone text,
  hold_expires_at timestamptz,
  checkout_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking public.booking_requests%ROWTYPE;
  v_tx_ref text;
BEGIN
  IF p_checkout_token IS NULL THEN
    RAISE EXCEPTION 'A valid reservation link is required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_booking
  FROM public.booking_requests b
  WHERE b.checkout_token = p_checkout_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This reservation could not be found.' USING ERRCODE = '22023';
  END IF;
  IF v_booking.status <> 'awaiting_payment'
    OR v_booking.payment_status <> 'awaiting_payment'
    OR v_booking.hold_expires_at IS NULL
    OR v_booking.hold_expires_at <= now() THEN
    RAISE EXCEPTION 'This reservation hold has expired or is no longer awaiting payment.' USING ERRCODE = '22023';
  END IF;
  IF v_booking.total_amount IS NULL OR v_booking.total_amount <= 0
    OR v_booking.currency NOT IN ('USD', 'EUR') THEN
    RAISE EXCEPTION 'This reservation does not have a valid payment amount.' USING ERRCODE = '22023';
  END IF;

  v_tx_ref := v_booking.payment_reference;
  IF v_tx_ref IS NULL THEN
    v_tx_ref := 'DEMI-' || upper(replace(gen_random_uuid()::text, '-', ''));
    UPDATE public.booking_requests
    SET payment_reference = v_tx_ref
    WHERE id = v_booking.id
    RETURNING * INTO v_booking;
  END IF;

  RETURN QUERY
  SELECT
    v_booking.id,
    v_tx_ref,
    v_booking.total_amount,
    v_booking.currency,
    a.name,
    v_booking.guest_name,
    v_booking.guest_email,
    v_booking.guest_phone,
    v_booking.hold_expires_at,
    v_booking.payment_checkout_url
  FROM public.property_apartments a
  WHERE a.slug = v_booking.apartment_slug;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_flutterwave_checkout(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_flutterwave_checkout(uuid) TO service_role;
