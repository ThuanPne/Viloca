import { useState, useEffect } from 'react';
import supabase from '@/src/lib/supabase';
import type { Category } from '@/src/types';

export function useCategories(): { categories: Category[]; loading: boolean } {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, emoji, sort_order')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setCategories(data as Category[]);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}
