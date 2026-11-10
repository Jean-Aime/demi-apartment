UPDATE public.property_apartments
SET max_occupancy_verified = true,
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
)
AND max_occupancy = 2;
