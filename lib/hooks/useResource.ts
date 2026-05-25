import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';

interface State<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

export function useResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
  });
  // Hold the loader in a ref so we don't refetch on every render when consumers
  // pass inline arrow functions. Dependencies on the deps array drive refresh.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const fetcher = useCallback(
    async (mode: 'initial' | 'refresh') => {
      setState((s) => ({
        ...s,
        loading: mode === 'initial' ? true : s.loading,
        refreshing: mode === 'refresh',
        error: null,
      }));
      try {
        const data = await loaderRef.current();
        setState({ data, loading: false, refreshing: false, error: null });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to load';
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
    },
    [],
  );

  useEffect(() => {
    fetcher('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refresh: () => fetcher('refresh'),
    reload: () => fetcher('initial'),
    setData: (updater: T | ((prev: T | null) => T)) =>
      setState((s) => ({
        ...s,
        data:
          typeof updater === 'function'
            ? (updater as (prev: T | null) => T)(s.data)
            : updater,
      })),
  };
}
