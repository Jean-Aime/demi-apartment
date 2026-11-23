import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';
import { useApartments } from '@/hooks/useApartments';
import { getApartmentPath } from '@/lib/apartmentRoutes';
import {
  fetchApartmentGroups,
  fetchPublicSharedFacilities,
  type ApartmentGroup,
  type SharedFacility,
} from '@/lib/propertyApartmentGroups';
import { subscribeToPropertyDataChanges } from '@/lib/propertyDataEvents';
import SectionLabel from '@/components/ui/SectionLabel';

export default function ApartmentCollection() {
  const { apartments, error } = useApartments();
  const [groups, setGroups] = useState<ApartmentGroup[]>([]);
  const [facilities, setFacilities] = useState<SharedFacility[]>([]);
  const [groupsError, setGroupsError] = useState('');

  useEffect(() => {
    let active = true;
    const loadGroups = async () => {
      try {
        const [nextGroups, nextFacilities] = await Promise.all([
          fetchApartmentGroups(),
          fetchPublicSharedFacilities(),
        ]);
        if (active) {
          setGroups(nextGroups);
          setFacilities(nextFacilities);
          setGroupsError('');
        }
      } catch (cause) {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : 'Apartment information could not be loaded.';
        setGroupsError(message);
        console.error(message);
      }
    };
    void loadGroups();
    const unsubscribe = subscribeToPropertyDataChanges(() => { void loadGroups(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  return (
    <section className="bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-site px-5 sm:px-6 md:px-12 lg:px-16">
        <div className="grid gap-8 border-b border-ink-200/70 pb-8 md:grid-cols-12 md:items-end md:gap-x-8">
          <Reveal className="md:col-span-7">
            <SectionLabel index="01">The apartment collection</SectionLabel>
            <h2 className="display mt-5 text-[clamp(2.4rem,4.6vw,4.5rem)] text-ink-900">
              Explore {apartments.length} private <span className="italic text-gold-ink">bedrooms.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="md:col-span-4 md:col-start-9">
            <p className="text-[0.95rem] leading-[1.85] text-ink-500">
              Demi Apartment is arranged in three shared apartment environments. Each reservation is for an individual private bedroom.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 space-y-16 md:space-y-24">
          {groups.map((group) => {
            const rooms = apartments.filter((room) => room.apartmentGroup === group.identifier);
            const shared = facilities.filter((facility) =>
              groups.find((item) => item.id === facility.apartment_group_id)?.identifier === group.identifier,
            );
            return (
              <section key={group.id} className="border-t border-ink-200/70 pt-10">
                <Reveal>
                  <SectionLabel>Apartment {group.identifier}</SectionLabel>
                  <h3 className="display mt-4 text-[clamp(2.2rem,4vw,3.7rem)] text-ink-900">{group.name}</h3>
                  <p className="mt-4 max-w-2xl text-[0.95rem] leading-[1.85] text-ink-500">
                    {group.description} Guests reserve a private bedroom and share the designated living room and kitchen with other guests staying in this apartment.
                  </p>
                </Reveal>
                {shared.length > 0 && (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {shared.map((facility) => (
                      <article key={facility.id} className="border border-ink-100 bg-paper-warm p-5">
                        {facility.photos[0] && (
                          <img src={facility.photos[0].src} alt={facility.photos[0].alt} className="mb-4 aspect-[4/3] w-full object-cover" loading="lazy" />
                        )}
                        <p className="eyebrow text-gold-ink">{facility.facility_type === 'living_room' ? 'Shared living room' : 'Shared kitchen'}</p>
                        <h4 className="mt-2 font-display text-xl text-ink-900">{facility.name}</h4>
                        {facility.description && <p className="mt-2 text-sm leading-relaxed text-ink-500">{facility.description}</p>}
                      </article>
                    ))}
                  </div>
                )}
                <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((apartment) => (
                    <article key={apartment.slug} className="border border-ink-100 bg-paper-warm">
                      <Link to={getApartmentPath(apartment)} className="group block">
                        <img src={apartment.photo.src} alt={apartment.photo.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </Link>
                      <div className="p-5">
                        <p className="eyebrow text-gold-ink">Apartment {group.identifier}</p>
                        <h4 className="mt-2 font-display text-2xl text-ink-900">{apartment.name}</h4>
                        <p className="mt-3 text-sm leading-relaxed text-ink-500">
                          Private bedroom with access to Apartment {group.identifier}&apos;s shared living room and kitchen.
                        </p>
                        <Link to={getApartmentPath(apartment)} className="link-line mt-5 text-ink-900">
                          Explore bedroom <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {error && (
          <p className="mt-10 text-[0.7rem] text-ink-400" role="status">
            Showing the saved bedroom list while live property data is unavailable.
          </p>
        )}
        {groupsError && <p className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{groupsError}</p>}
      </div>
    </section>
  );
}
