export interface Faq {
  question: string;
  answer: string;
}

/**
 * Answers are limited to verified property information: the nine-residence
 * inventory, the Kimironko address, and the reservation and payment behaviour
 * implemented in this project. No rates, distances or amenities are asserted.
 */
export const faqs: Faq[] = [
  {
    question: 'Where is DEMI APARTMENT?',
    answer:
      'The property is in Kimironko, Kigali, Rwanda. The contact page includes a map of the neighbourhood and a directions link you can open in Google Maps.',
  },
  {
    question: 'How many residences are there?',
    answer:
      'Demi Apartment has eight individual private bedrooms: A1, A2, A3, B1, B2, B3, C1 and C2. They are arranged in Apartment A, Apartment B and Apartment C.',
  },
  {
    question: 'How does a reservation work?',
    answer:
      'Choose your dates and guest numbers, then select a residence. Depending on how that residence is configured, you either create a short temporary hold and continue to secure payment, or send a request that the property reviews before confirming anything.',
  },
  {
    question: 'Is a request the same as a confirmed booking?',
    answer:
      'No. A request for a residence that is not enabled for instant booking does not hold dates and does not take payment. The team verifies availability, capacity and the final price before contacting you.',
  },
  {
    question: 'Can I enter card details on this website?',
    answer:
      'No. The site never collects or stores card numbers or security codes. When online payment is enabled for a residence, payment is completed on Flutterwave’s secure hosted checkout and verified by the property’s server.',
  },
  {
    question: 'Are the residences private?',
    answer:
      'Yes. The booking flow reserves one private bedroom. Guests share the designated living room and kitchen with other guests staying in the same apartment group.',
  },
  {
    question: 'Why do some details say “to be confirmed”?',
    answer:
      'We only publish facts the property has verified, including bed configuration and maximum occupancy. Where a detail has not been verified, the website says so rather than estimating it.',
  },
  {
    question: 'Are Airbnb and Booking.com calendars connected?',
    answer:
      'Not yet. Availability on this website reflects reservations, temporary holds and blocked dates recorded here. Until channel synchronisation is configured, please contact the team if you are also booking through another platform.',
  },
];
