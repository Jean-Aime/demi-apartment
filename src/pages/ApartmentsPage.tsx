import PageHeader from '@/components/layout/PageHeader';
import ApartmentCollection from '@/components/home/ApartmentCollection';
import { media } from '@/data/media';
import { useApartments } from '@/hooks/useApartments';

export default function ApartmentsPage() {
  const { apartments } = useApartments();

  return (
    <main>
      <PageHeader
        eyebrow="The residences"
        title={
          <>
            A private collection of <span className="italic text-gold">considered stays.</span>
          </>
        }
        intro={`Explore ${apartments.length} individual residences in Kimironko, Kigali. Discover each room’s photographs, details and amenities.`}
        image={media.introWide}
      />
      <ApartmentCollection />
    </main>
  );
}
