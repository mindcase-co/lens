import { useState, useEffect, useCallback } from "react";
import type { AppConfig } from "@/types/config";
import { fetchConfig, createWebSocket } from "@/api/client";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setConfig(await fetchConfig()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load config"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!config?.debug) return;
    const ws = createWebSocket();
    if (!ws) return;
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "config_reload") { if (data.error) setError(data.error); else load(); }
    };
    return () => ws.close();
  }, [config?.debug, load]);

  return { config, loading, error, reload: load };
}
