import PageHeader from '@/components/layout/PageHeader';
import ApartmentCollection from '@/components/home/ApartmentCollection';
import { media } from '@/data/media';
import { useApartments } from '@/hooks/useApartments';

export default function ApartmentsPage() {
  const { apartments } = useApartments();

  return (
    <main>
      <PageHeader
        eyebrow="The collection"
        title={
          <>
            Find the right <span className="italic text-gold">room</span> for your stay.
          </>
        }
        intro={`Explore all ${apartments.length} residences. Open any room to browse its photo gallery, stay details and amenities.`}
        image={media.introWide}
      />
      <ApartmentCollection />
    </main>
  );
}
