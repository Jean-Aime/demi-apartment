export interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export interface Policy {
  slug: 'privacy' | 'terms' | 'cancellation';
  title: string;
  eyebrow: string;
  intro: string;
  sections: PolicySection[];
}

// DRAFT wording. Bracketed values are placeholders the property owner must confirm before publication.
export const policies: Record<Policy['slug'], Policy> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    intro:
      'This policy explains what personal information DEMI APARTMENT collects when you enquire or book, how we use it, and the choices you have.',
    sections: [
      {
        heading: 'Information we collect',
        paragraphs: [
          'When you submit a booking request we collect your name, email address, phone number, stay dates, number of guests and any notes you add.',
          'We do not store payment card details on this website.',
        ],
      },
      {
        heading: 'How we use your information',
        paragraphs: [
          'We use your details to respond to your request, prepare your stay and communicate about your reservation.',
          'We do not sell personal information.',
        ],
      },
      {
        heading: 'Retention and your rights',
        paragraphs: [
          'Requests are kept for [retention period] so that bookings and accounts can be managed. You may ask us to correct or delete your information at [contact email].',
        ],
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms and Conditions',
    eyebrow: 'Legal',
    intro:
      'These terms apply to your use of this website and to any booking request you make with DEMI APARTMENT.',
    sections: [
      {
        heading: 'Booking requests',
        paragraphs: [
          'A booking request is an enquiry. It is not a confirmed reservation until DEMI APARTMENT has confirmed availability and issued a written confirmation.',
        ],
      },
      {
        heading: 'Accuracy of information',
        paragraphs: [
          'Guests must provide accurate contact details and the correct number of occupants. Occupancy limits for each residence apply.',
        ],
      },
      {
        heading: 'Check-in and check-out',
        paragraphs: [
          'Check-in is from [check-in time] and check-out is by [check-out time], unless otherwise agreed in writing.',
        ],
      },
    ],
  },
  cancellation: {
    slug: 'cancellation',
    title: 'Cancellation Policy',
    eyebrow: 'Booking policies',
    intro:
      'We understand that plans change. This policy sets out how cancellations and changes to confirmed stays are handled.',
    sections: [
      {
        heading: 'Cancelling a confirmed stay',
        paragraphs: [
          'Cancellations received more than [number] days before arrival are refunded in full, less any processing charge. Cancellations received within [number] days of arrival are charged [percentage] of the stay.',
        ],
      },
      {
        heading: 'Changing your dates',
        paragraphs: [
          'Date changes are subject to availability and are confirmed in writing by DEMI APARTMENT.',
        ],
      },
      {
        heading: 'Early departure and no-shows',
        paragraphs: [
          'If a guest does not arrive and has not cancelled, the full stay may be charged. Early departures are charged for the nights stayed and the remaining nights as set out in the confirmation.',
        ],
      },
    ],
  },
};

export const policyLinks: { label: string; to: string }[] = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms and Conditions', to: '/terms' },
  { label: 'Cancellation Policy', to: '/cancellation' },
];
