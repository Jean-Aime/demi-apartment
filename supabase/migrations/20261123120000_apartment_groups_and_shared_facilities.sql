CREATE TABLE IF NOT EXISTS public.property_apartment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text UNIQUE CHECK (identifier IN ('A', 'B', 'C')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_apartment_groups
  ADD COLUMN IF NOT EXISTS identifier text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.property_apartment_groups
SET identifier = upper(btrim(identifier))
WHERE identifier IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'property_apartment_groups_identifier_key'
      AND conrelid = 'public.property_apartment_groups'::regclass
  ) THEN
    ALTER TABLE public.property_apartment_groups
      ADD CONSTRAINT property_apartment_groups_identifier_key UNIQUE (identifier);
  END IF;
END $$;

INSERT INTO public.property_apartment_groups (identifier, name, description, published)
VALUES
  ('A', 'Apartment A', 'Three private bedrooms with one shared living room and kitchen.', true),
  ('B', 'Apartment B', 'Three private bedrooms with one large shared living room and large shared kitchen.', true),
  ('C', 'Apartment C', 'Two private bedrooms with one shared living room and kitchen.', true)
ON CONFLICT (identifier) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    published = EXCLUDED.published,
    updated_at = now();

ALTER TABLE public.property_apartments
  ADD COLUMN IF NOT EXISTS apartment_group_id uuid REFERENCES public.property_apartment_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.property_shared_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_group_id uuid NOT NULL REFERENCES public.property_apartment_groups(id) ON UPDATE CASCADE ON DELETE CASCADE,
  facility_type text NOT NULL CHECK (facility_type IN ('living_room', 'kitchen')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  photos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(photos) = 'array'),
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apartment_group_id, facility_type)
);

INSERT INTO public.property_shared_facilities (apartment_group_id, facility_type, name, description, published)
SELECT g.id, f.facility_type, f.name, f.description, true
FROM public.property_apartment_groups g
CROSS JOIN (
  VALUES
    ('living_room', 'Shared living room', 'A shared living room for guests staying in this apartment group.'),
    ('kitchen', 'Shared kitchen', 'A shared kitchen for guests staying in this apartment group.')
) AS f(facility_type, name, description)
ON CONFLICT (apartment_group_id, facility_type) DO NOTHING;

UPDATE public.property_apartment_groups g
SET description = CASE g.identifier
  WHEN 'A' THEN 'Three private bedrooms with one shared living room and kitchen.'
  WHEN 'B' THEN 'Three private bedrooms with one large shared living room and large shared kitchen.'
  WHEN 'C' THEN 'Two private bedrooms with one shared living room and kitchen.'
END,
published = true
WHERE g.identifier IN ('A', 'B', 'C');

UPDATE public.property_shared_facilities sf
SET name = CASE WHEN sf.facility_type = 'living_room' THEN 'Large shared living room' ELSE 'Large shared kitchen' END
FROM public.property_apartment_groups g
WHERE sf.apartment_group_id = g.id AND g.identifier = 'B';

UPDATE public.property_apartments r
SET apartment_group_id = g.id,
    name = CASE r.slug
      WHEN 'residence-01' THEN 'Room A1'
      WHEN 'residence-02' THEN 'Room A2'
      WHEN 'residence-03' THEN 'Room A3'
      WHEN 'residence-04' THEN 'Room B1'
      WHEN 'residence-05' THEN 'Room B2'
      WHEN 'residence-06' THEN 'Room B3'
      WHEN 'residence-07' THEN 'Room C1'
      WHEN 'residence-08' THEN 'Room C2'
      ELSE r.name
    END,
    number = CASE r.slug
      WHEN 'residence-01' THEN 'A1'
      WHEN 'residence-02' THEN 'A2'
      WHEN 'residence-03' THEN 'A3'
      WHEN 'residence-04' THEN 'B1'
      WHEN 'residence-05' THEN 'B2'
      WHEN 'residence-06' THEN 'B3'
      WHEN 'residence-07' THEN 'C1'
      WHEN 'residence-08' THEN 'C2'
      ELSE r.number
    END,
    published = CASE WHEN r.slug = 'residence-09' THEN false ELSE r.published END
FROM public.property_apartment_groups g
WHERE g.identifier = CASE
  WHEN r.slug IN ('residence-01','residence-02','residence-03') THEN 'A'
  WHEN r.slug IN ('residence-04','residence-05','residence-06') THEN 'B'
  WHEN r.slug IN ('residence-07','residence-08') THEN 'C'
END;

CREATE INDEX IF NOT EXISTS property_apartments_apartment_group_idx
  ON public.property_apartments (apartment_group_id);
CREATE INDEX IF NOT EXISTS property_shared_facilities_group_idx
  ON public.property_shared_facilities (apartment_group_id, facility_type);

ALTER TABLE public.property_apartment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_shared_facilities ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.property_apartment_groups TO anon, authenticated;
GRANT INSERT, UPDATE ON public.property_apartment_groups TO authenticated;
GRANT SELECT ON public.property_shared_facilities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_shared_facilities TO authenticated;

DROP POLICY IF EXISTS "public_read_published_apartment_groups" ON public.property_apartment_groups;
CREATE POLICY "public_read_published_apartment_groups"
  ON public.property_apartment_groups FOR SELECT TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "admin_manage_apartment_groups" ON public.property_apartment_groups;
CREATE POLICY "admin_manage_apartment_groups"
  ON public.property_apartment_groups FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "public_read_published_shared_facilities" ON public.property_shared_facilities;
CREATE POLICY "public_read_published_shared_facilities"
  ON public.property_shared_facilities FOR SELECT TO anon, authenticated
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.property_apartment_groups g
      WHERE g.id = apartment_group_id AND g.published = true
    )
  );

DROP POLICY IF EXISTS "admin_manage_shared_facilities" ON public.property_shared_facilities;
CREATE POLICY "admin_manage_shared_facilities"
  ON public.property_shared_facilities FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
