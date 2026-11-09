CREATE TABLE IF NOT EXISTS public.property_apartments (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  number text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text NOT NULL DEFAULT '',
  photo_src text NOT NULL,
  photo_alt text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(photos) = 'array'),
  bed_configuration text,
  bedrooms integer CHECK (bedrooms IS NULL OR bedrooms >= 0),
  bathrooms integer CHECK (bathrooms IS NULL OR bathrooms >= 0),
  max_occupancy integer CHECK (max_occupancy IS NULL OR max_occupancy BETWEEN 1 AND 20),
  size_sqm numeric CHECK (size_sqm IS NULL OR size_sqm > 0),
  check_in text,
  check_out text,
  minimum_stay integer CHECK (minimum_stay IS NULL OR minimum_stay > 0),
  facilities text[] NOT NULL DEFAULT '{}',
  house_rules text[] NOT NULL DEFAULT '{}',
  starting_price_amount numeric CHECK (starting_price_amount IS NULL OR starting_price_amount >= 0),
  starting_price_currency text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_apartments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.property_apartments TO anon, authenticated;
GRANT INSERT, UPDATE ON public.property_apartments TO authenticated;

DROP POLICY IF EXISTS "public_read_published_apartments" ON public.property_apartments;
CREATE POLICY "public_read_published_apartments"
  ON public.property_apartments
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "admin_read_all_apartments" ON public.property_apartments;
CREATE POLICY "admin_read_all_apartments"
  ON public.property_apartments
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_insert_apartments" ON public.property_apartments;
CREATE POLICY "admin_insert_apartments"
  ON public.property_apartments
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_apartments" ON public.property_apartments;
CREATE POLICY "admin_update_apartments"
  ON public.property_apartments
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.property_apartments (
  slug, number, name, summary, photo_src, photo_alt, photos
)
VALUES
  ('residence-01', '01', 'Room 01', 'Details for Room 01 are being confirmed by the property.', '/IMG_8664.JPG.jpeg', 'Bedroom with white bedding, dark accent wall and tiled floor', '[{"src":"/IMG_8664.JPG.jpeg","alt":"Bedroom with white bedding, dark accent wall and tiled floor"},{"src":"/IMG_8760.JPG.jpeg","alt":"Bathroom with white vanity, toilet and a glass-enclosed shower"}]'::jsonb),
  ('residence-02', '02', 'Room 02', 'Details for Room 02 are being confirmed by the property.', '/IMG_8666.JPG.jpeg', 'Bedroom with black panelled headboard, integrated lighting and grey curtains', '[{"src":"/IMG_8666.JPG.jpeg","alt":"Bedroom with black panelled headboard, integrated lighting and grey curtains"},{"src":"/IMG_8767.JPG.jpeg","alt":"Fitted kitchen with dark cabinetry, oven, microwave and fridge-freezer"}]'::jsonb),
  ('residence-03', '03', 'Room 03', 'Details for Room 03 are being confirmed by the property.', '/IMG_8667.JPG.jpeg', 'Bedroom with wood-effect flooring and a built-in white wardrobe', '[{"src":"/IMG_8667.JPG.jpeg","alt":"Bedroom with wood-effect flooring and a built-in white wardrobe"},{"src":"/IMG_8771.JPG.jpeg","alt":"Open-plan living space connecting the dining area and the kitchen"}]'::jsonb),
  ('residence-04', '04', 'Room 04', 'Details for Room 04 are being confirmed by the property.', '/IMG_8668.JPG.jpeg', 'Bedroom with wood flooring and a flush circular ceiling light', '[{"src":"/IMG_8668.JPG.jpeg","alt":"Bedroom with wood flooring and a flush circular ceiling light"},{"src":"/IMG_8761.JPG.jpeg","alt":"Bathroom with white wall tiles and a glass shower enclosure"}]'::jsonb),
  ('residence-05', '05', 'Room 05', 'Details for Room 05 are being confirmed by the property.', '/IMG_8670.JPG.jpeg', 'Bedroom with white bedding photographed from the window side', '[{"src":"/IMG_8670.JPG.jpeg","alt":"Bedroom with white bedding photographed from the window side"},{"src":"/IMG_8772.JPG.jpeg","alt":"L-shaped kitchen with sink, hob and white worktops"}]'::jsonb),
  ('residence-06', '06', 'Room 06', 'Details for Room 06 are being confirmed by the property.', '/IMG_8671.JPG.jpeg', 'Bedroom with floating bedside shelves mounted to the headboard', '[{"src":"/IMG_8671.JPG.jpeg","alt":"Bedroom with floating bedside shelves mounted to the headboard"},{"src":"/IMG_8769.JPG.jpeg","alt":"Dining table with four grey upholstered chairs"}]'::jsonb),
  ('residence-07', '07', 'Room 07', 'Details for Room 07 are being confirmed by the property.', '/IMG_8672.JPG.jpeg', 'Bedroom with a multi-door white wardrobe along the side wall', '[{"src":"/IMG_8672.JPG.jpeg","alt":"Bedroom with a multi-door white wardrobe along the side wall"},{"src":"/IMG_8662.JPG.jpeg","alt":"Shaded balcony terrace with seating and a glass balustrade"}]'::jsonb),
  ('residence-08', '08', 'Room 08', 'Details for Room 08 are being confirmed by the property.', '/IMG_8758.JPG.jpeg', 'Bedroom with white linens, wooden nightstands and a deep blue accent wall', '[{"src":"/IMG_8758.JPG.jpeg","alt":"Bedroom with white linens, wooden nightstands and a deep blue accent wall"},{"src":"/IMG_8763.JPG.jpeg","alt":"Bright bathroom with white fixtures and large wall tiles"}]'::jsonb),
  ('residence-09', '09', 'Room 09', 'Details for Room 09 are being confirmed by the property.', '/IMG_8759.JPG.jpeg', 'Bedroom with full-height curtains and grey tiled flooring', '[{"src":"/IMG_8759.JPG.jpeg","alt":"Bedroom with full-height curtains and grey tiled flooring"},{"src":"/IMG_8770.JPG.jpeg","alt":"Dining area beside the kitchen with tiled flooring"}]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_requests_apartment_slug_fkey'
      AND conrelid = 'public.booking_requests'::regclass
  ) THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_apartment_slug_fkey
      FOREIGN KEY (apartment_slug)
      REFERENCES public.property_apartments (slug)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.property_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  contact_address text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.property_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.property_settings TO authenticated;

DROP POLICY IF EXISTS "public_read_property_settings" ON public.property_settings;
CREATE POLICY "public_read_property_settings"
  ON public.property_settings
  FOR SELECT
  TO anon, authenticated
  USING (id = 1);

DROP POLICY IF EXISTS "admin_manage_property_settings" ON public.property_settings;
CREATE POLICY "admin_manage_property_settings"
  ON public.property_settings
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.property_settings (id, contact_email, contact_phone, contact_address)
VALUES (1, 'reservations@example.com', '+250 000 000 000', 'Kimironko, Kigali, Rwanda')
ON CONFLICT (id) DO NOTHING;
