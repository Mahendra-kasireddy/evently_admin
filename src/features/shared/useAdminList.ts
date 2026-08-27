import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';

export const PAGE_SIZE = 20;

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface AdminListState<T> {
  rows: T[];
  total: number;
  pages: number;
  page: number;
  search: string;
  /** What's in the search box right now — may be ahead of `search`. */
  draft: string;
  counts: Record<string, number> | null;
  loading: boolean;
  error: string | null;
  /** First and last row numbers on this page, for "1–20 of 74". */
  from: number;
  to: number;
  onSearchChange: (value: string) => void;
  /** Writes filter/page params into the URL. `null` clears a param. */
  setParam: (patch: Record<string, string | null>) => void;
  /** Reads any extra filter param this list uses. */
  param: (key: string) => string | null;
}

export interface AdminListOptions<T> {
  /** Extra URL params this list filters on, beyond `q` and `page`. */
  filters: readonly string[];
  fetchPage: (
    args: { search: string; page: number; limit: number; filters: Record<string, string> },
    signal: AbortSignal,
  ) => Promise<Paged<T>>;
  fetchCounts?: ((signal: AbortSignal) => Promise<Record<string, number>>) | undefined;
}

/**
 * The list machinery every admin section shares.
 *
 * Extracted after the third near-identical copy of it: filter/search/page state
 * in the URL (so a filtered list is a shareable link and the back button
 * works), a debounced search box, and one keyed piece of state stamped with the
 * query it answers — which is what stops a slow response overwriting a newer
 * one, and what lets `loading` be derived rather than stored.
 *
 * Every write happens in a settled promise callback, never synchronously in the
 * effect body.
 */
export function useAdminList<T>({
  filters,
  fetchPage,
  fetchCounts,
}: AdminListOptions<T>): AdminListState<T> {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  // Serialised so the effect depends on a primitive, not a fresh object.
  const filterKey = filters.map((f) => `${f}=${params.get(f) ?? ''}`).join('&');

  interface Loaded {
    key: string;
    rows: T[];
    total: number;
    pages: number;
    counts: Record<string, number> | null;
    error: string | null;
  }
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);

  const key = `${filterKey}|${search}|${page}`;

  // Re-sync the search box when the URL changes from outside (back button).
  // Adjusting during render is the supported pattern; an effect would cascade.
  if (search !== lastSearch) {
    setLastSearch(search);
    setDraft(search);
  }

  const setParam = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, value] of Object.entries(patch)) {
            if (value === null || value === '') next.delete(k);
            else next.set(k, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const debounce = useRef<number | null>(null);
  const onSearchChange = useCallback(
    (value: string) => {
      setDraft(value);
      if (debounce.current) window.clearTimeout(debounce.current);
      debounce.current = window.setTimeout(() => setParam({ q: value, page: null }), 300);
    },
    [setParam],
  );

  useEffect(() => {
    const controller = new AbortController();

    const active: Record<string, string> = {};
    for (const pair of filterKey.split('&')) {
      const [k, v] = pair.split('=');
      if (k && v) active[k] = v;
    }

    Promise.all([
      fetchPage({ search, page, limit: PAGE_SIZE, filters: active }, controller.signal),
      fetchCounts ? fetchCounts(controller.signal) : Promise.resolve(null),
    ])
      .then(([listed, tally]) => {
        if (controller.signal.aborted) return;
        setLoaded({
          key,
          rows: listed.data,
          total: listed.meta.total,
          pages: listed.meta.pages,
          counts: tally,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ key, rows: [], total: 0, pages: 1, counts: null, error: errorMessage(cause) });
      });

    return () => controller.abort();
    // `fetchPage` / `fetchCounts` are module-level functions in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, filterKey, search, page]);

  const total = loaded?.total ?? 0;

  return {
    rows: loaded?.rows ?? [],
    total,
    pages: loaded?.pages ?? 1,
    page,
    search,
    draft,
    counts: loaded?.counts ?? null,
    loading: loaded?.key !== key,
    error: loaded?.key === key ? loaded.error : null,
    from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: Math.min(total, page * PAGE_SIZE),
    onSearchChange,
    setParam,
    param: (k: string) => params.get(k),
  };
}
