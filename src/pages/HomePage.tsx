import Hero from '@/components/home/Hero';
import Introduction from '@/components/home/Introduction';
import Experience from '@/components/home/Experience';
import HomeApartmentShowcase from '@/components/home/HomeApartmentShowcase';
import ResidenceIndex from '@/components/apartments/ResidenceIndex';
import Architecture from '@/components/home/Architecture';
import HomeComfort from '@/components/home/HomeComfort';
import GalleryPreview from '@/components/home/GalleryPreview';
import HomeLocation from '@/components/home/HomeLocation';
import WhyDemi from '@/components/home/WhyDemi';
import FaqSection from '@/components/sections/FaqSection';
import ReservationCta from '@/components/sections/ReservationCta';
import ContactStrip from '@/components/sections/ContactStrip';
import GoldMarquee from '@/components/ui/GoldMarquee';
import { faqs } from '@/data/faqs';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Introduction />
      <GoldMarquee
        items={[
          'Kimironko · Kigali · Rwanda',
          'Eight private bedrooms',
          'Apartments A, B & C',
          'Direct reservations',
          'Architecture and interiors',
        ]}
      />
      <Experience />
      <HomeApartmentShowcase />
      <ResidenceIndex tone="warm" />
      <Architecture />
      <HomeComfort />
      <GalleryPreview />
      <HomeLocation />
      <WhyDemi />
      <FaqSection items={faqs.slice(0, 6)} />
      <ReservationCta />
      <ContactStrip />
    </main>
  );
}
