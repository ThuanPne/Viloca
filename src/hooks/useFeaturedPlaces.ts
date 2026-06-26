import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Place } from '@/src/types';

export type PlaceWithCount = Place & { trip_count: number };

export function useFeaturedPlaces(limit = 6) {
  const [places, setPlaces] = useState<PlaceWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Join trips to count active/completed per place
      const { data, error } = await supabase
        .from('places')
        .select(`
          *,
          trips!trips_place_id_fkey(id, status)
        `)
        .limit(50);

      if (!error && data) {
        const ranked = (data as (Place & { trips: { id: string; status: string }[] })[])
          .map((p) => ({
            ...p,
            trip_count: (p.trips ?? []).filter((t) =>
              t.status === 'active' || t.status === 'completed'
            ).length,
          }))
          .sort((a, b) => {
            if (b.trip_count !== a.trip_count) return b.trip_count - a.trip_count;
            return a.name.localeCompare(b.name, 'vi');
          })
          .slice(0, limit)
          .map(({ trips: _trips, ...rest }) => rest as PlaceWithCount);

        setPlaces(ranked);
      }
      setLoading(false);
    }
    load();
  }, [limit]);

  return { places, loading };
}
