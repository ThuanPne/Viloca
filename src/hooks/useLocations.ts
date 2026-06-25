import { useState, useEffect } from 'react';
import supabase from '@/src/lib/supabase';
import type { Location } from '@/src/types';

export function useLocations(category?: string | null) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [featured, setFeatured]   = useState<Location[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);

    let q = supabase
      .from('locations')
      .select('id, name, district, city, category, vibes, price_per_person, duration_minutes, rating, hint, cover_image, images, address, description, short_description, opening_hours, coordinates, is_active, created_at')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(40);

    if (category) {
      q = q.eq('category', category) as typeof q;
    }

    q.then(({ data }) => {
      const locs = (data ?? []) as Location[];
      setLocations(locs);
      setFeatured(locs.filter((l) => (l.rating ?? 0) >= 4.2).slice(0, 6));
      setLoading(false);
    });
  }, [category]);

  return { locations, featured, loading };
}
