UPDATE public.property_apartments
SET starting_price_amount = 35,
    starting_price_currency = 'USD',
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

DO $$
DECLARE
  v_room_count integer;
BEGIN
  SELECT count(*) INTO v_room_count
  FROM public.property_apartments
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
    AND starting_price_amount = 35
    AND starting_price_currency = 'USD';

  IF v_room_count <> 9 THEN
    RAISE EXCEPTION 'Expected 9 managed residences with the configured initial USD 35 rate; found %.', v_room_count;
  END IF;
END $$;
