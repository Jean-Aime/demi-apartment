CREATE OR REPLACE FUNCTION public.get_booking_request_status(
  p_booking_reference text,
  p_guest_email text
)
RETURNS TABLE (
  booking_reference text,
  apartment_name text,
  check_in date,
  check_out date,
  guests integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_booking_reference IS NULL
    OR char_length(btrim(p_booking_reference)) NOT BETWEEN 1 AND 40
    OR p_guest_email IS NULL
    OR char_length(btrim(p_guest_email)) NOT BETWEEN 3 AND 254
    OR btrim(p_guest_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.booking_reference,
    a.name,
    b.check_in,
    b.check_out,
    b.guests,
    b.status
  FROM public.booking_requests AS b
  JOIN public.property_apartments AS a ON a.slug = b.apartment_slug
  WHERE b.booking_reference = upper(btrim(p_booking_reference))
    AND b.guest_email = lower(btrim(p_guest_email))
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_booking_request_status(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_request_status(text, text)
  TO anon, authenticated;
