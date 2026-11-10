import { useEffect, useState, type FormEvent } from 'react';
import { Check, ImagePlus, Plus, RefreshCw, Trash2 } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';
import { supabase } from '@/lib/supabase';
import { fetchManagedApartments, type ManagedApartment } from '@/lib/propertyApartments';
import { uploadPropertyImage } from '@/lib/propertyContent';

const fieldClass = 'mt-2 w-full border border-ink-200 bg-paper px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-gold';
const labelClass = 'block text-xs font-medium uppercase tracking-[0.12em] text-ink-500';

interface AmenityRecord {
  id: string;
  scope: 'room' | 'shared';
  apartment_slug: string | null;
  name: string;
  description: string;
  photo_path: string | null;
  photo_alt: string;
  verified: boolean;
  published: boolean;
  display_order: number;
}

interface AmenityForm {
  scope: 'room' | 'shared';
  apartmentSlug: string;
  name: string;
  description: string;
  photoPath: string;
  photoAlt: string;
  verified: boolean;
  published: boolean;
  displayOrder: string;
}

const emptyAmenityForm: AmenityForm = {
  scope: 'room',
  apartmentSlug: '',
  name: '',
  description: '',
  photoPath: '',
  photoAlt: '',
  verified: false,
  published: false,
  displayOrder: '0',
};

interface RuleRecord {
  id: string;
  category: string;
  title: string;
  details: string;
  verified: boolean;
  published: boolean;
  revision: number;
  display_order: number;
}

interface RuleForm {
  category: string;
  title: string;
  details: string;
  verified: boolean;
  published: boolean;
  displayOrder: string;
}

const emptyRuleForm: RuleForm = {
  category: '',
  title: '',
  details: '',
  verified: false,
  published: false,
  displayOrder: '0',
};

function amenityFormFromRecord(amenity: AmenityRecord): AmenityForm {
  return {
    scope: amenity.scope,
    apartmentSlug: amenity.apartment_slug ?? '',
    name: amenity.name,
    description: amenity.description,
    photoPath: amenity.photo_path ?? '',
    photoAlt: amenity.photo_alt,
    verified: amenity.verified,
    published: amenity.published,
    displayOrder: String(amenity.display_order),
  };
}

