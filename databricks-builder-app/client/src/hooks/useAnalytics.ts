import { useState, useEffect, useCallback } from 'react';

export interface AnalyticsSummary {
  total_executions: number;
  executions_today: number;
  active_executions: number;
  success_rate: number;
  avg_duration_ms: number;
  total_tokens: number;
  tokens_today: number;
  estimated_cost_usd: number;
  top_projects: { name: string; count: number }[];
}

export interface TimeseriesPoint {
  date: string;
  executions: number;
  tokens: number;
  errors: number;
}

export interface ToolUsage {
  tool: string;
  count: number;
  error_count: number;
}

export function useAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, tsRes, toolRes] = await Promise.allSettled([
        fetch('/api/analytics/summary', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/analytics/timeseries?days=30', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/analytics/tools', { credentials: 'include' }).then((r) => r.json()),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (tsRes.status === 'fulfilled') setTimeseries(tsRes.value?.data ?? []);
      if (toolRes.status === 'fulfilled') setToolUsage(toolRes.value?.tools ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { summary, timeseries, toolUsage, loading, error, refresh: fetchAll };
}
