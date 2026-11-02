import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Building2, CalendarDays, Check, Clock3, LogOut, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apartments } from '@/data/apartments';
import { supabase } from '@/lib/supabase';

const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'] as const;
type BookingStatus = (typeof bookingStatuses)[number];
type StatusFilter = 'all' | BookingStatus;

const bookingRequestSchema = z.array(
  z.object({
    id: z.string(),
    apartment_slug: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    guests: z.number(),
    guest_name: z.string(),
    guest_email: z.string(),
    guest_phone: z.string(),
    notes: z.string(),
    status: z.enum(bookingStatuses),
    created_at: z.string(),
  }),
);
type BookingRequest = z.infer<typeof bookingRequestSchema>[number];

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-gold/15 text-ink-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  checked_in: 'bg-sky-100 text-sky-800',
  checked_out: 'bg-ink-100 text-ink-600',
};

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getApartmentName(slug: string): string {
  return apartments.find((apartment) => apartment.slug === slug)?.name ?? slug;
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, BookingStatus>>({});
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  const isAdmin = session?.user.app_metadata.role === 'admin';

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    };

    void loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError('');
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setBookings([]);
      return;
    }

    let active = true;
    const loadBookings = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      const { data, error } = await supabase
        .from('booking_requests')
        .select('id, apartment_slug, check_in, check_out, guests, guest_name, guest_email, guest_phone, notes, status, created_at')
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
      setBookingsLoading(false);
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
        [booking.guest_name, booking.guest_email, getApartmentName(booking.apartment_slug)]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesStatus && matchesSearch;
    });
  }, [bookings, filter, search]);

  const summary = [
    { label: 'Total requests', value: bookings.length, icon: CalendarDays },
    { label: 'Awaiting review', value: bookings.filter((booking) => booking.status === 'pending').length, icon: Clock3 },
    { label: 'Confirmed stays', value: bookings.filter((booking) => booking.status === 'confirmed').length, icon: Check },
  ];

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setSigningIn(false);
  }

  async function handleSignOut() {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(`Could not sign out: ${error.message}`);
  }

  async function updateStatus(booking: BookingRequest, status: BookingStatus) {
    setUpdatingId(booking.id);
    setActionError('');
    const { error } = await supabase.from('booking_requests').update({ status }).eq('id', booking.id);
    if (error) {
      setActionError(`Could not update ${booking.guest_name}'s request: ${error.message}`);
    } else {
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, status } : item)),
      );
      setStatusDrafts((current) => ({ ...current, [booking.id]: status }));
    }
    setUpdatingId(null);
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
            <div className="mt-8 border-l-2 border-gold bg-paper-warm p-4 text-sm leading-relaxed text-ink-700" role="alert">
              This account does not have administrator access. Ask your Supabase administrator to grant the admin role.
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

  return (
    <main className="min-h-screen bg-paper-warm">
      <header className="border-b border-ink-100 bg-paper">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-5 py-5 sm:px-6 md:px-12 lg:px-16">
          <Link to="/" className="inline-flex items-center gap-3 text-ink-900" aria-label="DEMI Apartment home">
            <span className="flex h-10 w-10 items-center justify-center border border-gold/50">
              <Building2 className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg tracking-[0.2em]">DEMI</span>
              <span className="mt-1 text-[0.55rem] tracking-[0.35em] text-ink-400">ADMINISTRATION</span>
            </span>
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <span className="hidden max-w-[30vw] truncate text-sm text-ink-500 sm:block">{session.user.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex shrink-0 items-center gap-2 border border-ink-200 px-3 py-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-ink-700 transition-colors hover:border-gold hover:text-gold sm:px-4 sm:text-xs sm:tracking-[0.16em]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 md:px-12 md:py-16 lg:px-16">
        {authError && <p className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{authError}</p>}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Reservations</p>
            <h1 className="display mt-3 text-[clamp(2rem,8vw,3rem)] text-ink-900">Booking requests</h1>
            <p className="mt-3 text-sm text-ink-500">Review enquiries and update each guest’s booking status.</p>
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
              <span className="sr-only">Search guest or residence</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest or residence"
                className="w-full border border-ink-100 bg-paper-warm py-2.5 pl-10 pr-3 text-sm text-ink-900 outline-none focus:border-gold"
              />
            </label>
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
              <table className="w-full min-w-[860px] text-left">
                <thead className="bg-paper-warm text-[0.65rem] uppercase tracking-[0.18em] text-ink-400">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">Guest</th>
                    <th scope="col" className="px-6 py-4 font-medium">Residence & dates</th>
                    <th scope="col" className="px-6 py-4 font-medium">Guests</th>
                    <th scope="col" className="px-6 py-4 font-medium">Status</th>
                    <th scope="col" className="px-6 py-4 font-medium">Request date</th>
                    <th scope="col" className="px-6 py-4 font-medium">Manage status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-medium text-ink-900">{booking.guest_name}</p>
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
                          {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-sm text-ink-700">{booking.guests}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex whitespace-nowrap px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] ${statusStyles[booking.status]}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-ink-500">
                        {new Date(booking.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <label className="sr-only" htmlFor={`status-${booking.id}`}>
                            Change status for {booking.guest_name}
                          </label>
                          <select
                            id={`status-${booking.id}`}
                            value={statusDrafts[booking.id] ?? booking.status}
                            onChange={(event) =>
                              setStatusDrafts((current) => ({
                                ...current,
                                [booking.id]: event.target.value as BookingStatus,
                              }))
                            }
                            disabled={updatingId === booking.id}
                            className="min-w-32 border border-ink-200 bg-paper px-2 py-2 text-xs capitalize text-ink-800 outline-none focus:border-gold disabled:opacity-50"
                          >
                            {bookingStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={
                              updatingId === booking.id ||
                              (statusDrafts[booking.id] ?? booking.status) === booking.status
                            }
                            onClick={() =>
                              void updateStatus(booking, statusDrafts[booking.id] ?? booking.status)
                            }
                            className="border border-ink-200 px-3 py-2 text-xs text-ink-700 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {updatingId === booking.id ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
