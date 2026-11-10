ALTER TABLE public.property_apartments
  ADD COLUMN IF NOT EXISTS bed_type text,
  ADD COLUMN IF NOT EXISTS bed_quantity integer,
  ADD COLUMN IF NOT EXISTS bed_dimensions text,
  ADD COLUMN IF NOT EXISTS bed_configuration_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_occupancy_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.property_apartments
  DROP CONSTRAINT IF EXISTS property_apartments_bed_quantity_check,
  DROP CONSTRAINT IF EXISTS property_apartments_booking_enabled_ready_check;

ALTER TABLE public.property_apartments
  ADD CONSTRAINT property_apartments_bed_quantity_check
    CHECK (bed_quantity IS NULL OR bed_quantity BETWEEN 1 AND 20),
  ADD CONSTRAINT property_apartments_booking_enabled_ready_check
    CHECK (
      NOT booking_enabled
      OR (
        published
        AND max_occupancy IS NOT NULL AND max_occupancy BETWEEN 1 AND 20
        AND max_occupancy_verified
        AND bed_configuration_verified
        AND NULLIF(btrim(bed_type), '') IS NOT NULL
        AND bed_quantity IS NOT NULL AND bed_quantity BETWEEN 1 AND 20
        AND NULLIF(btrim(bed_dimensions), '') IS NOT NULL
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

UPDATE public.property_apartments
SET bed_configuration = NULL,
    bed_type = NULL,
    bed_quantity = NULL,
    bed_dimensions = NULL,
    bed_configuration_verified = false,
    bedrooms = 1,
    bathrooms = 1,
    max_occupancy = 2,
    max_occupancy_verified = false,
    check_in = '15:00',
    check_out = '11:00',
    starting_price_amount = 35,
    starting_price_currency = 'USD',
    booking_enabled = false,
    updated_at = now()
WHERE slug IN (
  'residence-01',
  'residence-02',
  'residence-03',
  'residence-04',
  'residence-05',
  'residence-06',
  'residence-07',
  'residence-08',
  'residence-09'
);
