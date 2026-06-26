import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import type { TripItem, Trip } from '../types';

const SLOT_ORDER = { morning: 0, afternoon: 1, evening: 2 };

interface TodayScheduleResult {
  items: TripItem[];
  dayNumber: number;
  loading: boolean;
}

export function useTodaySchedule(trip: Trip | null): TodayScheduleResult {
  const [items, setItems] = useState<TripItem[]>([]);
  const [dayNumber, setDayNumber] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trip || trip.status !== 'active') {
      setItems([]);
      setDayNumber(0);
      return;
    }

    async function load() {
      setLoading(true);
      const startMs = new Date(trip!.start_date).getTime();
      const day = Math.floor((Date.now() - startMs) / 86_400_000) + 1;
      setDayNumber(day);

      const { data } = await supabase
        .from('trip_items')
        .select('*')
        .eq('trip_id', trip!.id)
        .eq('day_number', day);

      if (data) {
        const sorted = [...data].sort(
          (a, b) => (SLOT_ORDER[a.time_slot as keyof typeof SLOT_ORDER] ?? 3)
                  - (SLOT_ORDER[b.time_slot as keyof typeof SLOT_ORDER] ?? 3)
        );
        setItems(sorted as TripItem[]);
      }
      setLoading(false);
    }
    load();
  }, [trip?.id, trip?.status]);

  return { items, dayNumber, loading };
}
