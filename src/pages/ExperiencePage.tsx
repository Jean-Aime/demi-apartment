import PageHeader from '@/components/layout/PageHeader';
import Experience from '@/components/home/Experience';
import { media } from '@/data/media';

export default function ExperiencePage() {
  return (
    <main>
      <PageHeader
        eyebrow="The experience"
        title={
          <>
            Thoughtful stays, shaped around <span className="italic text-gold">you.</span>
          </>
        }
        intro="Discover the details, private spaces and warm welcome that shape a stay at DEMI APARTMENT."
        image={media.experienceLarge}
      />
      <Experience />
    </main>
  );
}
