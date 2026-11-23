import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const photoSchema = z.object({ src: z.string(), alt: z.string() });

export const apartmentGroupSchema = z.object({
  id: z.string().uuid(),
  identifier: z.enum(['A', 'B', 'C']),
  name: z.string(),
  description: z.string(),
  published: z.boolean(),
});

export const sharedFacilitySchema = z.object({
  id: z.string().uuid(),
  apartment_group_id: z.string().uuid(),
  facility_type: z.enum(['living_room', 'kitchen']),
  name: z.string(),
  description: z.string(),
  photos: z.array(photoSchema),
  published: z.boolean(),
});

export type ApartmentGroup = z.infer<typeof apartmentGroupSchema>;
export type SharedFacility = z.infer<typeof sharedFacilitySchema>;

export async function fetchApartmentGroups(includeUnpublished = false): Promise<ApartmentGroup[]> {
  if (!supabase) return [];
  let query = supabase.from('property_apartment_groups').select('id, identifier, name, description, published').order('identifier');
  if (!includeUnpublished) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load apartment groups: ${error.message}`);
  const parsed = apartmentGroupSchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Apartment group data returned an unexpected format.');
  return parsed.data;
}

export async function fetchPublicSharedFacilities(): Promise<SharedFacility[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('property_shared_facilities')
    .select('id, apartment_group_id, facility_type, name, description, photos, published')
    .eq('published', true)
    .order('facility_type');
  if (error) throw new Error(`Could not load shared facilities: ${error.message}`);
  const parsed = sharedFacilitySchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Shared facility data returned an unexpected format.');
  return parsed.data;
}

export async function fetchManagedSharedFacilities(): Promise<SharedFacility[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('property_shared_facilities')
    .select('id, apartment_group_id, facility_type, name, description, photos, published')
    .order('apartment_group_id')
    .order('facility_type');
  if (error) throw new Error(`Could not load shared facilities: ${error.message}`);
  const parsed = sharedFacilitySchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Shared facility data returned an unexpected format.');
  return parsed.data;
}
