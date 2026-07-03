import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Festival } from '@/src/types';

export type FestivalWithStatus = Festival & {
  displayStatus: 'coming_soon' | 'days_away' | 'months_away';
  daysAway?: number;
  monthsAway?: number;
};

function getFestivalStatus(festival: Festival, now: Date): FestivalWithStatus | null {
  const currentMonth = now.getMonth() + 1;
  const today = now.toISOString().split('T')[0];

  if (festival.month < currentMonth) return null;

  if (festival.month > currentMonth) {
    return {
      ...festival,
      displayStatus: 'months_away',
      monthsAway: festival.month - currentMonth,
    };
  }

  // Same month
  if (!festival.start_date) {
    return { ...festival, displayStatus: 'coming_soon' };
  }

  if (festival.start_date < today) return null;

  const startMs = new Date(festival.start_date).getTime();
  const daysAway = Math.ceil((startMs - now.getTime()) / 86400000);
  return { ...festival, displayStatus: 'days_away', daysAway };
}

export function useFestivals() {
  const [festivals, setFestivals] = useState<FestivalWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      const { data, error } = await supabase
        .from('festivals')
        .select('*')
        .gte('month', currentMonth)
        .order('month', { ascending: true });

      if (!error && data) {
        const filtered = (data as Festival[])
          .map((f) => getFestivalStatus(f, now))
          .filter((f): f is FestivalWithStatus => f !== null);
        setFestivals(filtered);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { festivals, loading };
}
