import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useFavorite(locationId: string) {
  const user = useAuthStore((s) => s.user);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('location_id', locationId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFavorite(!!data);
        setLoading(false);
      });
  }, [user, locationId]);

  const toggle = useCallback(async () => {
    if (!user) return;

    if (isFavorite) {
      setIsFavorite(false);
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('location_id', locationId);
    } else {
      setIsFavorite(true);
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, location_id: locationId });
    }
  }, [user, locationId, isFavorite]);

  return { isFavorite, toggle, loading };
}
