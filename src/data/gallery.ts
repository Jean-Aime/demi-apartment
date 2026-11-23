import { apartmentDetailPhotos, apartmentPhotos, media, type Photo } from '@/data/media';

export type GalleryCategory = 'All' | 'The residences' | 'Interiors' | 'Architecture';

export interface GalleryPhoto extends Photo {
  category: Exclude<GalleryCategory, 'All'>;
  title: string;
}

const unitNumbers = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];

const detailTitles = [
  'Bathroom and shower',
  'Fitted kitchen',
  'Living and dining',
  'Bathroom detail',
  'Kitchen worktop',
  'Dining table',
  'Balcony terrace',
  'Bathroom light',
  'Dining beside the kitchen',
];

/** Every photograph here is property photography from /public. */
export const galleryPhotos: GalleryPhoto[] = [
  ...apartmentPhotos.map((photo, index) => ({
    ...photo,
    category: 'The residences' as const,
    title: `Residence ${unitNumbers[index] ?? String(index + 1)}`,
  })),
  ...apartmentDetailPhotos.map((photo, index) => ({
    ...photo,
    category: 'Interiors' as const,
    title: detailTitles[index] ?? 'Interior detail',
  })),
  ...[
    { photo: media.hero, title: 'The building at night' },
    { photo: media.architecture, title: 'Terraced balconies' },
    { photo: media.architectureDetail, title: 'Balcony framing' },
    { photo: media.architectureSide, title: 'Facade at dusk' },
    { photo: media.kigali, title: 'Upper terrace' },
    { photo: media.introWide, title: 'Living room' },
    { photo: media.experienceLarge, title: 'Kitchen and living' },
    { photo: media.experienceSmall, title: 'Living space' },
    { photo: media.introTall, title: 'Bedroom in daylight' },
  ].map(({ photo, title }) => ({
    ...photo,
    category: 'Architecture' as const,
    title,
  })),
];

export const galleryCategories: GalleryCategory[] = ['All', 'The residences', 'Interiors', 'Architecture'];
