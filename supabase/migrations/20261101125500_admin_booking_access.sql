/*
  Staff can view booking requests and change booking status only when their
  Supabase Auth app_metadata contains { "role": "admin" }.
*/

GRANT SELECT ON TABLE public.booking_requests TO authenticated;
GRANT UPDATE (status) ON TABLE public.booking_requests TO authenticated;

DROP POLICY IF EXISTS "admin_read_booking_requests" ON public.booking_requests;
CREATE POLICY "admin_read_booking_requests" ON public.booking_requests
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_booking_status" ON public.booking_requests;
CREATE POLICY "admin_update_booking_status" ON public.booking_requests
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
