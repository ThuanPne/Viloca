import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import type { PackingItem } from '../types';

const TEMPLATES: Record<string, string[]> = {
  beach:         ['Kem chống nắng', 'Kính râm', 'Đồ bơi', 'Dép lê', 'Khăn tắm'],
  mountain:      ['Áo khoác', 'Giày trekking', 'Thuốc cảm', 'Đèn pin', 'Áo mưa'],
  international: ['Hộ chiếu', 'Visa', 'Thẻ ngoại tệ', 'Adapter điện', 'Bảo hiểm du lịch'],
  business:      ['Laptop', 'Sạc dự phòng', 'Suit', 'Card visit', 'Tài liệu'],
};

export type PackingTemplate = keyof typeof TEMPLATES;

interface PackingProgress {
  packed: number;
  total: number;
  percent: number;
}

interface PackingHook {
  items: PackingItem[];
  progress: PackingProgress;
  loading: boolean;
  addItem: (name: string, category?: string) => Promise<void>;
  togglePacked: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addTemplate: (key: PackingTemplate) => Promise<void>;
}

export function usePackingList(tripId: string | undefined): PackingHook {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId) { setItems([]); return; }

    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('packing_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order', { ascending: true });
      if (data) setItems(data as PackingItem[]);
      setLoading(false);
    }
    load();
  }, [tripId]);

  const addItem = useCallback(async (name: string, category = 'other') => {
    if (!tripId) return;
    const sort_order = items.length;
    const { data } = await supabase
      .from('packing_items')
      .insert({ trip_id: tripId, name, category, sort_order })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data as PackingItem]);
  }, [tripId, items.length]);

  const togglePacked = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const is_packed = !item.is_packed;
    // Optimistic
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_packed } : i));
    const { error } = await supabase
      .from('packing_items')
      .update({ is_packed })
      .eq('id', id);
    if (error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_packed: !is_packed } : i));
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('packing_items').delete().eq('id', id);
  }, []);

  const addTemplate = useCallback(async (key: PackingTemplate) => {
    if (!tripId) return;
    const names = TEMPLATES[key] ?? [];
    const baseOrder = items.length;
    const rows = names.map((name, i) => ({
      trip_id: tripId,
      name,
      category: key,
      sort_order: baseOrder + i,
    }));
    const { data } = await supabase
      .from('packing_items')
      .insert(rows)
      .select();
    if (data) setItems((prev) => [...prev, ...(data as PackingItem[])]);
  }, [tripId, items.length]);

  const packed = items.filter((i) => i.is_packed).length;
  const total  = items.length;
  const progress: PackingProgress = {
    packed,
    total,
    percent: total === 0 ? 0 : Math.round((packed / total) * 100),
  };

  return { items, progress, loading, addItem, togglePacked, deleteItem, addTemplate };
}
