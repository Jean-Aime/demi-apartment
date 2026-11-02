export interface NavItem {
  label: string;
  to: string;
}

export const siteName = 'DEMI APARTMENT';

// PLACEHOLDER contact details. Replace with the property's confirmed details.
export const contact = {
  email: 'reservations@example.com',
  phone: '+250 000 000 000',
  address: 'Kimironko, Kigali, Rwanda',
} as const;

// Booking and staff routes are excluded until the backend is live.
export const navigation: NavItem[] = [
  { label: 'Apartments', to: '/apartments' },
  { label: 'Experience', to: '/experience' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

// Social profiles appear in the footer once confirmed by the property owner.
export const socialLinks: NavItem[] = [];

export interface Review {
  quote: string;
  guestName: string;
  stayLabel: string;
}

// Only verified guest reviews belong here. Leave empty until reviews are collected.
export const verifiedReviews: Review[] = [];
