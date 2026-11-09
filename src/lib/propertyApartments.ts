import { z } from 'zod';
import { apartments as fallbackApartments, type Apartment } from '@/data/apartments';
import { supabase } from '@/lib/supabase';

const photoSchema = z.object({ src: z.string(), alt: z.string() });

export const managedApartmentSchema = z.object({
  slug: z.string(),
  number: z.string(),
  name: z.string(),
  summary: z.string(),
  photo_src: z.string(),
  photo_alt: z.string(),
  photos: z.array(photoSchema),
  bed_configuration: z.string().nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  max_occupancy: z.number().nullable(),
  size_sqm: z.number().nullable(),
  check_in: z.string().nullable(),
  check_out: z.string().nullable(),
  minimum_stay: z.number().nullable(),
  facilities: z.array(z.string()),
  house_rules: z.array(z.string()),
  starting_price_amount: z.number().nullable(),
  starting_price_currency: z.string().nullable(),
  published: z.boolean(),
});

export type ManagedApartment = z.infer<typeof managedApartmentSchema>;

const selectFields =
  'slug, number, name, summary, photo_src, photo_alt, photos, bed_configuration, bedrooms, bathrooms, max_occupancy, size_sqm, check_in, check_out, minimum_stay, facilities, house_rules, starting_price_amount, starting_price_currency, published';

export function toApartment(row: ManagedApartment): Apartment {
  return {
    slug: row.slug,
    number: row.number,
    name: row.name,
    summary: row.summary,
    photo: { src: row.photo_src, alt: row.photo_alt },
    photos: row.photos.length > 0 ? row.photos : [{ src: row.photo_src, alt: row.photo_alt }],
    bedConfiguration: row.bed_configuration ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    maxOccupancy: row.max_occupancy ?? undefined,
    sizeSqm: row.size_sqm ?? undefined,
    checkIn: row.check_in ?? undefined,
    checkOut: row.check_out ?? undefined,
    minimumStay: row.minimum_stay ?? undefined,
    facilities: row.facilities,
    houseRules: row.house_rules,
    startingPrice:
      row.starting_price_amount !== null && row.starting_price_currency
        ? { amount: row.starting_price_amount, currency: row.starting_price_currency }
        : undefined,
  };
}

export async function fetchApartments(includeUnpublished = false): Promise<Apartment[]> {
  if (!supabase) return fallbackApartments;

  let query = supabase.from('property_apartments').select(selectFields).order('number');
  if (!includeUnpublished) query = query.eq('published', true);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load residences: ${error.message}`);

  const parsed = managedApartmentSchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Residence data returned an unexpected format.');
  return parsed.data.map(toApartment);
}

export async function fetchManagedApartments(): Promise<ManagedApartment[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('property_apartments')
    .select(selectFields)
    .order('number');
  if (error) throw new Error(`Could not load residences: ${error.message}`);

  const parsed = managedApartmentSchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Residence data returned an unexpected format.');
  return parsed.data;
}

export function apartmentToRecord(apartment: Apartment, published: boolean) {
  return {
    slug: apartment.slug,
    number: apartment.number,
    name: apartment.name,
    summary: apartment.summary,
    photo_src: apartment.photo.src,
    photo_alt: apartment.photo.alt,
    photos: apartment.photos,
    bed_configuration: apartment.bedConfiguration ?? null,
    bedrooms: apartment.bedrooms ?? null,
    bathrooms: apartment.bathrooms ?? null,
    max_occupancy: apartment.maxOccupancy ?? null,
    size_sqm: apartment.sizeSqm ?? null,
    check_in: apartment.checkIn ?? null,
    check_out: apartment.checkOut ?? null,
    minimum_stay: apartment.minimumStay ?? null,
    facilities: apartment.facilities,
    house_rules: apartment.houseRules,
    starting_price_amount: apartment.startingPrice?.amount ?? null,
    starting_price_currency: apartment.startingPrice?.currency ?? null,
    published,
    updated_at: new Date().toISOString(),
  };
}

export function toManagedApartment(apartment: Apartment, published = true): ManagedApartment {
  return managedApartmentSchema.parse({
    slug: apartment.slug,
    number: apartment.number,
    name: apartment.name,
    summary: apartment.summary,
    photo_src: apartment.photo.src,
    photo_alt: apartment.photo.alt,
    photos: apartment.photos,
    bed_configuration: apartment.bedConfiguration ?? null,
    bedrooms: apartment.bedrooms ?? null,
    bathrooms: apartment.bathrooms ?? null,
    max_occupancy: apartment.maxOccupancy ?? null,
    size_sqm: apartment.sizeSqm ?? null,
    check_in: apartment.checkIn ?? null,
    check_out: apartment.checkOut ?? null,
    minimum_stay: apartment.minimumStay ?? null,
    facilities: apartment.facilities,
    house_rules: apartment.houseRules,
    starting_price_amount: apartment.startingPrice?.amount ?? null,
    starting_price_currency: apartment.startingPrice?.currency ?? null,
    published,
  });
}
