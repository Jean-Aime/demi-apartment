import Architecture from '@/components/home/Architecture';
import HomeClosingFeature from '@/components/home/HomeClosingFeature';
import PageHeader from '@/components/layout/PageHeader';
import { media } from '@/data/media';

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        eyebrow="About DEMI APARTMENT"
        title={
          <>
            A residence shaped by <span className="italic text-gold">clarity and restraint.</span>
          </>
        }
        intro="Learn about the architectural ideas, materials and choices behind the property."
        image={media.introWide}
      />
      <Architecture />
      <HomeClosingFeature />
    </main>
  );
}
