ALTER TABLE public.property_apartments
  ADD COLUMN IF NOT EXISTS booking_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.property_apartments
  DROP CONSTRAINT IF EXISTS property_apartments_booking_enabled_ready_check;

ALTER TABLE public.property_apartments
  ADD CONSTRAINT property_apartments_booking_enabled_ready_check
  CHECK (
    NOT booking_enabled
    OR (
      published
      AND max_occupancy IS NOT NULL AND max_occupancy BETWEEN 1 AND 20
      AND NULLIF(btrim(bed_configuration), '') IS NOT NULL
      AND bedrooms IS NOT NULL
      AND bathrooms IS NOT NULL
      AND starting_price_amount IS NOT NULL AND starting_price_amount > 0
      AND starting_price_currency IS NOT NULL AND starting_price_currency IN ('USD', 'EUR')
      AND NULLIF(btrim(check_in), '') IS NOT NULL
      AND NULLIF(btrim(check_out), '') IS NOT NULL
      AND photos IS NOT NULL
      AND jsonb_array_length(photos) > 0
    )
  );

UPDATE public.property_apartments AS rooms
SET number = content.unit_name,
    name = content.unit_name,
    summary = content.description,
    published = true,
    updated_at = now()
FROM (VALUES
  ('residence-01', '01', 'A1', 'A considered bedroom interior, photographed with white bedding, a dark accent wall and tiled flooring. The gallery also includes a bathroom view with a glass-enclosed shower.'),
  ('residence-02', '02', 'A2', 'A bedroom photographed with a dark panelled headboard, integrated lighting and grey curtains. The gallery includes a fitted kitchen with dark cabinetry.'),
  ('residence-03', '03', 'A3', 'A bedroom interior photographed with wood-effect flooring and a built-in white wardrobe. The gallery also shows an open-plan living and dining space beside the kitchen.'),
  ('residence-04', '04', 'B1', 'A bedroom interior photographed with wood flooring and a circular ceiling light. The gallery includes a bathroom with white wall tiles and a glass shower enclosure.'),
  ('residence-05', '05', 'B2', 'A bedroom photographed with white bedding from the window side. The gallery also shows an L-shaped kitchen with white worktops.'),
  ('residence-06', '06', 'B3', 'A bedroom interior photographed with floating bedside shelves beside the headboard. The gallery also shows a dining table with upholstered chairs.'),
  ('residence-07', '07', 'C1', 'A bedroom interior photographed with a multi-door white wardrobe. The gallery also includes a shaded terrace with seating and a glass balustrade.'),
  ('residence-08', '08', 'C2', 'A bedroom photographed with white linens, wooden bedside tables and a deep blue accent wall. The gallery includes a bright bathroom with white fixtures.'),
  ('residence-09', '09', 'C3', 'A bedroom interior photographed with full-height curtains and grey tiled flooring. The gallery also shows a dining area beside the kitchen.')
) AS content(slug, old_number, unit_name, description)
WHERE rooms.slug = content.slug AND rooms.number = content.old_number;