export function AdminAmenities() {
  const [rooms, setRooms] = useState<ManagedApartment[]>([]);
  const [amenities, setAmenities] = useState<AmenityRecord[]>([]);
  const [form, setForm] = useState<AmenityForm>(emptyAmenityForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchManagedApartments(),
      supabase
        ? supabase.from('property_amenities')
          .select('id, scope, apartment_slug, name, description, photo_path, photo_alt, verified, published, display_order')
          .order('scope').order('display_order').order('name')
        : Promise.reject(new Error('Supabase is not configured.')),
    ]).then(([loadedRooms, result]) => {
      if (!active) return;
      if (result.error) throw new Error(`Could not load amenity records: ${result.error.message}`);
      setRooms(loadedRooms);
      setAmenities((result.data ?? []) as AmenityRecord[]);
      setError('');
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load amenity records.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refresh]);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyAmenityForm, apartmentSlug: rooms[0]?.slug ?? '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(amenity: AmenityRecord) {
    setEditingId(amenity.id);
    setForm(amenityFormFromRecord(amenity));
    setError('');
    setModalOpen(true);
  }

  async function saveAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    if (form.scope === 'room' && !form.apartmentSlug) {
      setError('Choose the residence for this room amenity.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    const record = {
      scope: form.scope,
      apartment_slug: form.scope === 'room' ? form.apartmentSlug : null,
      name: form.name.trim(),
      description: form.description.trim(),
      photo_path: form.photoPath.trim() || null,
      photo_alt: form.photoAlt.trim(),
      verified: form.verified,
      published: form.published,
      display_order: Number(form.displayOrder) || 0,
      updated_at: new Date().toISOString(),
    };

    try {
      const result = editingId
        ? await supabase.from('property_amenities').update(record).eq('id', editingId)
        : await supabase.from('property_amenities').insert(record);
      if (result.error) throw new Error(`Could not save this amenity: ${result.error.message}`);
      setNotice('Amenity saved. It appears publicly only when both verified and published are selected.');
      setModalOpen(false);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this amenity.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAmenity(amenity: AmenityRecord) {
    if (!supabase) { setError('Supabase is not configured.'); return; }
    if (!window.confirm(`Delete "${amenity.name}"?`)) return;
    const { error: deleteError } = await supabase.from('property_amenities').delete().eq('id', amenity.id);
    if (deleteError) setError(`Could not delete ${amenity.name}: ${deleteError.message}`);
    else {
      setNotice('Amenity deleted.');
      setRefresh((value) => value + 1);
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError('');
    try {
      const photoPath = await uploadPropertyImage(file, 'amenities');
      setForm((current) => ({ ...current, photoPath, photoAlt: current.photoAlt || file.name }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload this amenity photograph.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Property content</p>
          <h1 className="display mt-2 text-3xl text-ink-900 md:text-4xl">Amenities</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">Manage verified facilities per room or at the shared-property level. Nothing is shown to guests unless it is both verified and published.</p>
        </div>
        <button type="button" onClick={openNew} className="btn-gold inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.12em]"><Plus className="h-4 w-4" aria-hidden="true" />Add amenity</button>
      </div>
      {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
      {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}
      <AdminModal open={modalOpen} title={editingId ? 'Edit amenity' : 'Add amenity'} description="Use verified details only. Unverified draft entries remain private." onClose={() => { if (!saving && !uploading) setModalOpen(false); }}>
        <form onSubmit={saveAmenity} className="space-y-5">
          <label className={labelClass}>Applies to
            <select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value as AmenityForm['scope'] })} className={fieldClass}>
              <option value="room">One residence</option><option value="shared">Shared property facility</option>
            </select>
          </label>
          {form.scope === 'room' && <label className={labelClass}>Residence
            <select required value={form.apartmentSlug} onChange={(event) => setForm({ ...form, apartmentSlug: event.target.value })} className={fieldClass}>
              <option value="">Choose a residence</option>{rooms.map((room) => <option key={room.slug} value={room.slug}>{room.name}</option>)}
            </select>
          </label>}
          <label className={labelClass}>Amenity name<input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Description<textarea maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Photo URL<input value={form.photoPath} onChange={(event) => setForm({ ...form, photoPath: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ''; }} className={fieldClass} /><span className="mt-1 block text-[0.65rem] normal-case text-ink-400">JPG, PNG, or WebP up to 5 MB.</span></label>
          <label className={labelClass}>Photo description<input value={form.photoAlt} onChange={(event) => setForm({ ...form, photoAlt: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Display order<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} className={fieldClass} /></label>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} className="accent-[#B8954A]" />Verified by property</label>
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="accent-[#B8954A]" />Publish for guests</label>
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={saving || uploading} className="btn-gold px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">{uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save amenity'}</button>
        </form>
      </AdminModal>
      <section className="border border-ink-100 bg-paper">
        <div className="flex items-center justify-between border-b border-ink-100 p-5"><h2 className="font-serif text-2xl text-ink-900">Amenity records</h2><button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading} className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.1em] disabled:opacity-50"><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</button></div>
        {loading ? <p className="p-8 text-sm text-ink-500">Loading amenity records…</p> : amenities.length === 0 ? <p className="p-8 text-sm text-ink-500">No amenities are configured. Add verified room or shared-property amenities when ready.</p> : (
          <ul className="divide-y divide-ink-100">
            {amenities.map((amenity) => (
              <li key={amenity.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-4">
                  {amenity.photo_path ? <img src={amenity.photo_path} alt={amenity.photo_alt} className="h-16 w-20 object-cover" /> : <div className="flex h-16 w-20 items-center justify-center bg-paper-warm"><ImagePlus className="h-5 w-5 text-ink-400" aria-hidden="true" /></div>}
                  <div className="min-w-0"><p className="font-medium text-ink-900">{amenity.name}</p><p className="mt-1 text-xs text-ink-500">{amenity.scope === 'shared' ? 'Shared property' : rooms.find((room) => room.slug === amenity.apartment_slug)?.name ?? amenity.apartment_slug}</p><p className="mt-1 text-xs text-ink-400">{amenity.verified ? 'Verified' : 'Draft · not verified'} · {amenity.published && amenity.verified ? 'Public' : 'Hidden from guests'}</p></div>
                </div>
                <div className="flex gap-2"><button type="button" onClick={() => openEdit(amenity)} className="btn-outline px-3 py-2 text-xs uppercase tracking-[0.1em]">Edit</button><button type="button" onClick={() => void deleteAmenity(amenity)} aria-label={`Delete ${amenity.name}`} className="border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AdminHouseRules() {
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [form, setForm] = useState<RuleForm>(emptyRuleForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const { data, error: queryError } = await supabase.from('property_house_rules')
          .select('id, category, title, details, verified, published, revision, display_order')
          .order('display_order').order('category');
        if (queryError) throw new Error(`Could not load house rules: ${queryError.message}`);
        if (!active) return;
        setRules((data ?? []) as RuleRecord[]);
        setError('');
      } catch (cause: unknown) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load house rules.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [refresh]);

  function openNew() {
    setEditingId(null);
    setForm(emptyRuleForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(rule: RuleRecord) {
    setEditingId(rule.id);
    setForm({
      category: rule.category,
      title: rule.title,
      details: rule.details,
      verified: rule.verified,
      published: rule.published,
      displayOrder: String(rule.display_order),
    });
    setError('');
    setModalOpen(true);
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setSaving(true);
    setError('');
    const record = {
      category: form.category.trim(),
      title: form.title.trim(),
      details: form.details.trim(),
      verified: form.verified,
      published: form.published,
      display_order: Number(form.displayOrder) || 0,
      updated_at: new Date().toISOString(),
    };
    try {
      const result = editingId
        ? await supabase.from('property_house_rules').update(record).eq('id', editingId)
        : await supabase.from('property_house_rules').insert(record);
      if (result.error) throw new Error(`Could not save this rule: ${result.error.message}`);
      setNotice('House rule saved. Guests see and accept only rules marked verified and published.');
      setModalOpen(false);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this house rule.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(rule: RuleRecord) {
    if (!supabase) { setError('Supabase is not configured.'); return; }
    if (!window.confirm(`Delete the "${rule.title}" rule?`)) return;
    const { error: deleteError } = await supabase.from('property_house_rules').delete().eq('id', rule.id);
    if (deleteError) setError(`Could not delete this house rule: ${deleteError.message}`);
    else {
      setNotice('House rule deleted. Existing reservations retain their accepted rules snapshot.');
      setRefresh((value) => value + 1);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Property content</p><h1 className="display mt-2 text-3xl text-ink-900 md:text-4xl">House rules</h1><p className="mt-2 max-w-2xl text-sm text-ink-500">Add the property’s approved rules. Examples are not prefilled; only verified and published rules are shown at guest checkout.</p></div>
        <button type="button" onClick={openNew} className="btn-gold inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.12em]"><Plus className="h-4 w-4" aria-hidden="true" />Add rule</button>
      </div>
      {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
      {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}
      <AdminModal open={modalOpen} title={editingId ? 'Edit house rule' : 'Add house rule'} description="Draft rules remain private until verified and published." onClose={() => { if (!saving) setModalOpen(false); }}>
        <form onSubmit={saveRule} className="space-y-5">
          <label className={labelClass}>Category<input required maxLength={80} placeholder="For example: Arrival" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Rule title<input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Guest-facing details<textarea required maxLength={2000} rows={5} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} className={fieldClass} /></label>
          <label className={labelClass}>Display order<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} className={fieldClass} /></label>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} className="accent-[#B8954A]" />Owner verified</label>
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="accent-[#B8954A]" />Publish and require guest acceptance</label>
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={saving} className="btn-gold px-5 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50">{saving ? 'Saving…' : 'Save house rule'}</button>
        </form>
      </AdminModal>
      <section className="border border-ink-100 bg-paper">
        <h2 className="border-b border-ink-100 p-5 font-serif text-2xl text-ink-900">Configured rules</h2>
        {loading ? <p className="p-8 text-sm text-ink-500">Loading house rules…</p> : rules.length === 0 ? <p className="p-8 text-sm text-ink-500">No rules have been added. No example rules are assumed or published.</p> : (
          <ul className="divide-y divide-ink-100">
            {rules.map((rule) => <li key={rule.id} className="flex flex-wrap items-start justify-between gap-4 p-5"><div><p className="text-xs uppercase tracking-[0.12em] text-gold-deep">{rule.category} · revision {rule.revision}</p><h3 className="mt-1 font-medium text-ink-900">{rule.title}</h3><p className="mt-2 max-w-3xl whitespace-pre-line text-sm text-ink-600">{rule.details}</p><p className="mt-2 text-xs text-ink-400">{rule.verified ? 'Verified' : 'Draft · not verified'} · {rule.verified && rule.published ? 'Published · required at checkout' : 'Hidden from guests'}</p></div><div className="flex gap-2"><button type="button" onClick={() => openEdit(rule)} className="btn-outline px-3 py-2 text-xs uppercase tracking-[0.1em]">Edit</button><button type="button" onClick={() => void deleteRule(rule)} aria-label={`Delete ${rule.title}`} className="border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

interface BlockedDate {
  id: string;
  apartment_slug: string;
  check_in: string;
  check_out: string;
  reason: string;
}

export function AdminAvailability() {
  const [rooms, setRooms] = useState<ManagedApartment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [apartmentSlug, setApartmentSlug] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchManagedApartments(),
      supabase
        ? supabase.from('property_blocked_dates').select('id, apartment_slug, check_in, check_out, reason').order('check_in')
        : Promise.reject(new Error('Supabase is not configured.')),
    ]).then(([loadedRooms, result]) => {
      if (!active) return;
      if (result.error) throw new Error(`Could not load blocked dates: ${result.error.message}`);
      setRooms(loadedRooms);
      setBlockedDates((result.data ?? []) as BlockedDate[]);
      setApartmentSlug((current) => current || loadedRooms[0]?.slug || '');
      setError('');
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load room availability.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  async function blockDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { error: blockError } = await supabase.rpc('admin_block_reservation_dates', {
        p_apartment_slug: apartmentSlug,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_reason: reason,
      });
      if (blockError) throw new Error(`Could not block these dates: ${blockError.message}`);
      setNotice('Dates blocked for the selected room.');
      setCheckIn('');
      setCheckOut('');
      setReason('');
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not block these dates.');
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(block: BlockedDate) {
    if (!supabase) { setError('Supabase is not configured.'); return; }
    if (!window.confirm('Remove this date block and reopen the dates for online bookings?')) return;
    const { error: deleteError } = await supabase.from('property_blocked_dates').delete().eq('id', block.id);
    if (deleteError) setError(`Could not remove blocked dates: ${deleteError.message}`);
    else {
      setNotice('Date block removed.');
      setRefresh((value) => value + 1);
    }
  }

  return (
    <div className="space-y-7">
      <div><p className="eyebrow">Reservations</p><h1 className="display mt-2 text-3xl text-ink-900 md:text-4xl">Room availability</h1><p className="mt-2 max-w-2xl text-sm text-ink-500">Block room-specific dates for maintenance or owner use. Blocks are rechecked by the database and cannot overlap confirmed stays or active holds.</p></div>
      {error && <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
      {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}
      <form onSubmit={blockDates} className="grid gap-5 border border-ink-100 bg-paper p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className={labelClass}>Residence<select required value={apartmentSlug} onChange={(event) => setApartmentSlug(event.target.value)} className={fieldClass}>{rooms.map((room) => <option key={room.slug} value={room.slug}>{room.name}</option>)}</select></label>
        <label className={labelClass}>Unavailable from<input required type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className={fieldClass} /></label>
        <label className={labelClass}>Available again<input required type="date" value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} className={fieldClass} /></label>
        <label className={labelClass}>Reason (optional)<input maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} className={fieldClass} /></label>
        <button type="submit" disabled={saving || !rooms.length} className="btn-gold mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.12em] disabled:opacity-50"><Check className="h-4 w-4" aria-hidden="true" />{saving ? 'Saving…' : 'Block dates'}</button>
      </form>
      <section className="border border-ink-100 bg-paper">
        <h2 className="border-b border-ink-100 p-5 font-serif text-2xl text-ink-900">Blocked dates</h2>
        {loading ? <p className="p-8 text-sm text-ink-500">Loading room availability…</p> : blockedDates.length === 0 ? <p className="p-8 text-sm text-ink-500">No manual date blocks. Confirmed bookings and active holds are managed automatically.</p> : (
          <ul className="divide-y divide-ink-100">{blockedDates.map((block) => <li key={block.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-medium text-ink-900">{rooms.find((room) => room.slug === block.apartment_slug)?.name ?? block.apartment_slug}</p><p className="mt-1 text-sm text-ink-600">{block.check_in} – {block.check_out}</p>{block.reason && <p className="mt-1 text-xs text-ink-500">{block.reason}</p>}</div><button type="button" onClick={() => void removeBlock(block)} className="border border-rose-200 px-3 py-2 text-xs uppercase tracking-[0.1em] text-rose-700 hover:bg-rose-50"><Trash2 className="mr-2 inline h-4 w-4" aria-hidden="true" />Remove block</button></li>)}</ul>
        )}
      </section>
    </div>
  );
}
