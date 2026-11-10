CREATE OR REPLACE FUNCTION public.create_reservation_request(
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
  p_accepted_house_rule_ids uuid[] DEFAULT '{}',
  p_accepted_house_rule_revisions integer[] DEFAULT '{}',
  p_special_requests text DEFAULT '',
  p_estimated_arrival_time text DEFAULT NULL
)
RETURNS TABLE (
  request_reference text,
  apartment_name text,
  check_in date,
  check_out date,
  guests integer,
  estimated_total numeric,
  currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_apartment public.property_apartments%ROWTYPE;
  v_guests integer;
  v_rate_limit_count integer;
  v_reference text;
  v_rule_ids uuid[];
  v_rule_revisions integer[];
  v_accepted_rules jsonb;
  v_total numeric;
  v_currency text;
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL
    OR p_check_out <= p_check_in OR p_check_in < current_date THEN
    RAISE EXCEPTION 'Choose valid future check-in and check-out dates.' USING ERRCODE = '22023';
  END IF;
  IF p_apartment_slug IS NULL OR char_length(btrim(p_apartment_slug)) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Choose a valid residence.' USING ERRCODE = '22023';
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
  IF p_policies_accepted IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Review and accept the reservation information before sending your request.' USING ERRCODE = '22023';
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

  SELECT * INTO v_apartment
  FROM public.property_apartments
  WHERE slug = p_apartment_slug AND published = true
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This residence is not available for requests.' USING ERRCODE = '22023';
  END IF;
  IF v_apartment.booking_enabled THEN
    RAISE EXCEPTION 'This residence is accepting instant reservations; restart the availability search.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.booking_requests b
    WHERE b.apartment_slug = p_apartment_slug
      AND daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
      AND (
        b.status IN ('confirmed', 'checked_in')
        OR (b.status = 'awaiting_payment' AND b.hold_expires_at > now())
      )
  ) OR EXISTS (
    SELECT 1
    FROM public.property_blocked_dates blocked
    WHERE blocked.apartment_slug = p_apartment_slug
      AND daterange(blocked.check_in, blocked.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'These dates have just become unavailable. Please choose different dates.' USING ERRCODE = '23P01';
  END IF;

  SELECT
    COALESCE(array_agg(r.id ORDER BY r.id), '{}'::uuid[]),
    COALESCE(array_agg(r.revision ORDER BY r.id), '{}'::integer[]),
    COALESCE(
      jsonb_agg(jsonb_build_object(
        'id', r.id,
        'category', r.category,
        'title', r.title,
        'details', r.details,
        'revision', r.revision
      ) ORDER BY r.id),
      '[]'::jsonb
    )
  INTO v_rule_ids, v_rule_revisions, v_accepted_rules
  FROM public.property_house_rules r
  WHERE r.verified = true AND r.published = true;

  IF COALESCE(p_accepted_house_rule_ids, '{}'::uuid[]) IS DISTINCT FROM v_rule_ids
    OR COALESCE(p_accepted_house_rule_revisions, '{}'::integer[]) IS DISTINCT FROM v_rule_revisions THEN
    RAISE EXCEPTION 'The published house rules changed. Review them and submit your request again.' USING ERRCODE = '22023';
  END IF;

  v_guests := p_adults + p_children;
  IF v_apartment.starting_price_amount IS NOT NULL
    AND v_apartment.starting_price_amount > 0
    AND v_apartment.starting_price_currency IN ('USD', 'EUR') THEN
    v_total := round(v_apartment.starting_price_amount * (p_check_out - p_check_in), 2);
    v_currency := v_apartment.starting_price_currency;
  END IF;

  LOOP
    v_reference := 'DEMI-' || to_char(current_date, 'YYYY') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.booking_requests b WHERE b.booking_reference = v_reference
    );
  END LOOP;

  INSERT INTO public.booking_requests (
    id, apartment_slug, check_in, check_out, guests, adults, children,
    guest_name, guest_email, guest_phone, guest_country, notes,
    estimated_arrival_time, policies_accepted_at, policy_version,
    accepted_house_rule_ids, accepted_house_rules,
    status, payment_status, booking_reference, total_amount, currency
  )
  VALUES (
    gen_random_uuid(), v_apartment.slug, p_check_in, p_check_out, v_guests, p_adults, p_children,
    btrim(p_guest_first_name) || ' ' || btrim(p_guest_last_name),
    lower(btrim(p_guest_email)), btrim(p_guest_phone), btrim(p_guest_country),
    COALESCE(btrim(p_special_requests), ''), p_estimated_arrival_time,
    now(), 'draft-v1', v_rule_ids, v_accepted_rules,
    'pending', 'not_required', v_reference, v_total, v_currency
  );

  RETURN QUERY SELECT
    v_reference, v_apartment.name, p_check_in, p_check_out, v_guests, v_total, v_currency;
END;
$$;

REVOKE ALL ON FUNCTION public.create_reservation_request(
  text, date, date, integer, integer, text, text, text, text, text, boolean,
  uuid[], integer[], text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_reservation_request(
  text, date, date, integer, integer, text, text, text, text, text, boolean,
  uuid[], integer[], text, text
) TO anon, authenticated;
