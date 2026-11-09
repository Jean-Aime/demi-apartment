import { useEffect, useState } from 'react';
import { apartments as fallbackApartments } from '@/data/apartments';
import { fetchApartments } from '@/lib/propertyApartments';
import type { Apartment } from '@/data/apartments';

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>(fallbackApartments);
  const [loading, setLoading] = useState(Boolean(import.meta.env.VITE_SUPABASE_URL));
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchApartments()
      .then((items) => {
        if (active) {
          setApartments(items);
          setError('');
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : 'Could not load residences.';
        setError(message);
        console.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshCount]);

  return { apartments, loading, error, refresh: () => setRefreshCount((count) => count + 1) };
}
