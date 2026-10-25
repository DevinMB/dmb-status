import { useState, useEffect, useCallback } from 'react';
import { fetchLatestMetrics } from '../api/client.js';

const POLL_INTERVAL = 30_000;

export function useMetrics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchLatestMetrics();
      setData(result);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, error, loading, refreshing, lastRefresh, refresh };
}
