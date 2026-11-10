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
  bed_type: z.string().nullable(),
  bed_quantity: z.number().nullable(),
  bed_dimensions: z.string().nullable(),
  bed_configuration_verified: z.boolean(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  max_occupancy: z.number().nullable(),
  max_occupancy_verified: z.boolean(),
  size_sqm: z.number().nullable(),
  check_in: z.string().nullable(),
  check_out: z.string().nullable(),
  minimum_stay: z.number().nullable(),
  facilities: z.array(z.string()),
  house_rules: z.array(z.string()),
  starting_price_amount: z.number().nullable(),
  starting_price_currency: z.string().nullable(),
  booking_enabled: z.boolean(),
  published: z.boolean(),
});

export type ManagedApartment = z.infer<typeof managedApartmentSchema>;

const selectFields =
  'slug, number, name, summary, photo_src, photo_alt, photos, bed_configuration, bed_type, bed_quantity, bed_dimensions, bed_configuration_verified, bedrooms, bathrooms, max_occupancy, max_occupancy_verified, size_sqm, check_in, check_out, minimum_stay, facilities, house_rules, starting_price_amount, starting_price_currency, booking_enabled, published';

export function toApartment(row: ManagedApartment, verifiedAmenities = row.facilities): Apartment {
  return {
    slug: row.slug,
    number: row.number,
    name: row.name,
    summary: row.summary,
    photo: { src: row.photo_src, alt: row.photo_alt },
    photos: row.photos.length > 0 ? row.photos : [{ src: row.photo_src, alt: row.photo_alt }],
    bedConfiguration: row.bed_configuration_verified ? row.bed_configuration ?? undefined : undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    maxOccupancy: row.max_occupancy_verified ? row.max_occupancy ?? undefined : undefined,
    sizeSqm: row.size_sqm ?? undefined,
    checkIn: row.check_in ?? undefined,
    checkOut: row.check_out ?? undefined,
    minimumStay: row.minimum_stay ?? undefined,
    facilities: verifiedAmenities,
    houseRules: row.house_rules,
    startingPrice:
      row.starting_price_amount !== null && row.starting_price_currency
        ? { amount: row.starting_price_amount, currency: row.starting_price_currency }
        : undefined,
    bookingEnabled: row.booking_enabled,
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
  const { data: amenities, error: amenitiesError } = await supabase
    .from('property_amenities')
    .select('apartment_slug, name')
    .eq('scope', 'room')
    .eq('verified', true)
    .eq('published', true)
    .not('apartment_slug', 'is', null)
    .order('display_order')
    .order('name');
  if (amenitiesError) throw new Error(`Could not load verified room amenities: ${amenitiesError.message}`);
  const facilitiesByRoom = new Map<string, string[]>();
  (amenities ?? []).forEach((amenity) => {
    if (!amenity.apartment_slug || typeof amenity.name !== 'string') return;
    facilitiesByRoom.set(amenity.apartment_slug, [
      ...(facilitiesByRoom.get(amenity.apartment_slug) ?? []),
      amenity.name,
    ]);
  });
  return parsed.data.map((room) => toApartment(room, facilitiesByRoom.get(room.slug) ?? []));
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

export interface ApartmentVerification {
  bedType: string;
  bedQuantity: number | undefined;
  bedDimensions: string;
  bedConfigurationVerified: boolean;
  maxOccupancyVerified: boolean;
}

export function apartmentToRecord(
  apartment: Apartment,
  published: boolean,
  verification: ApartmentVerification,
) {
  return {
    slug: apartment.slug,
    number: apartment.number,
    name: apartment.name,
    summary: apartment.summary,
    photo_src: apartment.photo.src,
    photo_alt: apartment.photo.alt,
    photos: apartment.photos,
    bed_configuration: apartment.bedConfiguration ?? null,
    bed_type: verification.bedType || null,
    bed_quantity: verification.bedQuantity ?? null,
    bed_dimensions: verification.bedDimensions || null,
    bed_configuration_verified: verification.bedConfigurationVerified,
    bedrooms: apartment.bedrooms ?? null,
    bathrooms: apartment.bathrooms ?? null,
    max_occupancy: apartment.maxOccupancy ?? null,
    max_occupancy_verified: verification.maxOccupancyVerified,
    size_sqm: apartment.sizeSqm ?? null,
    check_in: apartment.checkIn ?? null,
    check_out: apartment.checkOut ?? null,
    minimum_stay: apartment.minimumStay ?? null,
    facilities: apartment.facilities,
    house_rules: apartment.houseRules,
    starting_price_amount: apartment.startingPrice?.amount ?? null,
    starting_price_currency: apartment.startingPrice?.currency ?? null,
    booking_enabled: apartment.bookingEnabled,
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
    bed_type: null,
    bed_quantity: null,
    bed_dimensions: null,
    bed_configuration_verified: false,
    bedrooms: apartment.bedrooms ?? null,
    bathrooms: apartment.bathrooms ?? null,
    max_occupancy: apartment.maxOccupancy ?? null,
    max_occupancy_verified: false,
    size_sqm: apartment.sizeSqm ?? null,
    check_in: apartment.checkIn ?? null,
    check_out: apartment.checkOut ?? null,
    minimum_stay: apartment.minimumStay ?? null,
    facilities: apartment.facilities,
    house_rules: apartment.houseRules,
    starting_price_amount: apartment.startingPrice?.amount ?? null,
    starting_price_currency: apartment.startingPrice?.currency ?? null,
    booking_enabled: apartment.bookingEnabled,
    published,
  });
}
