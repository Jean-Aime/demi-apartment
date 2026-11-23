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
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Images must be 5 MB or smaller.');
  }

  const filenameExtension = file.name.match(/\.([a-z0-9]{1,10})$/i)?.[1]?.toLowerCase() ?? '';
  const heicMimeType = /^image\/hei[cf](?:$|-)/i.test(file.type);
  const isHeic = heicMimeType || filenameExtension === 'heic' || filenameExtension === 'heif';
  const commonImageMimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    bmp: 'image/bmp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  };
  if (!file.type.startsWith('image/') && !isHeic && !commonImageMimeTypes[filenameExtension]) {
    throw new Error('Choose an image file. Supported formats include HEIC and HEIF.');
  }

  let uploadBody: Blob = file;
  let contentType = file.type.startsWith('image/')
    ? file.type
    : isHeic ? 'image/heic' : commonImageMimeTypes[filenameExtension];
  let extension = filenameExtension || contentType.split('/')[1]?.split(/[;+]/)[0] || 'img';

  if (isHeic) {
    try {
      const { default: convertHeic } = await import('heic2any');
      const converted = await convertHeic({ blob: file, toType: 'image/jpeg', quality: 0.85 });
      uploadBody = Array.isArray(converted) ? converted[0] : converted;
      if (!uploadBody) throw new Error('The converter returned no image data.');
      contentType = 'image/jpeg';
      extension = 'jpg';
    } catch (cause) {
      const details = cause instanceof Error ? ` ${cause.message}` : '';
      throw new Error(`Could not convert this HEIC/HEIF image for web display.${details}`);
    }
  }

  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
  };
  extension = mimeExtensions[contentType] ?? extension;
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('property-media')
    .upload(path, uploadBody, { contentType, upsert: false });
  if (error) throw new Error(`Could not upload image: ${error.message}`);
  return supabase.storage.from('property-media').getPublicUrl(path).data.publicUrl;
}
