import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'lighthouse-categories';

const DEFAULT_CATEGORIES = [
  'Soft Copy',
  'Processed Pictures',
  'Loss Experienced',
  'Studio Expense',
  'Personal Expense',
  'Airtime',
  'Airtime and Food',
  'Rent Reserved',
  'Rent Paid',
  'Studio Member Benefits',
  'Electricity Units',
  'Transport',
  'Studio Equipment Bought',
];

/**
 * Categories hook — DB-backed with realtime sync.
 *
 * - Loads the union of DEFAULT_CATEGORIES + every row from `public.categories`.
 * - Subscribes to realtime changes so newly-added admin categories appear
 *   instantly in every transaction form across the app (no reload required).
 * - Mirrors the merged list into localStorage as an offline fallback so the
 *   first render after a cold start is never empty.
 * - `addCategory` persists to the DB (idempotent) and to local state.
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });
  const mountedRef = useRef(true);

  const mergeAndStore = useCallback((incoming: string[]) => {
    const merged = Array.from(
      new Set([...DEFAULT_CATEGORIES, ...incoming.filter(Boolean)])
    );
    setCategories(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  }, []);

  const loadFromDb = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name', { ascending: true });
      if (error) {
        console.warn('[useCategories] DB load failed, using cache:', error.message);
        return;
      }
      const names = (data || [])
        .map((r: any) => (r?.name || '').toString().trim())
        .filter((n: string) => n.length > 0);
      if (mountedRef.current) mergeAndStore(names);
    } catch (e) {
      console.warn('[useCategories] DB load exception:', e);
    }
  }, [mergeAndStore]);

  useEffect(() => {
    mountedRef.current = true;
    loadFromDb();

    // Realtime: refresh whenever any category row changes anywhere.
    const channel = supabase
      .channel(`categories-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => loadFromDb()
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [loadFromDb]);

  const addCategory = useCallback(
    async (categoryName: string) => {
      const name = (categoryName || '').trim();
      if (!name) return;
      // Optimistic local update
      setCategories(prev => {
        if (prev.includes(name)) return prev;
        const next = [...prev, name];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      // Persist to DB (best-effort; ignore duplicates)
      try {
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('name', name)
          .maybeSingle();
        if (!existing) {
          await supabase.from('categories').insert([{ name }]);
        }
      } catch (e) {
        console.warn('[useCategories] addCategory DB persist failed:', e);
      }
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    } catch {}
  }, []);

  return {
    categories,
    addCategory,
    setCategories,
    resetToDefaults,
    refresh: loadFromDb,
  };
};
