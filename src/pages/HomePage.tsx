import Hero from '@/components/home/Hero';
import Introduction from '@/components/home/Introduction';
import HomeApartmentShowcase from '@/components/home/HomeApartmentShowcase';
import HomeStayGuide from '@/components/home/HomeStayGuide';
import ExploreLinks from '@/components/home/ExploreLinks';
import HomeClosingFeature from '@/components/home/HomeClosingFeature';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Introduction />
      <HomeApartmentShowcase />
      <HomeStayGuide />
      <ExploreLinks />
      <HomeClosingFeature />
    </main>
  );
}
