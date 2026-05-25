import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';

export interface PageResult<T> {
  data: T[];
  page: number;
  totalPages: number;
}

interface State<T> {
  items: T[];
  page: number;
  totalPages: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
}

interface Options<T> {
  pageSize?: number;
  getId: (item: T) => string;
}

type Fetcher<T> = (params: {
  page: number;
  limit: number;
}) => Promise<PageResult<T>>;

export function useInfiniteList<T>(
  fetcher: Fetcher<T>,
  deps: unknown[],
  { pageSize = 25, getId }: Options<T>,
) {
  const [state, setState] = useState<State<T>>({
    items: [],
    page: 0,
    totalPages: 1,
    loading: true,
    refreshing: false,
    loadingMore: false,
    error: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // Track current page in a ref so the loader can compute the next page
  // without depending on setState's async batching.
  const pageRef = useRef(0);
  const totalPagesRef = useRef(1);
  // Monotonic request id — when deps change or a refresh fires while a
  // load-more is in flight, the older request is dropped.
  const reqIdRef = useRef(0);
  const inflightRef = useRef(false);

  const run = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      if (inflightRef.current && mode === 'more') return;
      if (mode === 'more' && pageRef.current >= totalPagesRef.current) return;

      inflightRef.current = true;
      const myReq = ++reqIdRef.current;

      setState((s) => ({
        ...s,
        loading: mode === 'initial' ? true : s.loading,
        refreshing: mode === 'refresh',
        loadingMore: mode === 'more',
        error: mode === 'initial' ? null : s.error,
      }));

      const nextPage = mode === 'more' ? pageRef.current + 1 : 1;

      try {
        const res = await fetcherRef.current({
          page: nextPage,
          limit: pageSize,
        });
        if (myReq !== reqIdRef.current) return;

        const incoming = res.data || [];
        const resolvedPage = res.page || nextPage;
        const resolvedTotalPages = res.totalPages || 1;

        pageRef.current = resolvedPage;
        totalPagesRef.current = resolvedTotalPages;

        setState((s) => {
          if (mode === 'more') {
            const seen = new Set(s.items.map(getId));
            const appended = incoming.filter((i) => !seen.has(getId(i)));
            return {
              items: [...s.items, ...appended],
              page: resolvedPage,
              totalPages: resolvedTotalPages,
              loading: false,
              refreshing: false,
              loadingMore: false,
              error: null,
            };
          }
          return {
            items: incoming,
            page: resolvedPage,
            totalPages: resolvedTotalPages,
            loading: false,
            refreshing: false,
            loadingMore: false,
            error: null,
          };
        });
      } catch (err) {
        if (myReq !== reqIdRef.current) return;
        const message = err instanceof ApiError ? err.message : 'Failed to load';
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          loadingMore: false,
          error: message,
        }));
      } finally {
        if (myReq === reqIdRef.current) inflightRef.current = false;
      }
    },
    [pageSize, getId],
  );

  useEffect(() => {
    reqIdRef.current++;
    inflightRef.current = false;
    pageRef.current = 0;
    totalPagesRef.current = 1;
    setState({
      items: [],
      page: 0,
      totalPages: 1,
      loading: true,
      refreshing: false,
      loadingMore: false,
      error: null,
    });
    run('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => run('refresh'), [run]);
  const reload = useCallback(() => run('initial'), [run]);
  const loadMore = useCallback(() => run('more'), [run]);

  return {
    items: state.items,
    page: state.page,
    totalPages: state.totalPages,
    loading: state.loading,
    refreshing: state.refreshing,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.page < state.totalPages,
    refresh,
    reload,
    loadMore,
    setItems: (updater: T[] | ((prev: T[]) => T[])) =>
      setState((s) => ({
        ...s,
        items:
          typeof updater === 'function'
            ? (updater as (p: T[]) => T[])(s.items)
            : updater,
      })),
  };
}
