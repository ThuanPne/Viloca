import { useState, useEffect } from 'react';
import { mockExperiences } from '../data/mock/experiences';
import type { Experience, ExperienceCategory } from '../types';

export function useExperiences(category?: ExperienceCategory | null) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Dùng mock data cho MVP, sau đổi thành Supabase query
    const filtered = category
      ? mockExperiences.filter((e) => e.category === category)
      : mockExperiences;
    setExperiences(filtered);
    setLoading(false);
  }, [category]);

  const featured = mockExperiences.filter((e) => e.isFeatured);

  return { experiences, featured, loading };
}
