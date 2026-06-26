import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import type { BookmarkStatus } from '../types';

type BookmarkMap = Record<string, BookmarkStatus>;

interface BookmarkHook {
  bookmarks: BookmarkMap;
  toggle: (experienceId: string) => Promise<void>;
  setStatus: (experienceId: string, status: BookmarkStatus | null) => Promise<void>;
  isBookmarked: (experienceId: string) => boolean;
  loading: boolean;
}

export function useBookmarks(): BookmarkHook {
  const [bookmarks, setBookmarks] = useState<BookmarkMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('bookmarks')
        .select('experience_id, status')
        .eq('user_id', session.user.id);

      if (data) {
        const map: BookmarkMap = {};
        data.forEach((b: { experience_id: string; status: BookmarkStatus }) => {
          map[b.experience_id] = b.status;
        });
        setBookmarks(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  const setStatus = useCallback(async (experienceId: string, status: BookmarkStatus | null) => {
    if (!userId) return;

    // Optimistic update
    const prev = { ...bookmarks };
    if (status === null) {
      setBookmarks((m) => { const n = { ...m }; delete n[experienceId]; return n; });
    } else {
      setBookmarks((m) => ({ ...m, [experienceId]: status }));
    }

    let error: unknown;
    if (status === null) {
      ({ error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('experience_id', experienceId));
    } else {
      ({ error } = await supabase
        .from('bookmarks')
        .upsert({ user_id: userId, experience_id: experienceId, status },
                 { onConflict: 'user_id,experience_id' }));
    }

    if (error) setBookmarks(prev); // rollback
  }, [userId, bookmarks]);

  const toggle = useCallback(async (experienceId: string) => {
    const current = bookmarks[experienceId];
    if (!current) {
      await setStatus(experienceId, 'want');
    } else if (current === 'want') {
      await setStatus(experienceId, 'planned');
    } else if (current === 'planned') {
      await setStatus(experienceId, 'done');
    } else {
      await setStatus(experienceId, null);
    }
  }, [bookmarks, setStatus]);

  const isBookmarked = useCallback(
    (experienceId: string) => experienceId in bookmarks,
    [bookmarks]
  );

  return { bookmarks, toggle, setStatus, isBookmarked, loading };
}
