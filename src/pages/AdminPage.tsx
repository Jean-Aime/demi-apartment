import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apartments } from '@/data/apartments';
import { supabase } from '@/lib/supabase';
import {
  AdminApartments,
  AdminCalendar,
  AdminDashboard,
  AdminGuests,
  AdminReports,
  AdminSettings,
} from '@/components/admin/AdminSections';
import {
  bookingRequestSchema,
  bookingStatuses,
  formatAdminDate,
  type BookingRequest,
  type BookingStatus,
  type StatusFilter,
} from '@/lib/admin';
import { useApartments } from '@/hooks/useApartments';
import AdminModal from '@/components/admin/AdminModal';
import { AdminAmenities, AdminAvailability, AdminHouseRules } from '@/components/admin/AdminPropertyContent';

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-gold/15 text-ink-800',
  awaiting_payment: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  expired: 'bg-ink-100 text-ink-600',
  checked_in: 'bg-sky-100 text-sky-800',
  checked_out: 'bg-ink-100 text-ink-600',
};

const adminNavigation = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard, group: 'Workspace' },
  { label: 'Bookings', path: '/admin/bookings', icon: ClipboardList, group: 'Operations' },
  { label: 'Availability', path: '/admin/availability', icon: CalendarCheck, group: 'Operations' },
  { label: 'Calendar', path: '/admin/calendar', icon: CalendarDays, group: 'Operations' },
  { label: 'Apartment Management', path: '/admin/apartments', icon: Building2, group: 'Property' },
  { label: 'Amenities', path: '/admin/amenities', icon: Sparkles, group: 'Property' },
  { label: 'House rules', path: '/admin/house-rules', icon: ScrollText, group: 'Property' },
  { label: 'Guests', path: '/admin/guests', icon: UsersRound, group: 'Insights' },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3, group: 'Insights' },
  { label: 'Settings', path: '/admin/settings', icon: Settings, group: 'Insights' },
];

