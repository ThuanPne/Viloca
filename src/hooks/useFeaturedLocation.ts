import { useState, useEffect } from 'react';
import supabase from '@/src/lib/supabase';
import type { Location } from '@/src/types';

export function useFeaturedLocation(
  category: string | null
): { location: Location | null; loading: boolean } {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .eq('verified', true);

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    query.limit(1).maybeSingle().then(({ data, error }) => {
      setLocation(!error && data ? (data as Location) : null);
      setLoading(false);
    });
  }, [category]);

  return { location, loading };
}
