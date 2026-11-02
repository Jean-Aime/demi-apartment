export interface Photo {
  src: string;
  alt: string;
}

// Owner-provided property photography, served from /public.
// Every image is a 3:4 portrait shot; slots that crop to a wide format
// use photographs whose subject sits in the centre of the frame.
const photo = (file: string, alt: string): Photo => ({ src: `/${file}`, alt });

export const media = {
  hero: photo('IMG_8650.JPG.jpeg', 'Demi Apartment building lit at night from the entrance driveway'),
  introTall: photo('IMG_8665.JPG.jpeg', 'Bedroom with white linens, backlit headboard and full-height curtains'),
  introWide: photo('IMG_8778.JPG.jpeg', 'Open-plan living room with grey sofas, coffee table and television'),
  architecture: photo('IMG_8674.JPG.jpeg', 'Apartment building with terraced balconies and landscaped gardens'),
  architectureDetail: photo('IMG_8678.JPG.jpeg', 'Two-storey balcony with black steel framing and glass balustrades'),
  architectureSide: photo('IMG_8685.JPG.jpeg', 'Apartment facade at dusk with warm lighting beneath the balconies'),
  experienceLarge: photo('IMG_8768.JPG.jpeg', 'Contemporary kitchen with dark cabinetry, white worktops and pendant lighting'),
  experienceSmall: photo('IMG_8777.JPG.jpeg', 'Living room with grey sofas, coffee table and a round ceiling light'),
  kigali: photo('IMG_8663.JPG.jpeg', 'Upper terrace with seating overlooking the surrounding hills at twilight'),
  finalCta: photo('IMG_8776.JPG.jpeg', 'Bright living room with grey sofas, coffee table and sheer curtains'),
} as const;

export const apartmentPhotos: Photo[] = [
  photo('IMG_8664.JPG.jpeg', 'Bedroom with white bedding, dark accent wall and tiled floor'),
  photo('IMG_8666.JPG.jpeg', 'Bedroom with black panelled headboard, integrated lighting and grey curtains'),
  photo('IMG_8667.JPG.jpeg', 'Bedroom with wood-effect flooring and a built-in white wardrobe'),
  photo('IMG_8668.JPG.jpeg', 'Bedroom with wood flooring and a flush circular ceiling light'),
  photo('IMG_8670.JPG.jpeg', 'Bedroom with white bedding photographed from the window side'),
  photo('IMG_8671.JPG.jpeg', 'Bedroom with floating bedside shelves mounted to the headboard'),
  photo('IMG_8672.JPG.jpeg', 'Bedroom with a multi-door white wardrobe along the side wall'),
  photo('IMG_8758.JPG.jpeg', 'Bedroom with white linens, wooden nightstands and a deep blue accent wall'),
  photo('IMG_8759.JPG.jpeg', 'Bedroom with full-height curtains and grey tiled flooring'),
];

export const apartmentDetailPhotos: Photo[] = [
  photo('IMG_8760.JPG.jpeg', 'Bathroom with white vanity, toilet and a glass-enclosed shower'),
  photo('IMG_8767.JPG.jpeg', 'Fitted kitchen with dark cabinetry, oven, microwave and fridge-freezer'),
  photo('IMG_8771.JPG.jpeg', 'Open-plan living space connecting the dining area and the kitchen'),
  photo('IMG_8761.JPG.jpeg', 'Bathroom with white wall tiles and a glass shower enclosure'),
  photo('IMG_8772.JPG.jpeg', 'L-shaped kitchen with sink, hob and white worktops'),
  photo('IMG_8769.JPG.jpeg', 'Dining table with four grey upholstered chairs'),
  photo('IMG_8662.JPG.jpeg', 'Shaded balcony terrace with seating and a glass balustrade'),
  photo('IMG_8763.JPG.jpeg', 'Bright bathroom with white fixtures and large wall tiles'),
  photo('IMG_8770.JPG.jpeg', 'Dining area beside the kitchen with tiled flooring'),
];