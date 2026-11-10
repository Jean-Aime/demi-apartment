GRANT INSERT ON TABLE public.booking_requests TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_pending_booking_requests" ON public.booking_requests;
CREATE POLICY "anon_insert_pending_booking_requests" ON public.booking_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND payment_status = 'not_required'
  );

CREATE OR REPLACE FUNCTION public.require_verified_booking_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'checked_in', 'checked_out')
    AND OLD.status NOT IN ('confirmed', 'checked_in', 'checked_out')
    AND NEW.payment_status NOT IN ('paid', 'paid_unassigned')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only an authorized admin or verified payment can confirm this reservation.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_requests_require_verified_payment ON public.booking_requests;
CREATE TRIGGER booking_requests_require_verified_payment
  BEFORE UPDATE OF status ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.require_verified_booking_payment();
