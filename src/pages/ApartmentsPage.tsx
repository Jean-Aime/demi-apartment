import PageHeader from '@/components/layout/PageHeader';
import ApartmentCollection from '@/components/home/ApartmentCollection';
import { media } from '@/data/media';

export default function ApartmentsPage() {
  return (
    <main>
      <PageHeader
        eyebrow="The collection"
        title={
          <>
            Find the right <span className="italic text-gold">room</span> for your stay.
          </>
        }
        intro="Explore all nine rooms. Open any room to browse its photo gallery, stay details and amenities."
        image={media.introWide}
      />
      <ApartmentCollection />
    </main>
  );
}
