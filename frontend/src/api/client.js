async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function fetchLatestMetrics() {
  return getJSON('/api/metrics/latest');
}

export function fetchSummary(days = 7) {
  return getJSON(`/api/history/summary?days=${days}`);
}

export function fetchHistory(entity, days = 7) {
  return getJSON(`/api/history/${entity}?days=${days}`);
}

export function fetchDailyAggregate(entity, days = 30) {
  return getJSON(`/api/history/${entity}/daily?days=${days}`);
}

export function fetchSleepDaily(days = 7) {
  return getJSON(`/api/history/sleep/daily?days=${days}`);
}