function isAdminNavigationActive(path: string, section: string) {
  return section === '' || section === 'dashboard'
    ? path === '/admin'
    : path === `/admin/${section}`;
}

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { apartments: managedApartments } = useApartments();
  const section = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';
  const activeNavigation = adminNavigation.find((item) => isAdminNavigationActive(item.path, section));
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, BookingStatus>>({});
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<BookingStatus>('pending');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  const isAdmin = session?.user.app_metadata.role === 'admin';
  const getApartmentName = useCallback((slug: string) =>
    managedApartments.find((apartment) => apartment.slug === slug)?.name ??
      apartments.find((apartment) => apartment.slug === slug)?.name ??
      slug, [managedApartments]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAuthError('Staff access is unavailable because the Supabase booking service is not configured.');
      setAuthLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError('');
      setAuthLoading(false);
    });
    client.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    }).catch((error: unknown) => {
      setAuthError(error instanceof Error ? error.message : 'Could not restore the sign-in session.');
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!isAdmin || !client) {
      setBookings([]);
      setBookingsError('');
      setBookingsLoading(false);
      return;
    }

    let active = true;
    const loadBookings = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const { error: expiryError } = await client.rpc('admin_expire_booking_holds');
        if (expiryError) throw new Error(`Could not refresh expired reservation holds: ${expiryError.message}`);

        const { data, error } = await client
          .from('booking_requests')
          .select('id, booking_reference, apartment_slug, check_in, check_out, guests, adults, children, guest_name, guest_email, guest_phone, guest_country, estimated_arrival_time, policies_accepted_at, policy_version, accepted_house_rule_ids, accepted_house_rules, notes, status, payment_status, payment_reference, total_amount, currency, payment_transaction_id, payment_verified_at, hold_expires_at, created_at')
          .order('created_at', { ascending: false });

        if (!active) return;
        if (error) {
          setBookingsError(`Could not load booking requests: ${error.message}`);
        } else {
          const parsed = bookingRequestSchema.safeParse(data);
          if (parsed.success) {
            setBookings(parsed.data);
          } else {
            setBookingsError('Booking data returned an unexpected format. Please contact your administrator.');
          }
        }
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unexpected network error.';
        setBookingsError(`Could not load booking requests: ${message}`);
      } finally {
        if (active) setBookingsLoading(false);
      }
    };

    void loadBookings();
    return () => {
      active = false;
    };
  }, [isAdmin, refreshCount]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = filter === 'all' || booking.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        [booking.booking_reference ?? '', booking.guest_name, booking.guest_email, getApartmentName(booking.apartment_slug)]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesDateRange =
        (!checkInFrom || booking.check_in >= checkInFrom) &&
        (!checkInTo || booking.check_in <= checkInTo);
      return matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [bookings, checkInFrom, checkInTo, filter, getApartmentName, search]);

  const summary = [
    { label: 'Total requests', value: bookings.length, icon: CalendarDays },
    { label: 'Awaiting payment', value: bookings.filter((booking) => booking.status === 'awaiting_payment').length, icon: Clock3 },
    { label: 'Confirmed stays', value: bookings.filter((booking) => booking.status === 'confirmed').length, icon: Check },
    { label: 'Payment resolution needed', value: bookings.filter((booking) => booking.payment_status === 'paid_unassigned').length, icon: ShieldCheck },
  ];

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;
    if (!client) {
      setAuthError('Staff access is unavailable because the Supabase booking service is not configured.');
      return;
    }

    setSigningIn(true);
    setAuthError('');
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
      if (data.session) setSession(data.session);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }

  }

  async function refreshAdminAccess() {
    if (!supabase) return;
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(data.session);
      if (data.session?.user.app_metadata.role !== 'admin') {
        setAuthError('The current Supabase token still has no admin app-metadata role. Verify the app_metadata value in the correct Supabase project, then sign out and sign in again.');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not refresh the admin session.');
    }
  }

  async function handleSignOut() {
    const client = supabase;
    if (!client) return;

    setAuthError('');
    try {
      const { error } = await client.auth.signOut();
      if (error) setAuthError(`Could not sign out: ${error.message}`);
    } catch (error) {
      setAuthError(`Could not sign out: ${error instanceof Error ? error.message : 'Unexpected error.'}`);
    }
  }

  async function updateStatus(booking: BookingRequest, status: BookingStatus): Promise<boolean> {
    const client = supabase;
    if (!client) {
      setActionError('Booking updates are unavailable because the Supabase service is not configured.');
      return false;
    }

    setUpdatingId(booking.id);
    setActionError('');
    try {
      const { data, error } = await client
        .from('booking_requests')
        .update({ status })
        .eq('id', booking.id)
        .select('id')
        .maybeSingle();

      if (error) {
        setActionError(`Could not update ${booking.guest_name}'s request: ${error.message}`);
      } else if (!data) {
        setActionError(`Could not update ${booking.guest_name}'s request: no matching booking was updated.`);
        return false;
      } else {
        setBookings((current) =>
          current.map((item) => (item.id === booking.id ? { ...item, status } : item)),
        );
        setStatusDrafts((current) => ({ ...current, [booking.id]: status }));
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected network error.';
      setActionError(`Could not update ${booking.guest_name}'s request: ${message}`);
      return false;
    } finally {
      setUpdatingId(null);
    }
    return false;
  }

  async function saveSelectedBookingStatus() {
    if (!selectedBooking) return;
    const updated = await updateStatus(selectedBooking, selectedBookingStatus);
    if (updated) setSelectedBooking(null);
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-warm px-6">
        <p className="eyebrow">Checking secure access</p>
      </main>
    );
  }

  if (!session || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-warm px-6 py-20">
        <section className="w-full max-w-md border border-ink-100 bg-paper p-6 shadow-[0_24px_80px_rgba(27,25,20,0.08)] sm:p-8 md:p-12">
          <Link to="/" className="inline-flex items-center gap-3 text-ink-900" aria-label="DEMI Apartment home">
            <span className="flex h-10 w-10 items-center justify-center border border-gold/50">
              <Building2 className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden="true" />
            </span>
            <span className="font-serif text-xl tracking-[0.2em]">DEMI</span>
          </Link>
          <p className="eyebrow mt-12">Staff access</p>
          <h1 className="display mt-4 text-4xl text-ink-900">Booking administration</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Sign in with an authorised staff account to review guest requests.
          </p>

          {session && !isAdmin ? (
            <div className="mt-8 space-y-4 border-l-2 border-gold bg-paper-warm p-4 text-sm leading-relaxed text-ink-700" role="alert">
              <p>This account is signed in, but this session does not contain the required <code>app_metadata.role = admin</code> claim.</p>
              <dl className="grid gap-1 text-xs">
                <div><dt className="inline font-medium">App project: </dt><dd className="inline break-all">{import.meta.env.VITE_SUPABASE_URL || 'not configured'}</dd></div>
                <div><dt className="inline font-medium">Signed in as: </dt><dd className="inline">{session.user.email}</dd></div>
                <div><dt className="inline font-medium">App metadata role: </dt><dd className="inline">{String(session.user.app_metadata.role ?? 'not set')}</dd></div>
                <div><dt className="inline font-medium">User metadata role (not accepted for admin access): </dt><dd className="inline">{String(session.user.user_metadata.role ?? 'not set')}</dd></div>
                <div><dt className="inline font-medium">User ID: </dt><dd className="break-all font-mono">{session.user.id}</dd></div>
              </dl>
              <p>Set the role in Supabase Dashboard → Authentication → Users → your account → App Metadata. Make sure this is the project in this app’s local environment, then refresh your session.</p>
              <details className="text-xs">
                <summary className="cursor-pointer font-medium underline">Show SQL for this signed-in user</summary>
                <pre className="mt-2 overflow-x-auto border border-ink-100 bg-paper p-3 text-[0.65rem]">{`UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE id = '${session.user.id}'::uuid;`}</pre>
                <p className="mt-2">Run this only in the SQL Editor for the same Supabase project, as a trusted project administrator.</p>
              </details>
              <button type="button" onClick={() => void refreshAdminAccess()} className="btn-outline px-4 py-2 text-xs uppercase tracking-[0.12em]">Refresh admin access</button>
              {authError && <p className="text-sm text-rose-700" role="alert">{authError}</p>}
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="mt-8 space-y-5">
              <label className="block text-sm text-ink-700">
                Email address
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full border border-ink-200 bg-paper px-4 py-3 text-ink-900 outline-none transition-colors focus:border-gold"
                />
              </label>
              <label className="block text-sm text-ink-700">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full border border-ink-200 bg-paper px-4 py-3 text-ink-900 outline-none transition-colors focus:border-gold"
                />
              </label>
              {authError && <p className="text-sm text-rose-700" role="alert">{authError}</p>}
              <button
                type="submit"
                disabled={signingIn}
                className="btn-gold inline-flex w-full items-center justify-center gap-3 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {signingIn ? 'Signing in…' : 'Sign in securely'}
              </button>
            </form>
          )}

          {session && (
            <button type="button" onClick={handleSignOut} className="link-line mt-6 text-ink-900">
              Sign out
            </button>
          )}
          {session && authError && <p className="mt-4 text-sm text-rose-700" role="alert">{authError}</p>}
          {!session && authError && <p className="mt-4 text-sm text-rose-700" role="alert">{authError}</p>}
        </section>
      </main>
    );
  }

  const adminInitials = (session.user.email ?? 'DA')
    .split('@')[0]
    .split(/[._-]/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <header className="sticky top-0 z-50 border-b border-ink-100 bg-paper/95 shadow-[0_4px_18px_rgba(27,25,20,0.035)] backdrop-blur">
        <div className="flex h-[76px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4 lg:w-64">
            <Link to="/admin" className="inline-flex shrink-0 items-center gap-3 text-ink-900" aria-label="DEMI administration overview">
              <span className="flex h-10 w-10 items-center justify-center bg-ink-900 text-gold">
                <Building2 className="h-4 w-4" strokeWidth={1.25} aria-hidden="true" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif text-lg tracking-[0.2em]">DEMI</span>
                <span className="mt-1 text-[0.55rem] font-semibold tracking-[0.28em] text-ink-400">PROPERTY DESK</span>
              </span>
            </Link>
            <span className="hidden h-8 border-l border-ink-200 lg:block" />
            <span className="hidden truncate text-sm font-medium text-ink-700 lg:block">{activeNavigation?.label ?? 'Overview'}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setMobileNavigationOpen((open) => !open)}
              aria-expanded={mobileNavigationOpen}
              aria-controls="admin-mobile-navigation"
              aria-label={mobileNavigationOpen ? 'Close administration menu' : 'Open administration menu'}
              className="inline-flex h-10 w-10 items-center justify-center border border-ink-200 text-ink-700 transition-colors hover:border-gold hover:text-gold lg:hidden"
            >
              {mobileNavigationOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
            <Link to="/" target="_blank" rel="noreferrer" className="hidden items-center gap-2 px-3 py-2 text-xs font-medium text-ink-600 transition-colors hover:text-gold-deep sm:inline-flex">
              <span>View website</span><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <span className="hidden h-8 border-l border-ink-200 sm:block" />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-gold/20 text-xs font-semibold tracking-wide text-ink-800" aria-hidden="true">{adminInitials}</span>
            <span className="hidden max-w-[22vw] truncate text-xs text-ink-500 md:block">{session.user.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex shrink-0 items-center gap-2 border border-ink-200 px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-paper sm:px-4 sm:text-[0.65rem]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        id="admin-mobile-navigation"
        aria-label="Administration"
        className={`${mobileNavigationOpen ? 'block' : 'hidden'} border-b border-ink-100 bg-paper lg:hidden`}
      >
        <div className="grid grid-cols-2 gap-2 px-5 py-3 sm:grid-cols-3 sm:px-6">
          {adminNavigation.map(({ label, path, icon: Icon }) => {
            const isActive = isAdminNavigationActive(path, section);

            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileNavigationOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2 border-l-2 px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'border-gold bg-paper-warm text-ink-900' : 'border-transparent text-ink-600 hover:bg-paper-warm hover:text-ink-900'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-gold-deep' : 'text-ink-400'}`} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="lg:flex">
        <aside className="hidden w-64 shrink-0 border-r border-ink-100 bg-paper px-4 py-7 lg:sticky lg:top-[76px] lg:block lg:h-[calc(100vh-76px)] lg:self-start lg:overflow-y-auto">
          <nav aria-label="Administration" className="space-y-5">
            {adminNavigation.map(({ label, path, icon: Icon, group }, index) => {
              const isActive = isAdminNavigationActive(path, section);

              return (
                <div key={path}>
                  {(index === 0 || adminNavigation[index - 1].group !== group) && (
                    <p className={`${index > 0 ? 'mt-5' : ''} mb-2 px-3 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink-400`}>{group}</p>
                  )}
                  <Link
                    to={path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-[0.82rem] transition-colors ${isActive ? 'border-gold bg-paper-warm font-semibold text-ink-900' : 'border-transparent text-ink-600 hover:bg-paper-warm hover:text-ink-900'}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-gold-deep' : 'text-ink-400'}`} strokeWidth={1.6} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="mt-8 border-t border-ink-100 pt-5">
            <div className="flex items-center gap-3 bg-paper-warm p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-paper text-gold-deep"><ShieldCheck className="h-4 w-4" aria-hidden="true" /></span>
              <span><span className="block text-xs font-semibold text-ink-800">Secure workspace</span><span className="mt-0.5 block text-[0.65rem] text-ink-500">Administrator access</span></span>
            </div>
          </div>
        </aside>

      <div className="min-w-0 flex-1 px-5 py-8 sm:px-6 md:px-8 md:py-10 xl:px-10">
        {authError && <p className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{authError}</p>}
        {bookingsError && section !== 'bookings' && (
          <p className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {bookingsError} Check that the admin-access migration is applied and your role is in app_metadata.
          </p>
        )}
        {section === '' || section === 'dashboard' ? (
          <AdminDashboard bookings={bookings} onNavigate={navigate} />
        ) : section === 'apartments' ? (
          <AdminApartments />
        ) : section === 'availability' ? (
          <AdminAvailability />
        ) : section === 'amenities' ? (
          <AdminAmenities />
        ) : section === 'house-rules' ? (
          <AdminHouseRules />
        ) : section === 'calendar' ? (
          <AdminCalendar bookings={bookings} />
        ) : section === 'guests' ? (
          <AdminGuests bookings={bookings} />
        ) : section === 'reports' ? (
          <AdminReports bookings={bookings} />
        ) : section === 'settings' ? (
          <AdminSettings />
        ) : section === 'bookings' ? (
          <>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Reservations</p>
            <h1 className="display mt-3 text-[clamp(2rem,8vw,3rem)] text-ink-900">Booking requests</h1>
            <p className="mt-3 text-sm text-ink-500">Search reservation references, check dates and manage each booking and payment state.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshCount((count) => count + 1)}
            disabled={bookingsLoading}
            className="btn-outline inline-flex w-fit items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${bookingsLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {summary.map((item) => (
            <section key={item.label} className="border border-ink-100 bg-paper p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-500">{item.label}</p>
                <item.icon className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="mt-5 font-serif text-4xl text-ink-900">{item.value}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 border border-ink-100 bg-paper">
          <div className="flex flex-col gap-4 border-b border-ink-100 p-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex flex-wrap gap-2" aria-label="Filter bookings by status">
              {(['all', ...bookingStatuses] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 text-xs capitalize transition-colors ${
                    filter === status ? 'bg-ink-900 text-paper' : 'text-ink-500 hover:bg-paper-warm hover:text-ink-900'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <label className="relative block md:w-72">
              <span className="sr-only">Search reference, guest or residence</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Reference, guest or residence"
                className="w-full border border-ink-100 bg-paper-warm py-2.5 pl-10 pr-3 text-sm text-ink-900 outline-none focus:border-gold"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="text-xs text-ink-500">
                Check-in from
                <input type="date" value={checkInFrom} onChange={(event) => setCheckInFrom(event.target.value)} className="mt-1 block border border-ink-100 bg-paper px-2 py-2 text-sm text-ink-800" />
              </label>
              <label className="text-xs text-ink-500">
                Check-in to
                <input type="date" value={checkInTo} onChange={(event) => setCheckInTo(event.target.value)} className="mt-1 block border border-ink-100 bg-paper px-2 py-2 text-sm text-ink-800" />
              </label>
            </div>
          </div>

          {actionError && (
            <p className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-800" role="alert">
              {actionError}
            </p>
          )}

          {bookingsLoading ? (
            <p className="px-6 py-16 text-center text-sm text-ink-500">Loading booking requests…</p>
          ) : bookingsError ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-rose-700" role="alert">{bookingsError}</p>
              <p className="mt-2 text-xs text-ink-400">Check that the admin-access migration has been applied and this user has the admin role.</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-gold" aria-hidden="true" />
              <p className="mt-4 font-serif text-2xl text-ink-900">No matching requests</p>
              <p className="mt-2 text-sm text-ink-500">
                {bookings.length === 0 ? 'New booking requests will appear here.' : 'Try a different status or search term.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-paper-warm text-[0.65rem] uppercase tracking-[0.18em] text-ink-400">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">Guest</th>
                    <th scope="col" className="px-6 py-4 font-medium">Residence & dates</th>
                    <th scope="col" className="px-6 py-4 font-medium">Guests</th>
                    <th scope="col" className="px-6 py-4 font-medium">Status</th>
                    <th scope="col" className="px-6 py-4 font-medium">Payment</th>
                    <th scope="col" className="px-6 py-4 font-medium">Request date</th>
                    <th scope="col" className="px-6 py-4 font-medium">Manage status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-medium text-ink-900">{booking.guest_name}</p>
                        {booking.booking_reference && <p className="mt-1 font-mono text-xs text-gold-deep">{booking.booking_reference}</p>}
                        <a href={`mailto:${booking.guest_email}`} className="mt-1 block text-sm text-ink-500 hover:text-gold">
                          {booking.guest_email}
                        </a>
                        <a href={`tel:${booking.guest_phone}`} className="mt-1 block text-sm text-ink-500 hover:text-gold">
                          {booking.guest_phone}
                        </a>
                        {booking.notes && <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-400">{booking.notes}</p>}
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-medium text-ink-900">{getApartmentName(booking.apartment_slug)}</p>
                        <Link
                          to={`/apartments/${booking.apartment_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-gold-deep hover:text-gold"
                        >
                          View room details
                        </Link>
                        <p className="mt-1 text-sm text-ink-500">
                          {formatAdminDate(booking.check_in)} – {formatAdminDate(booking.check_out)}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-sm text-ink-700">
                        {booking.adults} {booking.adults === 1 ? 'adult' : 'adults'}
                        {booking.children > 0 && <span className="block text-xs text-ink-500">{booking.children} {booking.children === 1 ? 'child' : 'children'}</span>}
                        {booking.guest_country && <span className="mt-1 block text-xs text-ink-400">{booking.guest_country}</span>}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex whitespace-nowrap px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] ${statusStyles[booking.status]}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm capitalize text-ink-700">{booking.payment_status.replace('_', ' ')}</p>
                        {booking.total_amount !== null && booking.currency && (
                          <p className="mt-1 text-xs text-ink-500">
                            {new Intl.NumberFormat('en', { style: 'currency', currency: booking.currency }).format(booking.total_amount)}
                          </p>
                        )}
                        {booking.payment_reference && <p className="mt-1 max-w-32 truncate font-mono text-[0.6rem] text-ink-400" title={booking.payment_reference}>{booking.payment_reference}</p>}
                        {booking.hold_expires_at && booking.status === 'awaiting_payment' && (
                          <p className="mt-1 text-[0.65rem] text-ink-400">Hold expires {new Date(booking.hold_expires_at).toLocaleString()}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-ink-500">
                        {new Date(booking.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          disabled={updatingId === booking.id}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setSelectedBookingStatus(statusDrafts[booking.id] ?? booking.status);
                            setActionError('');
                          }}
                          className="border border-ink-200 px-3 py-2 text-xs text-ink-700 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </>
        ) : (
          <AdminDashboard bookings={bookings} onNavigate={navigate} />
        )}
      </div>
      </div>
      <AdminModal
        open={Boolean(selectedBooking)}
        title="Update booking status"
        description={selectedBooking ? `${selectedBooking.guest_name} · ${getApartmentName(selectedBooking.apartment_slug)}` : undefined}
        onClose={() => {
          if (!updatingId) setSelectedBooking(null);
        }}
      >
        {selectedBooking && (
          <div className="space-y-5">
            {selectedBooking.booking_reference && (
              <p className="font-mono text-sm text-gold-deep">Reference: {selectedBooking.booking_reference}</p>
            )}
            <dl className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-2">
              <div><dt className="eyebrow">Check-in</dt><dd className="mt-1 text-sm text-ink-900">{formatAdminDate(selectedBooking.check_in)}</dd></div>
              <div><dt className="eyebrow">Check-out</dt><dd className="mt-1 text-sm text-ink-900">{formatAdminDate(selectedBooking.check_out)}</dd></div>
              <div><dt className="eyebrow">Guest composition</dt><dd className="mt-1 text-sm text-ink-900">{selectedBooking.adults} adults, {selectedBooking.children} children</dd></div>
              <div><dt className="eyebrow">Country</dt><dd className="mt-1 text-sm text-ink-900">{selectedBooking.guest_country ?? 'Not provided'}</dd></div>
              <div><dt className="eyebrow">Estimated arrival</dt><dd className="mt-1 text-sm text-ink-900">{selectedBooking.estimated_arrival_time ?? 'Not provided'}</dd></div>
              <div><dt className="eyebrow">Policies accepted</dt><dd className="mt-1 text-sm text-ink-900">{selectedBooking.policies_accepted_at ? `${new Date(selectedBooking.policies_accepted_at).toLocaleString()} (${selectedBooking.policy_version ?? 'version not recorded'})` : 'Not recorded'}</dd></div>
              <div className="sm:col-span-2"><dt className="eyebrow">House rules accepted</dt><dd className="mt-2 text-sm text-ink-700">{selectedBooking.accepted_house_rules.length ? <ul className="list-disc space-y-1 pl-5">{selectedBooking.accepted_house_rules.map((rule) => <li key={`${rule.id}-${rule.revision}`}>{rule.category}: {rule.title} (revision {rule.revision})</li>)}</ul> : 'No published rules were in force when this reservation was created.'}</dd></div>
              <div><dt className="eyebrow">Payment state</dt><dd className="mt-1 text-sm capitalize text-ink-900">{selectedBooking.payment_status.replace('_', ' ')}</dd></div>
            </dl>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
              Booking status
              <select value={selectedBookingStatus} onChange={(event) => setSelectedBookingStatus(event.target.value as BookingStatus)} className="mt-2 w-full border border-ink-200 bg-paper px-3 py-3 text-sm capitalize text-ink-900 outline-none focus:border-gold">
                {bookingStatuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {!['paid', 'paid_unassigned'].includes(selectedBooking.payment_status) && selectedBookingStatus === 'confirmed' && (
                <p className="mt-2 text-xs text-amber-800">Online payment is not configured. Confirm manually only after you have checked availability and agreed payment arrangements with the guest.</p>
              )}
              {selectedBooking.payment_status === 'paid_unassigned' && (
                <p className="mt-2 text-xs text-rose-700">Payment is verified but the original date hold expired. Confirm only after the team resolves availability.</p>
              )}
            </label>
            {actionError && <p className="text-sm text-rose-700" role="alert">{actionError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" disabled={Boolean(updatingId)} onClick={() => void saveSelectedBookingStatus()} className="btn-gold px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">
                {updatingId ? 'Saving…' : 'Save status'}
              </button>
              <button type="button" disabled={Boolean(updatingId)} onClick={() => setSelectedBooking(null)} className="btn-outline px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">Cancel</button>
            </div>
          </div>
        )}
      </AdminModal>
    </main>
  );
}
