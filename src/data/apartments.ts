import { apartmentDetailPhotos, apartmentPhotos, type Photo } from '@/data/media';

export interface Apartment {
  slug: string;
  number: string;
  name: string;
  summary: string;
  photo: Photo;
  photos: Photo[];
  bedConfiguration?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxOccupancy?: number;
  sizeSqm?: number;
  checkIn?: string;
  checkOut?: string;
  minimumStay?: number;
  facilities: string[];
  houseRules: string[];
  startingPrice?: { amount: number; currency: string };
}

// Placeholder room records. Replace names, descriptions and specifications with owner-confirmed details.
export const apartments: Apartment[] = apartmentPhotos.map((photo, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    slug: `residence-${number}`,
    number,
    name: `Room ${number}`,
    summary: `Details for Room ${number} are being confirmed by the property.`,
    photo,
    photos: [photo, apartmentDetailPhotos[index]],
    facilities: [],
    houseRules: [],
  };
});

export function findApartment(slug: string | undefined): Apartment | undefined {
  return apartments.find((apartment) => apartment.slug === slug);
}
