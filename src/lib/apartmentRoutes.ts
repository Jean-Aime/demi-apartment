import type { Apartment } from '@/data/apartments';

function hashSlug(slug: string, seed: number, multiplier: number): string {
  let hash = seed;
  for (let index = 0; index < slug.length; index += 1) {
    hash = Math.imul(hash ^ slug.charCodeAt(index), multiplier);
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function getApartmentPublicId(apartment: Pick<Apartment, 'slug'>): string {
  return `${hashSlug(apartment.slug, 0x811c9dc5, 0x01000193)}-${hashSlug(apartment.slug, 0x9e3779b9, 0x85ebca6b)}`;
}

export function getApartmentPath(apartment: Pick<Apartment, 'slug'>): string {
  return `/apartments/${getApartmentPublicId(apartment)}`;
}
