import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { apartments as fallbackApartments, type Apartment } from '@/data/apartments';
import { bookingStatuses, formatAdminDate, type BookingRequest, type BookingStatus } from '@/lib/admin';
import {
  apartmentToRecord,
  fetchManagedApartments,
  type ManagedApartment,
} from '@/lib/propertyApartments';
import { uploadPropertyImage } from '@/lib/propertyContent';
import { supabase } from '@/lib/supabase';
import AdminModal from '@/components/admin/AdminModal';
import { fetchApartmentGroups, fetchManagedSharedFacilities, type ApartmentGroup, type SharedFacility } from '@/lib/propertyApartmentGroups';
import { notifyPropertyDataChanged } from '@/lib/propertyDataEvents';

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
  const cards = [
    { title: 'Total requests', value: bookings.length, detail: 'All reservation requests', to: '/admin/bookings', icon: CalendarDays },
    { title: 'Needs attention', value: pending, detail: 'Pending or awaiting payment', to: '/admin/bookings', icon: RefreshCw },
    { title: 'Confirmed stays', value: confirmed, detail: 'Confirmed or checked in', to: '/admin/calendar', icon: Check },
    { title: 'Payment resolution', value: bookings.filter((booking) => booking.payment_status === 'paid_unassigned').length, detail: 'Paid holds needing review', to: '/admin/bookings', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <PageTitle eyebrow="Property overview" title="Good to see you." intro="Here’s what’s happening across your bookings and property today." />
        <button type="button" onClick={() => onNavigate('/admin/bookings')} className="btn-gold inline-flex w-fit items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]">
          <ClipboardList className="h-4 w-4" aria-hidden="true" /> Review bookings
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button key={card.title} type="button" onClick={() => onNavigate(card.to)} className="group border border-ink-100 bg-paper p-5 text-left shadow-[0_8px_24px_rgba(27,25,20,0.025)] transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[0_16px_34px_rgba(27,25,20,0.07)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-10 w-10 items-center justify-center bg-paper-warm text-gold-deep">
                <card.icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <ArrowRight className="mt-1 h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-gold-deep" aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm font-medium text-ink-600">{card.title}</p>
            <p className="mt-1 font-serif text-4xl leading-none text-ink-900">{card.value}</p>
            <p className="mt-3 text-xs text-ink-400">{card.detail}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <section className="border border-ink-100 bg-paper shadow-[0_8px_24px_rgba(27,25,20,0.025)]">
          <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-5 sm:px-6">
            <div>
              <p className="eyebrow text-gold-deep">Guest activity</p>
              <h2 className="mt-2 font-serif text-2xl text-ink-900">Recent requests</h2>
            </div>
            <button type="button" onClick={() => onNavigate('/admin/bookings')} className="link-line shrink-0 text-ink-700">
              All bookings <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          {bookings.slice(0, 5).length ? (
            <ul className="divide-y divide-ink-100 px-5 sm:px-6">
              {bookings.slice(0, 5).map((booking) => {
                const statusTone = booking.status === 'confirmed' || booking.status === 'checked_in'
                  ? 'bg-emerald-50 text-emerald-800'
                  : booking.status === 'cancelled' || booking.status === 'expired'
                    ? 'bg-ink-100 text-ink-600'
                    : booking.status === 'awaiting_payment'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-gold/15 text-ink-800';
                return (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{booking.guest_name}</p>
                    <p className="mt-1 text-xs text-ink-500">{booking.booking_reference ?? fallbackApartments.find((room) => room.slug === booking.apartment_slug)?.name ?? booking.apartment_slug} · {formatAdminDate(booking.check_in)} – {formatAdminDate(booking.check_out)}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${statusTone}`}>{booking.status.replace('_', ' ')}</span>
                </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-gold" aria-hidden="true" />
              <p className="mt-4 font-serif text-xl text-ink-900">A quiet moment</p>
              <p className="mt-1 text-sm text-ink-500">New booking requests will appear here.</p>
            </div>
          )}
        </section>
        <section className="border border-ink-100 bg-paper shadow-[0_8px_24px_rgba(27,25,20,0.025)]">
          <div className="border-b border-ink-100 px-5 py-5 sm:px-6">
            <p className="eyebrow text-gold-deep">Shortcuts</p>
            <h2 className="mt-2 font-serif text-2xl text-ink-900">Property workspace</h2>
          </div>
          <div className="divide-y divide-ink-100 px-5 sm:px-6">
            {[
              { label: 'Apartment Management', detail: 'Bedrooms and shared spaces', path: '/admin/apartments', icon: Building2 },
              { label: 'Availability calendar', detail: 'Review upcoming stays', path: '/admin/calendar', icon: CalendarDays },
              { label: 'Guest directory', detail: 'Contact and stay history', path: '/admin/guests', icon: UsersRound },
              { label: 'Reports & settings', detail: 'Property operations', path: '/admin/reports', icon: BarChart3 },
            ].map(({ label, detail, path, icon: Icon }) => (
              <button key={path} type="button" onClick={() => onNavigate(path)} className="group flex w-full items-center gap-3 py-4 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-paper-warm text-ink-500 transition-colors group-hover:text-gold-deep"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink-800">{label}</span><span className="mt-0.5 block text-xs text-ink-400">{detail}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-gold-deep" aria-hidden="true" />
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
  apartmentGroupId: string;
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
  slug: '', number: '', name: '', apartmentGroupId: '', summary: '', photoSrc: '', photoAlt: '', photos: '',
  bedType: '', bedQuantity: '', bedDimensions: '', bedConfigurationVerified: false,
  bedrooms: '', bathrooms: '', maxOccupancy: '', maxOccupancyVerified: false, sizeSqm: '',
  checkIn: '', checkOut: '', minimumStay: '', facilities: '', houseRules: '',
  price: '', currency: 'USD', published: false, bookingEnabled: false,
};

function splitLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function parsePhotoLines(value: string): { src: string; alt: string }[] {
  return splitLines(value).map((line) => {
    const [src = '', ...altParts] = line.split('|');
    return { src: src.trim(), alt: altParts.join('|').trim() };
  }).filter((photo) => photo.src);
}

function apartmentToForm(room: ManagedApartment): ApartmentForm {
  return {
    slug: room.slug, number: room.number, name: room.name, summary: room.summary,
    apartmentGroupId: room.apartment_group_id ?? '',
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
  const galleryPhotos = parsePhotoLines(form.photos);
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
  const [groups, setGroups] = useState<ApartmentGroup[]>([]);
  const [facilities, setFacilities] = useState<SharedFacility[]>([]);
  const [form, setForm] = useState<ApartmentForm>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetCount, setResetCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeGroup, setActiveGroup] = useState<'all' | 'A' | 'B' | 'C' | 'unassigned'>('all');
  const [roomSearch, setRoomSearch] = useState('');

  const publishedRooms = rooms.filter((room) => room.published);
  const onlineRooms = rooms.filter((room) => room.booking_enabled);
  const visibleRooms = rooms.filter((room) => {
    const matchesGroup = activeGroup === 'all'
      || (activeGroup === 'unassigned' ? !room.apartment_group_id : room.apartment_group?.identifier === activeGroup);
    const normalizedSearch = roomSearch.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [room.name, room.number, room.slug, room.apartment_group?.name ?? '']
      .some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesGroup && matchesSearch;
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchManagedApartments(), fetchApartmentGroups(true), fetchManagedSharedFacilities()])
      .then(([items, nextGroups, nextFacilities]) => { if (active) { setRooms(items); setGroups(nextGroups); setFacilities(nextFacilities); setError(''); } })
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

  async function uploadRoomImage(file: File) {
    setUploadingImage(true);
    setError('');
    setNotice('');
    try {
      const url = await uploadPropertyImage(file, `rooms/${form.slug || 'new-room'}`);
      setForm((current) => ({ ...current, photoSrc: url }));
      const isExistingRoom = rooms.some((room) => room.slug === form.slug);
      if (isExistingRoom) {
        const client = supabase;
        if (!client) throw new Error('Image uploaded, but Supabase is unavailable to attach it to this room.');
        const { data, error } = await client
          .from('property_apartments')
          .update({ photo_src: url })
          .eq('slug', form.slug)
          .select('slug')
          .maybeSingle();
        if (error) throw new Error(`Image uploaded, but could not attach it to this room: ${error.message}`);
        if (!data) throw new Error('Image uploaded, but the room was not found to attach it.');
        setRooms((current) => current.map((room) => room.slug === form.slug ? { ...room, photo_src: url } : room));
        notifyPropertyDataChanged();
        setNotice('Photo saved to this room and should now appear on the website. Save bedroom as well if you changed other details.');
      } else {
        setNotice('Image uploaded. Review the preview below, then select Save bedroom to attach it to the new room.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload this room photo.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadRoomGalleryImages(files: File[]) {
    if (!files.length) return;
    setUploadingImage(true);
    setError('');
    setNotice('');
    try {
      const uploadedPhotos: string[] = [];
      for (const file of files) {
        const url = await uploadPropertyImage(file, `rooms/${form.slug || 'new-room'}`);
        uploadedPhotos.push(`${url}|Bedroom photograph`);
      }
      const nextPhotos = [...parsePhotoLines(form.photos), ...parsePhotoLines(uploadedPhotos.join('\n'))];
      setForm((current) => ({ ...current, photos: nextPhotos.map((photo) => `${photo.src}|${photo.alt}`).join('\n') }));
      const isExistingRoom = rooms.some((room) => room.slug === form.slug);
      if (isExistingRoom) {
        const client = supabase;
        if (!client) throw new Error('Images uploaded, but Supabase is unavailable to attach them to this room.');
        const { data, error } = await client
          .from('property_apartments')
          .update({ photos: nextPhotos })
          .eq('slug', form.slug)
          .select('slug')
          .maybeSingle();
        if (error) throw new Error(`Images uploaded, but could not attach them to this room: ${error.message}`);
        if (!data) throw new Error('Images uploaded, but the room was not found to attach them.');
        setRooms((current) => current.map((room) => room.slug === form.slug ? { ...room, photos: nextPhotos } : room));
        notifyPropertyDataChanged();
        setNotice('Gallery photos saved to this room and should now appear on the website. Save bedroom as well if you changed other details.');
      } else {
        setNotice('Gallery images uploaded. Review them below, then select Save bedroom to attach them to the new room.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload bedroom gallery photos.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadSharedFacilityImages(files: File[], facility: SharedFacility) {
    if (!files.length) return;
    const group = groups.find((item) => item.id === facility.apartment_group_id);
    if (!group) {
      setError('Could not determine which apartment this shared-space photo belongs to.');
      return;
    }

    setUploadingImage(true);
    setError('');
    setNotice('');
    try {
      const uploadedPhotos: SharedFacility['photos'] = [];
      for (const file of files) {
        const url = await uploadPropertyImage(file, `shared/${group.identifier}/${facility.facility_type}`);
        uploadedPhotos.push({ src: url, alt: `${facility.name} photograph` });
      }
      const nextPhotos = [...facility.photos, ...uploadedPhotos];
      const client = supabase;
      if (!client) throw new Error('Photos uploaded, but Supabase is unavailable to attach them to the shared space.');
      const { data, error } = await client
        .from('property_shared_facilities')
        .update({ photos: nextPhotos, updated_at: new Date().toISOString() })
        .eq('id', facility.id)
        .select('id')
        .maybeSingle();
      if (error) throw new Error(`Photos uploaded, but could not attach them to the shared space: ${error.message}`);
      if (!data) throw new Error('Photos uploaded, but the shared space was not found to attach them.');
      setFacilities((items) => items.map((item) => item.id === facility.id
        ? { ...item, photos: nextPhotos }
        : item));
      notifyPropertyDataChanged();
      setNotice(`Photos saved to Apartment ${group.identifier}'s shared space and should now appear on the website.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload shared-space photos.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveApartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    if (!form.apartmentGroupId) { setError('Assign this bedroom to Apartment A, B or C.'); return; }
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
      }, form.apartmentGroupId);
      const { error: saveError } = await supabase.from('property_apartments').upsert(record, { onConflict: 'slug' });
      if (saveError) throw new Error(saveError.message);
      notifyPropertyDataChanged();
      setNotice('Bedroom saved. Published changes will appear on the public website.');
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
    <div className="space-y-7 lg:space-y-9">
      <section className="relative isolate overflow-hidden bg-ink-900 px-6 py-7 text-paper shadow-[0_16px_38px_rgba(27,25,20,0.12)] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(212,160,23,0.18),transparent_65%)]" />
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-light">Property management</p>
            <h1 className="display mt-4 text-4xl text-paper sm:text-5xl">Apartment Management</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/65">
              Organise your private bedrooms across three apartment groups, and manage each group&apos;s shared spaces in one place.
            </p>
          </div>
          <button type="button" onClick={startNew} className="inline-flex w-fit items-center gap-2 bg-gold px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-900 transition-colors hover:bg-gold-light">
            <Plus className="h-4 w-4" aria-hidden="true" />Add bedroom
          </button>
        </div>
        <div className="mt-8 grid grid-cols-2 border-t border-paper/15 pt-5 sm:grid-cols-4">
          {[
            { label: 'Bedrooms', value: rooms.filter((room) => room.apartment_group_id).length },
            { label: 'Apartment groups', value: groups.length },
            { label: 'Published', value: publishedRooms.length },
            { label: 'Online booking', value: onlineRooms.length },
          ].map((item, index) => (
            <div key={item.label} className={`py-2 ${index > 0 ? 'border-l border-paper/15 pl-4 sm:pl-6' : ''}`}>
              <p className="font-serif text-3xl leading-none text-paper">{loading ? '—' : item.value}</p>
              <p className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-paper/45">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}. Apply the latest Supabase migration if the table is missing.</p>}
      {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}

      <AdminModal
        open={editorOpen}
        size="xl"
        title={form.slug && rooms.some((room) => room.slug === form.slug) ? `Edit ${form.name || form.slug}` : 'Add a bedroom'}
        description="Update bedroom details. Published changes are reflected on the public website."
        onClose={() => {
          if (!saving) setEditorOpen(false);
        }}
      >
        <form onSubmit={saveApartment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2 lg:col-span-3" role="alert">{error}</p>}
          {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:col-span-2 lg:col-span-3" role="status">{notice}</p>}
          <label className={labelClass}>Slug<input required disabled={rooms.some((room) => room.slug === form.slug)} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="residence-10" className={fieldClass} /></label>
          <label className={labelClass}>Room number<input required value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Display name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Apartment group<select required value={form.apartmentGroupId} onChange={(event) => setForm({ ...form, apartmentGroupId: event.target.value })} className={fieldClass}><option value="">Select group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.identifier})</option>)}</select></label>
          <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>Description<textarea rows={2} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Main photo link<input required value={form.photoSrc} onChange={(event) => setForm({ ...form, photoSrc: event.target.value })} placeholder="Paste an image URL or /image.jpg" className={fieldClass} /><span className="mt-1 block text-[0.65rem] normal-case text-ink-400">Use a public image URL or upload a file from your device.</span></label>
          <label className={labelClass}>Upload main photo from device<input type="file" accept="image/*,.heic,.heif" disabled={uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadRoomImage(file); event.currentTarget.value = ''; }} className={fieldClass} /><span className="mt-1 block text-[0.65rem] normal-case text-ink-400">Includes HEIC/HEIF (converted to JPEG for display), up to 5 MB. Existing bedrooms save immediately; new bedrooms save when you save the room.</span></label>
          <label className={labelClass}>Main photo description<input required value={form.photoAlt} onChange={(event) => setForm({ ...form, photoAlt: event.target.value })} className={fieldClass} /></label>
          <div className="border border-ink-100 bg-paper-warm/60 p-4 sm:col-span-2 lg:col-span-3">
            <label className={labelClass}>Bedroom gallery image links<textarea rows={3} value={form.photos} onChange={(event) => setForm({ ...form, photos: event.target.value })} placeholder={'https://example.com/room.jpg | Bedroom interior'} className={fieldClass} /></label>
            <p className="mt-1 text-[0.65rem] text-ink-400">Add one publicly accessible image URL and description per line, separated by |.</p>
            <label className={`${labelClass} mt-4`}>Upload gallery images from device<input type="file" multiple accept="image/*,.heic,.heif" disabled={uploadingImage} onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); if (files.length) void uploadRoomGalleryImages(files); event.currentTarget.value = ''; }} className={fieldClass} /><span className="mt-1 block text-[0.65rem] normal-case text-ink-400">Includes HEIC/HEIF (converted to JPEG for display), up to 5 MB each. You can select multiple images.</span></label>
          </div>
          <section aria-label="Review bedroom images before saving" className="border border-ink-200 bg-paper p-4 sm:col-span-2 lg:col-span-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-gold-deep">Image review</p>
                <h3 className="mt-2 font-serif text-xl text-ink-900">Review bedroom photos</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">After reviewing uploaded photos, select Save bedroom to link them to this listing. Files uploaded directly in Supabase Storage must be added here using their public image URL.</p>
              </div>
              <span className="text-xs text-ink-400">{parsePhotoLines(form.photos).length + (form.photoSrc ? 1 : 0)} images</span>
            </div>
            {form.photoSrc || parsePhotoLines(form.photos).length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {form.photoSrc && (
                  <figure className="overflow-hidden border border-ink-100 bg-paper-warm">
                    <img src={form.photoSrc} alt={form.photoAlt || 'Bedroom main photo preview'} className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="truncate px-3 py-2 text-xs text-ink-600">Main photo · {form.photoAlt || 'Description needed'}</figcaption>
                  </figure>
                )}
                {parsePhotoLines(form.photos).map((photo, photoIndex) => (
                  <figure key={`${photo.src}-${photoIndex}`} className="overflow-hidden border border-ink-100 bg-paper-warm">
                    <img src={photo.src} alt={photo.alt || `Bedroom gallery image ${photoIndex + 1}`} className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-ink-600">
                      <span className="truncate">{photo.alt || 'Description needed'}</span>
                      <button type="button" onClick={() => setForm((current) => ({ ...current, photos: parsePhotoLines(current.photos).filter((_, index) => index !== photoIndex).map((item) => `${item.src}|${item.alt}`).join('\n') }))} className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide text-rose-700 hover:text-rose-900">Remove</button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-500">Add a photo link or upload images to preview them here before saving.</p>
            )}
          </section>
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
            <button type="submit" disabled={saving || uploadingImage} className="btn-gold inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{uploadingImage ? 'Uploading image…' : saving ? 'Saving…' : 'Save bedroom'}</button>
            <button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="btn-outline px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">Cancel</button>
          </div>
        </form>
      </AdminModal>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-gold-deep">Your inventory</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-900">Private bedrooms</h2>
            <p className="mt-2 text-sm text-ink-500">Select a group to review its rooms, publication and booking status.</p>
          </div>
          <button type="button" onClick={() => setResetCount((count) => count + 1)} disabled={loading} className="inline-flex w-fit items-center gap-2 border border-ink-200 bg-paper px-4 py-2.5 text-xs font-medium text-ink-700 transition-colors hover:border-gold hover:text-gold-deep disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh data
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {groups.map((group) => {
            const count = rooms.filter((room) => room.apartment_group_id === group.id).length;
            const groupFacilities = facilities.filter((facility) => facility.apartment_group_id === group.id);
            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={activeGroup === group.identifier}
                onClick={() => setActiveGroup(activeGroup === group.identifier ? 'all' : group.identifier)}
                className={`group border p-4 text-left transition-all sm:p-5 ${activeGroup === group.identifier ? 'border-gold bg-paper shadow-[0_12px_30px_rgba(27,25,20,0.07)]' : 'border-ink-100 bg-paper hover:border-gold/60 hover:shadow-[0_10px_24px_rgba(27,25,20,0.045)]'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`flex h-10 w-10 items-center justify-center font-serif text-lg ${activeGroup === group.identifier ? 'bg-ink-900 text-gold' : 'bg-paper-warm text-ink-800'}`}>{group.identifier}</span>
                  <span className="text-right">
                    <span className="block font-serif text-2xl leading-none text-ink-900">{count}</span>
                    <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ink-400">bedrooms</span>
                  </span>
                </div>
                <p className="mt-4 font-medium text-ink-900">{group.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{group.description}</p>
                <p className="mt-4 border-t border-ink-100 pt-3 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  {groupFacilities.filter((facility) => facility.published).length} shared spaces published
                </p>
              </button>
            );
          })}
        </div>

        <div className="border border-ink-100 bg-paper shadow-[0_8px_24px_rgba(27,25,20,0.025)]">
          <div className="flex flex-col gap-4 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2" aria-label="Filter bedrooms by apartment">
              <button type="button" aria-pressed={activeGroup === 'all'} onClick={() => setActiveGroup('all')} className={`px-3 py-2 text-xs font-medium transition-colors ${activeGroup === 'all' ? 'bg-ink-900 text-paper' : 'bg-paper-warm text-ink-600 hover:text-ink-900'}`}>All rooms <span className="ml-1 opacity-65">{rooms.length}</span></button>
              {groups.map((group) => (
                <button key={group.id} type="button" aria-pressed={activeGroup === group.identifier} onClick={() => setActiveGroup(group.identifier)} className={`px-3 py-2 text-xs font-medium transition-colors ${activeGroup === group.identifier ? 'bg-ink-900 text-paper' : 'bg-paper-warm text-ink-600 hover:text-ink-900'}`}>Apartment {group.identifier}</button>
              ))}
              {rooms.some((room) => !room.apartment_group_id) && (
                <button type="button" aria-pressed={activeGroup === 'unassigned'} onClick={() => setActiveGroup('unassigned')} className={`px-3 py-2 text-xs font-medium transition-colors ${activeGroup === 'unassigned' ? 'bg-ink-900 text-paper' : 'bg-paper-warm text-ink-600 hover:text-ink-900'}`}>Unassigned <span className="ml-1 opacity-65">{rooms.filter((room) => !room.apartment_group_id).length}</span></button>
              )}
            </div>
            <label className="relative block sm:w-64">
              <span className="sr-only">Search bedrooms</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input type="search" value={roomSearch} onChange={(event) => setRoomSearch(event.target.value)} placeholder="Search rooms…" className="w-full border border-ink-200 bg-paper px-3 py-2.5 pl-9 text-sm text-ink-900 outline-none focus:border-gold" />
            </label>
          </div>

          {loading ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-64 animate-pulse bg-paper-warm" />)}
            </div>
          ) : visibleRooms.length ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {visibleRooms.map((room) => (
                <article key={room.slug} className="group overflow-hidden border border-ink-100 bg-paper transition-all hover:border-gold/50 hover:shadow-[0_14px_32px_rgba(27,25,20,0.075)]">
                  <div className="relative aspect-[16/9] overflow-hidden bg-paper-warm">
                    <img src={room.photo_src} alt={room.photo_alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                    <span className="absolute left-3 top-3 bg-ink-900/85 px-2.5 py-1.5 font-serif text-sm text-paper backdrop-blur">{room.name}</span>
                    <span className={`absolute right-3 top-3 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.1em] ${room.published ? 'bg-emerald-50/95 text-emerald-800' : 'bg-paper/95 text-ink-500'}`}>
                      {room.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="eyebrow text-gold-deep">{room.apartment_group?.name ?? 'Group not assigned'}</p>
                        <h3 className="mt-2 truncate font-serif text-2xl text-ink-900">{room.name}</h3>
                      </div>
                      <span className={`shrink-0 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.08em] ${room.booking_enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-paper-warm text-ink-500'}`}>
                        {room.booking_enabled ? 'Bookable' : 'Request only'}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-relaxed text-ink-500">{room.summary || 'Add a short bedroom description.'}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-y border-ink-100 py-3">
                      <div><p className="text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-ink-400">Nightly rate</p><p className="mt-1 text-sm font-medium text-ink-800">{room.starting_price_amount !== null && room.starting_price_currency ? new Intl.NumberFormat('en', { style: 'currency', currency: room.starting_price_currency, maximumFractionDigits: 0 }).format(room.starting_price_amount) : 'On request'}</p></div>
                      <div><p className="text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-ink-400">Capacity</p><p className="mt-1 text-sm font-medium text-ink-800">{room.max_occupancy_verified && room.max_occupancy ? `Up to ${room.max_occupancy} guests` : 'To be verified'}</p></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-[0.6rem] text-ink-400">Bed details {room.bed_configuration_verified ? 'verified' : 'pending'}</span>
                      <button type="button" onClick={() => { setForm(apartmentToForm(room)); setNotice(''); setError(''); setEditorOpen(true); }} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-800 transition-colors hover:text-gold-deep">Edit bedroom <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <Building2 className="mx-auto h-6 w-6 text-gold" aria-hidden="true" />
              <p className="mt-3 font-serif text-xl text-ink-900">No bedrooms match</p>
              <p className="mt-1 text-sm text-ink-500">Change the apartment filter or search term.</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-gold-deep">Shared property</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-900">Shared spaces</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-500">Edit the shared living room and kitchen for each apartment group. Updates apply to every bedroom assigned to that group.</p>
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          {groups.map((group) => (
            <details key={group.id} className="group border border-ink-100 bg-paper shadow-[0_8px_24px_rgba(27,25,20,0.025)] open:border-gold/60 xl:col-span-1 open:xl:col-span-3">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 marker:hidden [&::-webkit-details-marker]:hidden sm:p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink-900 font-serif text-xl text-gold">{group.identifier}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-xl text-ink-900">{group.name}</span>
                  <span className="mt-1 block truncate text-xs text-ink-500">{rooms.filter((room) => room.apartment_group_id === group.id).length} bedrooms · {facilities.filter((facility) => facility.apartment_group_id === group.id).length} shared facilities</span>
                </span>
                <span className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-gold-deep group-open:hidden">Manage</span>
                <span className="hidden text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-gold-deep group-open:inline">Close</span>
              </summary>
              <div className="border-t border-ink-100 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>Apartment name<input value={group.name} onChange={(event) => setGroups((items) => items.map((item) => item.id === group.id ? { ...item, name: event.target.value } : item))} className={fieldClass} /></label>
                <label className="flex items-center gap-3 self-end pb-3 text-sm text-ink-700"><input type="checkbox" checked={group.published} onChange={(event) => setGroups((items) => items.map((item) => item.id === group.id ? { ...item, published: event.target.checked } : item))} className="h-4 w-4 accent-[#B8954A]" />Published on website</label>
                <label className={`${labelClass} sm:col-span-2`}>Description<textarea rows={2} value={group.description} onChange={(event) => setGroups((items) => items.map((item) => item.id === group.id ? { ...item, description: event.target.value } : item))} className={fieldClass} /></label>
              </div>
              <div className="mt-5 space-y-4">
                {facilities.filter((facility) => facility.apartment_group_id === group.id).map((facility) => (
                  <div key={facility.id} className="border border-ink-100 bg-paper-warm/60 p-4">
                    <p className="eyebrow text-gold-deep">{facility.facility_type === 'living_room' ? 'Shared living room' : 'Shared kitchen'}</p>
                    <label className={`${labelClass} mt-3`}>Facility name<input value={facility.name} onChange={(event) => setFacilities((items) => items.map((item) => item.id === facility.id ? { ...item, name: event.target.value } : item))} className={fieldClass} /></label>
                    <label className={`${labelClass} mt-3`}>Description<textarea rows={3} value={facility.description} onChange={(event) => setFacilities((items) => items.map((item) => item.id === facility.id ? { ...item, description: event.target.value } : item))} className={fieldClass} /></label>
                    <label className={`${labelClass} mt-3`}>Photo links<textarea rows={3} value={facility.photos.map((photo) => `${photo.src}|${photo.alt}`).join('\n')} onChange={(event) => setFacilities((items) => items.map((item) => item.id === facility.id ? { ...item, photos: splitLines(event.target.value).map((line) => { const separator = line.indexOf('|'); return { src: separator >= 0 ? line.slice(0, separator).trim() : line.trim(), alt: separator >= 0 ? line.slice(separator + 1).trim() : '' }; }).filter((photo) => photo.src) } : item))} placeholder={'https://example.com/shared-space.jpg | Shared living room'} className={fieldClass} /></label>
                    <p className="mt-1 text-[0.65rem] text-ink-400">Paste public image URLs or site paths, one per line. Use URL | description.</p>
                    <label className={`${labelClass} mt-4`}>Upload photos from device<input type="file" multiple accept="image/*,.heic,.heif" disabled={uploadingImage} onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); if (files.length) void uploadSharedFacilityImages(files, facility); event.currentTarget.value = ''; }} className={fieldClass} /><span className="mt-1 block text-[0.65rem] normal-case text-ink-400">Includes HEIC/HEIF (converted to JPEG for display), up to 5 MB each.</span></label>
                    {facility.photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {facility.photos.map((photo, photoIndex) => (
                          <div key={`${photo.src}-${photoIndex}`} className="relative overflow-hidden border border-ink-100 bg-paper">
                            <img src={photo.src} alt={photo.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                            <button type="button" onClick={() => setFacilities((items) => items.map((item) => item.id === facility.id ? { ...item, photos: item.photos.filter((_, index) => index !== photoIndex) } : item))} className="w-full truncate px-2 py-1.5 text-left text-[0.6rem] text-ink-500 hover:text-rose-700" title="Remove photo">{photo.alt || 'Photo'} · Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="mt-3 flex items-center gap-3 text-sm text-ink-700"><input type="checkbox" checked={facility.published} onChange={(event) => setFacilities((items) => items.map((item) => item.id === facility.id ? { ...item, published: event.target.checked } : item))} className="h-4 w-4 accent-[#B8954A]" />Publish facility</label>
                  </div>
                ))}
              </div>
              <button type="button" disabled={!supabase} onClick={async () => {
                if (!supabase) return;
                setSaving(true); setError(''); setNotice('');
                let savedChanges = false;
                try {
                  const groupResult = await supabase.from('property_apartment_groups').update({ name: group.name, description: group.description, published: group.published, updated_at: new Date().toISOString() }).eq('id', group.id);
                  if (groupResult.error) throw new Error(groupResult.error.message);
                  savedChanges = true;
                  for (const facility of facilities.filter((item) => item.apartment_group_id === group.id)) {
                    const facilityResult = await supabase.from('property_shared_facilities').update({ name: facility.name, description: facility.description, photos: facility.photos, published: facility.published, updated_at: new Date().toISOString() }).eq('id', facility.id);
                    if (facilityResult.error) throw new Error(facilityResult.error.message);
                    savedChanges = true;
                  }
                  setNotice(`Apartment ${group.identifier} shared information saved.`);
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : 'Could not save apartment management changes.');
                } finally {
                  if (savedChanges) notifyPropertyDataChanged();
                  setSaving(false);
                }
              }} className="btn-gold mt-5 inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50"><Save className="h-4 w-4" />Save Apartment {group.identifier}</button>
              </div>
            </details>
          ))}
        </div>
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
        <div role="region" aria-label="Booking calendar dates" tabIndex={0} className="overflow-x-auto focus-visible:outline">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-7 border-b border-ink-100 pb-2 text-center text-xs uppercase text-ink-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((day, index) => (
                <div key={index} className="min-h-20 border-b border-r border-ink-100 p-1 sm:min-h-28 sm:p-2">
                  {day && <><span className="text-xs text-ink-500">{day}</span><div className="mt-1 space-y-1">{bookingsForDay(day).slice(0, 2).map((booking) => <span key={booking.id} title={`${booking.guest_name} · ${booking.apartment_slug}`} className={`block truncate px-1 py-1 text-[0.6rem] sm:text-xs ${booking.status === 'pending' || booking.status === 'awaiting_payment' ? 'bg-gold/20 text-ink-800' : booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>{booking.guest_name}</span>)}</div></>}
                </div>
              ))}
            </div>
          </div>
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
      notifyPropertyDataChanged();
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
