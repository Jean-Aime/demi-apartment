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
  bookingEnabled: boolean;
}

const unitNames = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

const photoDescriptions = [
  'A considered bedroom interior, photographed with white bedding, a dark accent wall and tiled flooring. The gallery also includes a bathroom view with a glass-enclosed shower.',
  'A bedroom photographed with a dark panelled headboard, integrated lighting and grey curtains. The gallery includes a fitted kitchen with dark cabinetry.',
  'A bedroom interior photographed with wood-effect flooring and a built-in white wardrobe. The gallery also shows an open-plan living and dining space beside the kitchen.',
  'A bedroom interior photographed with wood flooring and a circular ceiling light. The gallery includes a bathroom with white wall tiles and a glass shower enclosure.',
  'A bedroom photographed with white bedding from the window side. The gallery also shows an L-shaped kitchen with white worktops.',
  'A bedroom interior photographed with floating bedside shelves beside the headboard. The gallery also shows a dining table with upholstered chairs.',
  'A bedroom interior photographed with a multi-door white wardrobe. The gallery also includes a shaded terrace with seating and a glass balustrade.',
  'A bedroom photographed with white linens, wooden bedside tables and a deep blue accent wall. The gallery includes a bright bathroom with white fixtures.',
  'A bedroom interior photographed with full-height curtains and grey tiled flooring. The gallery also shows a dining area beside the kitchen.',
];

export const apartments: Apartment[] = apartmentPhotos.map((photo, index) => {
  const number = unitNames[index];
  const slugNumber = String(index + 1).padStart(2, '0');
  return {
    slug: `residence-${slugNumber}`,
    number,
    name: number,
    summary: photoDescriptions[index],
    photo,
    photos: [photo, apartmentDetailPhotos[index]],
    facilities: [],
    houseRules: [],
    bookingEnabled: false,
  };
});

export function findApartment(slug: string | undefined): Apartment | undefined {
  return apartments.find((apartment) => apartment.slug === slug);
}
