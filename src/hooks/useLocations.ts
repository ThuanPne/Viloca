import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Location } from '@/src/types';

export function useLocations(limit = 6, categoryFilter?: string | null) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .eq('verified', true)
        .not('photos', 'is', null)
        .limit(limit);

      if (categoryFilter) {
        query = query.ilike('category', `%${categoryFilter}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setLocations(data as Location[]);
      }
      setLoading(false);
    }
    load();
  }, [limit, categoryFilter]);

  return { locations, loading };
}
