import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import type { Trip } from '../types';

interface UpcomingTripResult {
  trip: Trip | null;
  daysUntil: number;
  loading: boolean;
}

export function useUpcomingTrip(): UpcomingTripResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [daysUntil, setDaysUntil] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setTrip(data as Trip);
        const ms = new Date(data.start_date).getTime() - Date.now();
        setDaysUntil(Math.max(0, Math.ceil(ms / 86_400_000)));
      }
      setLoading(false);
    }
    load();
  }, []);

  return { trip, daysUntil, loading };
}
