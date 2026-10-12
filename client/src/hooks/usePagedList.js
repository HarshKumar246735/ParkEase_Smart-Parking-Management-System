import { useEffect, useState } from 'react';
import { usePolling } from './usePolling.js';

/** Paged + filtered admin list. Resets to page 1 whenever a filter changes. */
export function usePagedList(fetcher, filters, intervalMs = 0) {
  const [page, setPage] = useState(1);
  const key = JSON.stringify(filters);
  useEffect(() => { setPage(1); }, [key]);
  const q = usePolling(() => fetcher({ ...filters, page, limit: 15 }), [key, page], intervalMs);
  return { ...q, page, setPage };
}
