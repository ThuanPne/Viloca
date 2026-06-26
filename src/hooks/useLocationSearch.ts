import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Location } from '@/src/types';

const DEBOUNCE_MS = 300;

export const CITY_OPTIONS = [
  { code: null,  label: 'Tất cả' },
  { code: 'HN',  label: 'Hà Nội' },
  { code: 'SG',  label: 'TP. HCM' },
  { code: 'DN',  label: 'Đà Nẵng' },
] as const;

export type CityCode = (typeof CITY_OPTIONS)[number]['code'];

export function useLocationSearch() {
  const [query, setQuery]       = useState('');
  const [cityCode, setCityCode] = useState<CityCode>(null);
  const [results, setResults]   = useState<Location[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (query.trim().length === 0 && cityCode === null) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('search_locations', {
        search_query:     query.trim(),
        city_code:        cityCode ?? null,
        category_keyword: null,
      });
      setResults((data as Location[]) ?? []);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, cityCode]);

  return { query, setQuery, cityCode, setCityCode, results, loading };
}
