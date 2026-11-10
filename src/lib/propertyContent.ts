import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const amenitySchema = z.object({
  id: z.uuid(),
  scope: z.enum(['room', 'shared']),
  apartment_slug: z.string().nullable(),
  name: z.string(),
  description: z.string(),
  photo_path: z.string().nullable(),
  photo_alt: z.string(),
  verified: z.boolean(),
  published: z.boolean(),
  display_order: z.number(),
});

const houseRuleSchema = z.object({
  id: z.uuid(),
  category: z.string(),
  title: z.string(),
  details: z.string(),
  verified: z.boolean(),
  published: z.boolean(),
  revision: z.number(),
  display_order: z.number(),
});

export type PropertyAmenity = z.infer<typeof amenitySchema>;
export type PropertyHouseRule = z.infer<typeof houseRuleSchema>;

export async function fetchPublicAmenities(): Promise<PropertyAmenity[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('property_amenities')
    .select('id, scope, apartment_slug, name, description, photo_path, photo_alt, verified, published, display_order')
    .eq('verified', true)
    .eq('published', true)
    .order('display_order')
    .order('name');
  if (error) throw new Error(`Could not load verified amenities: ${error.message}`);
  const parsed = amenitySchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Verified amenity data returned an unexpected format.');
  return parsed.data;
}

export async function fetchPublishedHouseRules(): Promise<PropertyHouseRule[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('property_house_rules')
    .select('id, category, title, details, verified, published, revision, display_order')
    .eq('verified', true)
    .eq('published', true)
    .order('display_order')
    .order('category');
  if (error) throw new Error(`Could not load published house rules: ${error.message}`);
  const parsed = houseRuleSchema.array().safeParse(data);
  if (!parsed.success) throw new Error('Published house rules returned an unexpected format.');
  return parsed.data;
}

export async function uploadPropertyImage(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Images must be 5 MB or smaller.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('property-media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Could not upload image: ${error.message}`);
  return supabase.storage.from('property-media').getPublicUrl(path).data.publicUrl;
}
