import { useState, useEffect, useCallback } from 'react';
import { fetchSummary } from '../api/client.js';

// Trend summaries change slowly (they're period averages), so this refreshes
// far less often than the live metrics poll.
const POLL_INTERVAL = 5 * 60_000;

export function useSummary(days = 7) {
  const [summary, setSummary] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchSummary(days);
      setSummary(result.summary);
    } catch {
      // Trend chips are a non-critical enhancement — fail silently and keep stale data.
    }
  }, [days]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return summary;
}
