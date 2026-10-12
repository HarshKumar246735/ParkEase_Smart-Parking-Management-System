import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

/** Loads data with `fetcher`, then refreshes every `intervalMs` (0 = once). Pauses while the tab is hidden. */
export function usePolling(fetcher, deps = [], intervalMs = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await fetchRef.current();
      setData(d);
      setError('');
      return d;
    } catch (e) {
      setError(getErrorMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    if (!intervalMs) return undefined;
    const id = setInterval(() => { if (!document.hidden) load(true); }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs]);

  return { data, loading, error, reload: () => load(true), setData };
}
