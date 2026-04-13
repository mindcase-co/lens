import type { AppConfig } from "@/types/config";

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.statusText}`);
  return res.json();
}

export async function executeQuery(
  queryId: string,
  params: Record<string, unknown>,
  queryRegistry: Record<string, string>
): Promise<{ data: Record<string, unknown>[]; count: number }> {
  const query = queryRegistry[queryId];
  if (!query) throw new Error(`Unknown query ID: ${queryId}`);
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || res.statusText);
  }
  return res.json();
}

export async function fetchFilterOptions(
  queryId: string,
  params: Record<string, unknown>,
  queryRegistry: Record<string, string>
): Promise<{ options: unknown[] }> {
  const query = queryRegistry[queryId];
  if (!query) throw new Error(`Unknown query ID: ${queryId}`);
  const res = await fetch("/api/filter-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || res.statusText);
  }
  return res.json();
}

export function createWebSocket(): WebSocket | null {
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return new WebSocket(`${protocol}//${window.location.host}/ws`);
  } catch {
    return null;
  }
}
