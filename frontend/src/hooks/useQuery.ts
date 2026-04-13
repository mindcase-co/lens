import { useState, useEffect, useCallback, useRef } from "react";
import { executeQuery } from "@/api/client";

export function useQuery(
  queryId: string | undefined,
  params: Record<string, unknown>,
  queryRegistry: Record<string, string>,
  autoRefreshMs?: number
) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);

  const run = useCallback(async () => {
    if (!queryId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const result = await executeQuery(queryId, params, queryRegistry);
      setData(result.data); setLastUpdated(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : "Query failed"); }
    finally { setLoading(false); }
  }, [queryId, JSON.stringify(params), queryRegistry]);

  useEffect(() => { run(); }, [run]);

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs <= 0) return;
    intervalRef.current = window.setInterval(run, autoRefreshMs);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [run, autoRefreshMs]);

  return { data, loading, error, refresh: run, lastUpdated };
}

export function parseRefreshInterval(refresh?: string): number | undefined {
  if (!refresh) return undefined;
  const match = refresh.match(/^(\d+)(s|m|h)$/);
  if (!match) return undefined;
  const v = parseInt(match[1], 10);
  return match[2] === "s" ? v * 1000 : match[2] === "m" ? v * 60000 : v * 3600000;
}
