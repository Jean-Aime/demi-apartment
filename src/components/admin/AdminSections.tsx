import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Plus, RefreshCw, Save, Search } from 'lucide-react';
import type { Apartment } from '@/data/apartments';
import { bookingStatuses, formatAdminDate, type BookingRequest, type BookingStatus } from '@/lib/admin';
import {
  apartmentToRecord,
  fetchManagedApartments,
  type ManagedApartment,
} from '@/lib/propertyApartments';
import { uploadPropertyImage } from '@/lib/propertyContent';
import { supabase } from '@/lib/supabase';
import AdminModal from '@/components/admin/AdminModal';

const fieldClass = 'mt-2 w-full border border-ink-200 bg-paper px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-gold';
const labelClass = 'block text-xs font-medium uppercase tracking-[0.12em] text-ink-500';

interface AdminSectionProps {
  bookings: BookingRequest[];
  onNavigate: (path: string) => void;
}

function PageTitle({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-2 text-3xl text-ink-900 md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">{intro}</p>
    </div>
  );
}

export function AdminDashboard({ bookings, onNavigate }: AdminSectionProps) {
  const pending = bookings.filter((booking) => ['pending', 'awaiting_payment'].includes(booking.status)).length;
  const confirmed = bookings.filter((booking) => ['confirmed', 'checked_in'].includes(booking.status)).length;
  const activeGuests = new Set(
    bookings.filter((booking) => !['cancelled', 'expired', 'checked_out'].includes(booking.status))
      .map((booking) => booking.guest_email.toLowerCase()),
  ).size;
  const cards = [
    { title: 'Booking requests', value: bookings.length, to: '/admin/bookings' },
    { title: 'Awaiting action', value: pending, to: '/admin/bookings' },
    { title: 'Confirmed stays', value: confirmed, to: '/admin/calendar' },
    { title: 'Payment resolution needed', value: bookings.filter((booking) => booking.payment_status === 'paid_unassigned').length, to: '/admin/bookings' },
    { title: 'Active guest records', value: activeGuests, to: '/admin/guests' },
  ];

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="DEMI administration" title="Overview" intro="A clear view of your booking activity and property." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <button key={card.title} type="button" onClick={() => onNavigate(card.to)} className="border border-ink-100 bg-paper p-5 text-left transition-colors hover:border-gold">
            <p className="text-sm text-ink-500">{card.title}</p>
            <p className="mt-4 font-serif text-4xl text-ink-900">{card.value}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-ink-100 bg-paper p-6">
          <h2 className="font-serif text-2xl text-ink-900">Recent requests</h2>
          {bookings.slice(0, 5).length ? (
            <ul className="mt-5 divide-y divide-ink-100">
              {bookings.slice(0, 5).map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{booking.guest_name}</p>
                    <p className="mt-1 text-xs text-ink-500">{formatAdminDate(booking.check_in)} – {formatAdminDate(booking.check_out)}</p>
                  </div>
                  <span className="shrink-0 text-xs capitalize text-ink-500">{booking.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-ink-500">Booking requests will appear here.</p>}
        </section>
        <section className="border border-ink-100 bg-paper p-6">
          <h2 className="font-serif text-2xl text-ink-900">Property tools</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Manage residences', '/admin/apartments'],
              ['View calendar', '/admin/calendar'],
              ['Guest records', '/admin/guests'],
              ['Reports', '/admin/reports'],
              ['Property settings', '/admin/settings'],
            ].map(([label, path]) => (
              <button key={path} type="button" onClick={() => onNavigate(path)} className="flex items-center justify-between border border-ink-100 px-4 py-3 text-left text-sm text-ink-700 hover:border-gold">
                {label}<ArrowRight className="h-4 w-4 text-gold" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface ApartmentForm {
  slug: string;
  number: string;
  name: string;
  summary: string;
  photoSrc: string;
  photoAlt: string;
  photos: string;
  bedType: string;
  bedQuantity: string;
  bedDimensions: string;
  bedConfigurationVerified: boolean;
  bedrooms: string;
  bathrooms: string;
  maxOccupancy: string;
  maxOccupancyVerified: boolean;
  sizeSqm: string;
  checkIn: string;
  checkOut: string;
  minimumStay: string;
  facilities: string;
  houseRules: string;
  price: string;
  currency: string;
  published: boolean;
  bookingEnabled: boolean;
}

const emptyForm: ApartmentForm = {
  slug: '', number: '', name: '', summary: '', photoSrc: '', photoAlt: '', photos: '',
  bedType: '', bedQuantity: '', bedDimensions: '', bedConfigurationVerified: false,
  bedrooms: '', bathrooms: '', maxOccupancy: '', maxOccupancyVerified: false, sizeSqm: '',
  checkIn: '', checkOut: '', minimumStay: '', facilities: '', houseRules: '',
  price: '', currency: 'USD', published: false, bookingEnabled: false,
};

function splitLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function apartmentToForm(room: ManagedApartment): ApartmentForm {
  return {
    slug: room.slug, number: room.number, name: room.name, summary: room.summary,
    photoSrc: room.photo_src, photoAlt: room.photo_alt,
    photos: room.photos.map((photo) => `${photo.src}|${photo.alt}`).join('\n'),
    bedType: room.bed_type ?? '',
    bedQuantity: room.bed_quantity?.toString() ?? '',
    bedDimensions: room.bed_dimensions ?? '',
    bedConfigurationVerified: room.bed_configuration_verified,
    bedrooms: room.bedrooms?.toString() ?? '',
    bathrooms: room.bathrooms?.toString() ?? '',
    maxOccupancy: room.max_occupancy?.toString() ?? '',
    maxOccupancyVerified: room.max_occupancy_verified,
    sizeSqm: room.size_sqm?.toString() ?? '',
    checkIn: room.check_in ?? '', checkOut: room.check_out ?? '',
    minimumStay: room.minimum_stay?.toString() ?? '',
    facilities: room.facilities.join('\n'), houseRules: room.house_rules.join('\n'),
    price: room.starting_price_amount?.toString() ?? '',
    currency: room.starting_price_currency ?? 'USD', published: room.published,
    bookingEnabled: room.booking_enabled,
  };
}

function nullableNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function formToApartment(form: ApartmentForm): Apartment {
  const galleryPhotos = splitLines(form.photos).map((line) => {
    const [src = '', ...altParts] = line.split('|');
    return { src: src.trim(), alt: altParts.join('|').trim() };
  }).filter((photo) => photo.src);

  const price = nullableNumber(form.price);
  const bedConfiguration = [
    form.bedQuantity.trim(),
    form.bedType.trim(),
    form.bedDimensions.trim() ? `(${form.bedDimensions.trim()})` : '',
  ].filter(Boolean).join(' ');
  return {
    slug: form.slug.trim().toLowerCase(),
    number: form.number.trim(),
    name: form.name.trim(),
    summary: form.summary.trim(),
    photo: { src: form.photoSrc.trim(), alt: form.photoAlt.trim() },
    photos: galleryPhotos.length ? galleryPhotos : [{ src: form.photoSrc.trim(), alt: form.photoAlt.trim() }],
    bedConfiguration: bedConfiguration || undefined,
    bedrooms: nullableNumber(form.bedrooms),
    bathrooms: nullableNumber(form.bathrooms),
    maxOccupancy: nullableNumber(form.maxOccupancy),
    sizeSqm: nullableNumber(form.sizeSqm),
    checkIn: form.checkIn.trim() || undefined,
    checkOut: form.checkOut.trim() || undefined,
    minimumStay: nullableNumber(form.minimumStay),
    facilities: splitLines(form.facilities),
    houseRules: splitLines(form.houseRules),
    startingPrice: price === undefined ? undefined : { amount: price, currency: form.currency.trim() || 'USD' },
    bookingEnabled: form.bookingEnabled,
  };
}

export function AdminApartments() {
  const [rooms, setRooms] = useState<ManagedApartment[]>([]);
  const [form, setForm] = useState<ApartmentForm>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetCount, setResetCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchManagedApartments()
      .then((items) => { if (active) { setRooms(items); setError(''); } })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load residence data.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resetCount]);

  function startNew() {
    setForm({ ...emptyForm, number: String(Math.max(0, ...rooms.map((room) => Number(room.number.replace(/\D/g, '')) || 0)) + 1).padStart(2, '0') });
    setNotice('');
    setError('');
    setEditorOpen(true);
  }

  async function uploadRoomImage(file: File, mainPhoto: boolean) {
    setUploadingImage(true);
    setError('');
    try {
      const url = await uploadPropertyImage(file, `rooms/${form.slug || 'new-room'}`);
      if (mainPhoto) {
        setForm((current) => ({ ...current, photoSrc: url }));
      } else {
        setForm((current) => ({
          ...current,
          photos: [current.photos, `${url}|`].filter(Boolean).join('\n'),
        }));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload this room photo.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveApartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim().toLowerCase())) {
      setError('Use a lowercase URL-safe slug, such as residence-10.');
      return;
    }
    if (!form.number.trim() || !form.name.trim() || !form.photoSrc.trim() || !form.photoAlt.trim()) {
      setError('Room number, name, main photo URL, and photo description are required.');
      return;
    }
    if (splitLines(form.photos).some((line) => {
      const separatorIndex = line.indexOf('|');
      return separatorIndex < 0 || !line.slice(separatorIndex + 1).trim();
    })) {
      setError('Add a meaningful photo description after the | separator for each gallery image.');
      return;
    }
    const capacity = nullableNumber(form.maxOccupancy);
    const rate = nullableNumber(form.price);
    if (form.bookingEnabled && (
      !capacity || capacity > 20 || !form.maxOccupancyVerified ||
      !form.bedConfigurationVerified || !form.bedType.trim() ||
      !nullableNumber(form.bedQuantity) || !form.bedDimensions.trim() ||
      nullableNumber(form.bedrooms) === undefined || nullableNumber(form.bathrooms) === undefined ||
      !rate || rate <= 0 || !form.currency.trim() || !form.checkIn.trim() || !form.checkOut.trim()
    )) {
      setError('Online booking needs verified bed type, quantity, dimensions and maximum occupancy, bedroom and bathroom counts, a positive nightly rate, photos, and check-in/check-out times.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const record = apartmentToRecord(formToApartment(form), form.published, {
        bedType: form.bedType.trim(),
        bedQuantity: nullableNumber(form.bedQuantity),
        bedDimensions: form.bedDimensions.trim(),
        bedConfigurationVerified: form.bedConfigurationVerified,
        maxOccupancyVerified: form.maxOccupancyVerified,
      });
      const { error: saveError } = await supabase.from('property_apartments').upsert(record, { onConflict: 'slug' });
      if (saveError) throw new Error(saveError.message);
      setNotice('Residence saved. Published changes will appear on the public website.');
      setForm(emptyForm);
      setEditorOpen(false);
      setResetCount((count) => count + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this residence.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow="Property" title="Residence management" intro="Edit room details, photos, amenities, prices and publication status. Changes are shared with public pages." />
        <button type="button" onClick={startNew} className="btn-gold inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.12em]">
          <Plus className="h-4 w-4" aria-hidden="true" />New residence
        </button>
      </div>

      {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}. Apply the latest Supabase migration if the table is missing.</p>}
      {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}

      <AdminModal
        open={editorOpen}
        size="xl"
        title={form.slug && rooms.some((room) => room.slug === form.slug) ? `Edit ${form.name || form.slug}` : 'New residence'}
        description="Update residence details. Published changes are reflected on the public website."
        onClose={() => {
          if (!saving) setEditorOpen(false);
        }}
      >
        <form onSubmit={saveApartment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>Slug<input required disabled={rooms.some((room) => room.slug === form.slug)} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="residence-10" className={fieldClass} /></label>
          <label className={labelClass}>Room number<input required value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Display name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label>
          <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>Description<textarea rows={2} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Main photo URL<input required value={form.photoSrc} onChange={(event) => setForm({ ...form, photoSrc: event.target.value })} placeholder="/IMG_8664.JPG.jpeg" className={fieldClass} /></label>
          <label className={labelClass}>Upload main photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadRoomImage(file, true); event.currentTarget.value = ''; }} className={fieldClass} /><span className="mt-1 block text-[0.65rem] normal-case text-ink-400">JPG, PNG, or WebP up to 5 MB.</span></label>
          <label className={labelClass}>Main photo description<input required value={form.photoAlt} onChange={(event) => setForm({ ...form, photoAlt: event.target.value })} className={fieldClass} /></label>
          <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>Gallery photos (one per line: URL | description)<textarea rows={3} value={form.photos} onChange={(event) => setForm({ ...form, photos: event.target.value })} className={fieldClass} /><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadRoomImage(file, false); event.currentTarget.value = ''; }} className={fieldClass} aria-label="Upload an additional room photo" /></label>
          <label className={labelClass}>Bed type<input value={form.bedType} onChange={(event) => setForm({ ...form, bedType: event.target.value })} placeholder="Pending Verification" className={fieldClass} /></label>
          <label className={labelClass}>Bed quantity<input type="number" min="1" step="1" value={form.bedQuantity} onChange={(event) => setForm({ ...form, bedQuantity: event.target.value })} placeholder="Pending Verification" className={fieldClass} /></label>
          <label className={labelClass}>Bed dimensions<input value={form.bedDimensions} onChange={(event) => setForm({ ...form, bedDimensions: event.target.value })} placeholder="Pending Verification" className={fieldClass} /></label>
          <label className="flex items-center gap-3 text-sm text-ink-700 sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={form.bedConfigurationVerified} onChange={(event) => setForm({ ...form, bedConfigurationVerified: event.target.checked })} className="h-4 w-4 accent-[#B8954A]" />I verified this room’s bed type, quantity and dimensions</label>
          <label className={labelClass}>Bedrooms<input type="number" min="0" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Bathrooms<input type="number" min="0" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Maximum occupancy<input type="number" min="1" max="20" value={form.maxOccupancy} onChange={(event) => setForm({ ...form, maxOccupancy: event.target.value })} className={fieldClass} /></label>
          <label className="flex items-center gap-3 text-sm text-ink-700 sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={form.maxOccupancyVerified} onChange={(event) => setForm({ ...form, maxOccupancyVerified: event.target.checked })} className="h-4 w-4 accent-[#B8954A]" />I verified this room’s maximum occupancy</label>
          <label className={labelClass}>Size (m²)<input type="number" min="1" step="0.1" value={form.sizeSqm} onChange={(event) => setForm({ ...form, sizeSqm: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Minimum stay (nights)<input type="number" min="1" value={form.minimumStay} onChange={(event) => setForm({ ...form, minimumStay: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Check-in<input value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} placeholder="15:00" className={fieldClass} /></label>
          <label className={labelClass}>Check-out<input value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} placeholder="11:00" className={fieldClass} /></label>
          <label className={labelClass}>Nightly price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Currency<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className={fieldClass}><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
          <p className="border-l-2 border-gold bg-paper-warm px-4 py-3 text-xs leading-relaxed text-ink-600 sm:col-span-2 lg:col-span-3">Manage verified room/shared amenities in “Amenities” and approved property policies in “House rules”. Older room text fields are not shown publicly.</p>
          <label className="flex items-center gap-3 text-sm text-ink-700 sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={form.bookingEnabled} onChange={(event) => setForm({ ...form, bookingEnabled: event.target.checked })} className="h-4 w-4 accent-[#B8954A]" />Enable online reservations for this room</label>
          <p className="text-xs text-ink-500 sm:col-span-2 lg:col-span-3">Online reservations require verified bed type, quantity, dimensions and maximum occupancy, plus room counts, price, photos, and check-in/check-out times. Dates are still checked against confirmed stays and admin-blocked dates.</p>
          <label className="flex items-center gap-3 text-sm text-ink-700 sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked, bookingEnabled: event.target.checked ? form.bookingEnabled : false })} className="h-4 w-4 accent-[#B8954A]" />Published on the public website</label>
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={saving || uploadingImage} className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{uploadingImage ? 'Uploading image…' : saving ? 'Saving…' : 'Save residence'}</button>
            <button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="btn-outline px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">Cancel</button>
          </div>
        </form>
      </AdminModal>

      <section className="border border-ink-100 bg-paper">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-serif text-2xl text-ink-900">All residences ({rooms.length})</h2>
          <button type="button" onClick={() => setResetCount((count) => count + 1)} className="inline-flex items-center gap-2 text-xs text-ink-600 hover:text-gold"><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</button>
        </div>
        {loading ? <p className="p-6 text-sm text-ink-500">Loading residences…</p> : (
          <ul className="divide-y divide-ink-100">
            {rooms.map((room) => (
              <li key={room.slug} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-4">
                  <img src={room.photo_src} alt="" className="h-14 w-16 shrink-0 object-cover" />
                  <div className="min-w-0"><p className="truncate font-medium text-ink-900">{room.name}</p><p className="mt-1 text-xs text-ink-500">{room.slug} · {room.published ? 'Published' : 'Unpublished'} · {room.booking_enabled ? 'Online booking enabled' : 'Online booking disabled'} · Bed details: {room.bed_configuration_verified ? 'Verified' : 'Pending Verification'} · Occupancy: {room.max_occupancy_verified ? 'Verified' : 'Pending Verification'}</p></div>
                </div>
                <button type="button" onClick={() => { setForm(apartmentToForm(room)); setNotice(''); setError(''); setEditorOpen(true); }} className="btn-outline px-4 py-2 text-xs uppercase tracking-[0.1em]">Edit</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AdminCalendar({ bookings }: Pick<AdminSectionProps, 'bookings'>) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? day : null;
  });
  const monthBookings = bookings.filter((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'expired') return false;
    const start = new Date(`${booking.check_in}T00:00:00`);
    const end = new Date(`${booking.check_out}T00:00:00`);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return start <= endOfMonth && end >= month;
  });

  function bookingsForDay(day: number) {
    const isoDay = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthBookings.filter((booking) => booking.check_in <= isoDay && booking.check_out > isoDay);
  }

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Reservations" title="Booking calendar" intro="Confirmed and requested stays stored in this website’s booking database." />
      <div className="border border-ink-100 bg-paper p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => setMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="border border-ink-100 p-2 hover:border-gold"><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="font-serif text-2xl text-ink-900">{month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</h2>
          <button type="button" aria-label="Next month" onClick={() => setMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="border border-ink-100 p-2 hover:border-gold"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-ink-100 pb-2 text-center text-xs uppercase text-ink-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => (
            <div key={index} className="min-h-20 border-b border-r border-ink-100 p-1 sm:min-h-28 sm:p-2">
              {day && <><span className="text-xs text-ink-500">{day}</span><div className="mt-1 space-y-1">{bookingsForDay(day).slice(0, 2).map((booking) => <span key={booking.id} title={`${booking.guest_name} · ${booking.apartment_slug}`} className={`block truncate px-1 py-1 text-[0.6rem] sm:text-xs ${booking.status === 'pending' || booking.status === 'awaiting_payment' ? 'bg-gold/20 text-ink-800' : booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>{booking.guest_name}</span>)}</div></>}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-500">Note: this calendar does not yet include Airbnb or Booking.com stays unless they are synchronized into Supabase.</p>
      </div>
    </div>
  );
}

export function AdminGuests({ bookings }: Pick<AdminSectionProps, 'bookings'>) {
  const [search, setSearch] = useState('');
  const guests = useMemo(() => {
    const byEmail = new Map<string, BookingRequest[]>();
    bookings.forEach((booking) => {
      const key = booking.guest_email.toLowerCase();
      byEmail.set(key, [...(byEmail.get(key) ?? []), booking]);
    });
    const normalized = search.trim().toLowerCase();
    return [...byEmail.entries()].filter(([email, stays]) =>
      !normalized || email.includes(normalized) || stays.some((stay) => stay.guest_name.toLowerCase().includes(normalized)),
    );
  }, [bookings, search]);

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Guests" title="Guest records" intro="Guest contacts are derived from submitted booking requests; no separate guest profiles are stored." />
      <label className="relative block max-w-md"><span className="sr-only">Search guests</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className={`${fieldClass} pl-10`} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        {guests.map(([email, stays]) => {
          const guest = stays[0];
          return <article key={email} className="border border-ink-100 bg-paper p-5"><h2 className="font-serif text-xl text-ink-900">{guest.guest_name}</h2><a href={`mailto:${guest.guest_email}`} className="mt-1 block break-all text-sm text-gold-deep">{guest.guest_email}</a><a href={`tel:${guest.guest_phone}`} className="mt-1 block text-sm text-ink-500">{guest.guest_phone}</a><p className="mt-4 text-xs uppercase tracking-[0.1em] text-ink-400">{stays.length} booking {stays.length === 1 ? 'request' : 'requests'}</p><ul className="mt-3 space-y-2 border-t border-ink-100 pt-3">{stays.map((stay) => <li key={stay.id} className="flex justify-between gap-3 text-xs text-ink-600"><span>{formatAdminDate(stay.check_in)} – {formatAdminDate(stay.check_out)}</span><span className="capitalize">{stay.status.replace('_', ' ')}</span></li>)}</ul></article>;
        })}
        {guests.length === 0 && <p className="text-sm text-ink-500">No guest records match your search.</p>}
      </div>
    </div>
  );
}

export function AdminReports({ bookings }: Pick<AdminSectionProps, 'bookings'>) {
  const totalNights = bookings.reduce((total, booking) => {
    if (['cancelled', 'expired'].includes(booking.status)) return total;
    const nights = (new Date(`${booking.check_out}T00:00:00`).getTime() - new Date(`${booking.check_in}T00:00:00`).getTime()) / 86_400_000;
    return total + Math.max(0, nights);
  }, 0);
  const confirmed = bookings.filter((booking) => ['confirmed', 'checked_in', 'checked_out'].includes(booking.status));
  const verifiedRevenue = (currency: 'USD' | 'EUR') => bookings
    .filter((booking) => ['paid', 'paid_unassigned'].includes(booking.payment_status) && booking.currency === currency)
    .reduce((total, booking) => total + (booking.total_amount ?? 0), 0);
  const metrics = [
    ['Total requests', bookings.length],
    ['Confirmed / completed stays', confirmed.length],
    ['Requested or confirmed nights', totalNights],
    ['Distinct guests', new Set(bookings.map((booking) => booking.guest_email.toLowerCase())).size],
    ['Verified revenue (USD)', new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(verifiedRevenue('USD'))],
    ['Verified revenue (EUR)', new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(verifiedRevenue('EUR'))],
  ];

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Insights" title="Booking reports" intro="Summary metrics from website booking requests. OTA bookings and revenue are not included." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <section key={label} className="border border-ink-100 bg-paper p-5"><p className="text-sm text-ink-500">{label}</p><p className="mt-4 font-serif text-4xl text-ink-900">{value}</p></section>)}</div>
      <section className="border border-ink-100 bg-paper p-5"><h2 className="font-serif text-2xl text-ink-900">Bookings by status</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{bookingStatuses.map((status: BookingStatus) => <li key={status} className="flex justify-between border-b border-ink-100 py-2 text-sm"><span className="capitalize text-ink-600">{status.replace('_', ' ')}</span><strong className="font-medium text-ink-900">{bookings.filter((booking) => booking.status === status).length}</strong></li>)}</ul><p className="mt-4 text-xs text-ink-400">Revenue includes only server-verified direct website payments; Airbnb and Booking.com figures are not imported.</p></section>
    </div>
  );
}

interface PropertySettings {
  email: string;
  phone: string;
  address: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<PropertySettings>({ email: '', phone: '', address: '' });
  const [formSettings, setFormSettings] = useState<PropertySettings>({ email: '', phone: '', address: '' });
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const client = supabase;
    if (!client) { setError('Supabase is not configured.'); setLoading(false); return; }
    const loadSettings = async () => {
      try {
        const { data, error: queryError } = await client
          .from('property_settings')
          .select('contact_email, contact_phone, contact_address')
          .eq('id', 1)
          .maybeSingle();
        if (!active) return;
        if (queryError) setError(`Could not load property settings: ${queryError.message}`);
        else if (data) {
          const nextSettings = { email: data.contact_email ?? '', phone: data.contact_phone ?? '', address: data.contact_address ?? '' };
          setSettings(nextSettings);
          setFormSettings(nextSettings);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load property settings.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSettings();
    return () => { active = false; };
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const { error: saveError } = await supabase.from('property_settings').upsert({
        id: 1, contact_email: formSettings.email.trim(), contact_phone: formSettings.phone.trim(),
        contact_address: formSettings.address.trim(), updated_at: new Date().toISOString(),
      });
      if (saveError) throw new Error(saveError.message);
      setSettings(formSettings);
      setNotice('Property contact settings saved.');
      setEditorOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Configuration" title="Property settings" intro="Maintain contact details shown on the public website." />
      {error && <p className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}. Apply the latest property management migration if the settings table is missing.</p>}
      {notice && <p className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      <section className="flex max-w-2xl flex-col gap-5 border border-ink-100 bg-paper p-6 sm:flex-row sm:items-end sm:justify-between">
        <dl className="space-y-4">
          <div><dt className={labelClass}>Contact email</dt><dd className="mt-1 break-all text-sm text-ink-900">{loading ? 'Loading…' : settings.email || 'Not set'}</dd></div>
          <div><dt className={labelClass}>Telephone</dt><dd className="mt-1 text-sm text-ink-900">{settings.phone || 'Not set'}</dd></div>
          <div><dt className={labelClass}>Address</dt><dd className="mt-1 text-sm text-ink-900">{settings.address || 'Not set'}</dd></div>
        </dl>
        <button type="button" disabled={loading} onClick={() => { setFormSettings(settings); setEditorOpen(true); setError(''); }} className="btn-outline px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">Edit settings</button>
      </section>
      <AdminModal open={editorOpen} title="Edit property settings" description="Changes are displayed in the public contact page and footer." onClose={() => { if (!saving) setEditorOpen(false); }}>
        <form onSubmit={saveSettings} className="space-y-5">
          <label className={labelClass}>Contact email<input type="email" required value={formSettings.email} onChange={(event) => setFormSettings({ ...formSettings, email: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Telephone<input required value={formSettings.phone} onChange={(event) => setFormSettings({ ...formSettings, phone: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Address<input required value={formSettings.address} onChange={(event) => setFormSettings({ ...formSettings, address: event.target.value })} className={fieldClass} /></label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving…' : 'Save settings'}</button>
            <button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="btn-outline px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">Cancel</button>
          </div>
        </form>
      </AdminModal>
      <p className="max-w-2xl text-xs leading-relaxed text-ink-500">Channel manager connection, platform credentials, payments, and OTA synchronization must be configured in their respective provider accounts. Do not enter secret keys here.</p>
    </div>
  );
}