CREATE TABLE IF NOT EXISTS public.property_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('room', 'shared')),
  apartment_slug text REFERENCES public.property_apartments (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  photo_path text,
  photo_alt text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_amenities_scope_room_check
    CHECK ((scope = 'shared' AND apartment_slug IS NULL) OR (scope = 'room' AND apartment_slug IS NOT NULL))
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-media',
  'property-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_read_property_media" ON storage.objects;
CREATE POLICY "public_read_property_media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-media');

DROP POLICY IF EXISTS "admin_insert_property_media" ON storage.objects;
CREATE POLICY "admin_insert_property_media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "admin_update_property_media" ON storage.objects;
CREATE POLICY "admin_update_property_media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'property-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "admin_delete_property_media" ON storage.objects;
CREATE POLICY "admin_delete_property_media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS property_amenities_public_order_idx
  ON public.property_amenities (scope, apartment_slug, display_order)
  WHERE verified AND published;

ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_amenities TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_verified_property_amenities" ON public.property_amenities;
CREATE POLICY "public_read_verified_property_amenities"
  ON public.property_amenities
  FOR SELECT
  TO anon, authenticated
  USING (verified AND published);

DROP POLICY IF EXISTS "admin_manage_property_amenities" ON public.property_amenities;
CREATE POLICY "admin_manage_property_amenities"
  ON public.property_amenities
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS public.property_house_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  details text NOT NULL CHECK (char_length(btrim(details)) BETWEEN 1 AND 2000),
  verified boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_house_rules ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_house_rules TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_verified_property_house_rules" ON public.property_house_rules;
CREATE POLICY "public_read_verified_property_house_rules"
  ON public.property_house_rules
  FOR SELECT
  TO anon, authenticated
  USING (verified AND published);

DROP POLICY IF EXISTS "admin_manage_property_house_rules" ON public.property_house_rules;
CREATE POLICY "admin_manage_property_house_rules"
  ON public.property_house_rules
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.bump_property_rule_revision()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.category IS DISTINCT FROM OLD.category
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.details IS DISTINCT FROM OLD.details
    OR NEW.verified IS DISTINCT FROM OLD.verified
    OR NEW.published IS DISTINCT FROM OLD.published THEN
    NEW.revision := OLD.revision + 1;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_house_rules_revision_trigger ON public.property_house_rules;
CREATE TRIGGER property_house_rules_revision_trigger
  BEFORE UPDATE ON public.property_house_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_property_rule_revision();

CREATE TABLE IF NOT EXISTS public.property_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_slug text NOT NULL REFERENCES public.property_apartments (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_blocked_dates_valid CHECK (check_out > check_in),
  CONSTRAINT property_blocked_dates_no_overlap
    EXCLUDE USING gist (
      apartment_slug WITH =,
      daterange(check_in, check_out, '[)') WITH &&
    )
);

CREATE INDEX IF NOT EXISTS property_blocked_dates_lookup_idx
  ON public.property_blocked_dates (apartment_slug, check_in, check_out);

ALTER TABLE public.property_blocked_dates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, DELETE ON public.property_blocked_dates TO authenticated;

DROP POLICY IF EXISTS "admin_read_property_blocked_dates" ON public.property_blocked_dates;
CREATE POLICY "admin_read_property_blocked_dates"
  ON public.property_blocked_dates
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_delete_property_blocked_dates" ON public.property_blocked_dates;
CREATE POLICY "admin_delete_property_blocked_dates"
  ON public.property_blocked_dates
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS accepted_house_rule_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepted_house_rules jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_accepted_house_rules_array_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_accepted_house_rules_array_check
  CHECK (jsonb_typeof(accepted_house_rules) = 'array');

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
  UNION ALL
  SELECT blocked.check_in, blocked.check_out
  FROM public.property_blocked_dates blocked
  WHERE blocked.apartment_slug = p_apartment_slug
    AND blocked.check_out >= current_date;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booked_dates(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_dates(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_block_reservation_dates(
  p_apartment_slug text,
  p_check_in date,
  p_check_out date,
  p_reason text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Administrator access is required.' USING ERRCODE = '42501';
  END IF;
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in
    OR p_check_in < current_date OR char_length(COALESCE(p_reason, '')) > 300 THEN
    RAISE EXCEPTION 'Choose valid future block dates and a short reason.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_apartment_slug));

  IF EXISTS (
    SELECT 1
    FROM public.booking_requests b
    WHERE b.apartment_slug = p_apartment_slug
      AND daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
      AND (
        b.status IN ('confirmed', 'checked_in')
        OR (b.status = 'awaiting_payment' AND b.hold_expires_at > now())
      )
  ) THEN
    RAISE EXCEPTION 'These dates overlap a confirmed stay or active reservation hold.' USING ERRCODE = '23P01';
  END IF;

  INSERT INTO public.property_blocked_dates (id, apartment_slug, check_in, check_out, reason)
  VALUES (v_id, p_apartment_slug, p_check_in, p_check_out, btrim(COALESCE(p_reason, '')));
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_block_reservation_dates(text, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_block_reservation_dates(text, date, date, text) TO authenticated;

DROP FUNCTION IF EXISTS public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, text, text);
DROP FUNCTION IF EXISTS public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, uuid[], text, text);
DROP FUNCTION IF EXISTS public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, uuid[], integer[], text, text);

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
  p_accepted_house_rule_ids uuid[] DEFAULT '{}',
  p_accepted_house_rule_revisions integer[] DEFAULT '{}',
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
  v_current_rule_ids uuid[];
  v_current_rule_revisions integer[];
  v_accepted_rules jsonb;
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
    RAISE EXCEPTION 'Accept the reservation terms and privacy information to continue.' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(array_agg(r.id ORDER BY r.id), '{}'::uuid[]),
         COALESCE(array_agg(r.revision ORDER BY r.id), '{}'::integer[]),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', r.id, 'category', r.category, 'title', r.title,
           'details', r.details, 'revision', r.revision
         ) ORDER BY r.id), '[]'::jsonb)
  INTO v_current_rule_ids, v_current_rule_revisions, v_accepted_rules
  FROM public.property_house_rules r
  WHERE r.verified AND r.published;

  IF COALESCE(p_accepted_house_rule_ids, '{}'::uuid[]) IS DISTINCT FROM v_current_rule_ids
    OR COALESCE(p_accepted_house_rule_revisions, '{}'::integer[]) IS DISTINCT FROM v_current_rule_revisions THEN
    RAISE EXCEPTION 'Review and accept the current published house rules before continuing.' USING ERRCODE = '22023';
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
  SET status = 'expired', payment_status = 'expired'
  WHERE apartment_slug = p_apartment_slug
    AND status = 'awaiting_payment'
    AND hold_expires_at <= now();

  SELECT * INTO v_apartment
  FROM public.property_apartments
  WHERE slug = p_apartment_slug AND published = true AND booking_enabled = true
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This residence is not yet available for online reservations. Please contact the property.' USING ERRCODE = '22023';
  END IF;
  v_guests := p_adults + p_children;
  IF v_apartment.max_occupancy IS NULL OR v_guests > v_apartment.max_occupancy THEN
    RAISE EXCEPTION 'Guest count exceeds this residence capacity.' USING ERRCODE = '22023';
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
  IF EXISTS (
    SELECT 1 FROM public.property_blocked_dates d
    WHERE d.apartment_slug = p_apartment_slug
      AND daterange(d.check_in, d.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  ) THEN
    RAISE EXCEPTION 'These dates are unavailable. Please choose another date range.' USING ERRCODE = '23P01';
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
    accepted_house_rule_ids, accepted_house_rules,
    status, payment_status, booking_reference, checkout_token, hold_expires_at,
    total_amount, currency
  )
  VALUES (
    v_booking_id, p_apartment_slug, p_check_in, p_check_out, v_guests,
    p_adults, p_children,
    btrim(p_guest_first_name) || ' ' || btrim(p_guest_last_name),
    lower(btrim(p_guest_email)), btrim(p_guest_phone), btrim(p_guest_country),
    COALESCE(btrim(p_special_requests), ''), p_estimated_arrival_time,
    now(), 'draft-v1', v_current_rule_ids, v_accepted_rules,
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

REVOKE EXECUTE ON FUNCTION public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, uuid[], integer[], text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation_hold(text, date, date, integer, integer, text, text, text, text, text, boolean, uuid[], integer[], text, text) TO anon, authenticated;
