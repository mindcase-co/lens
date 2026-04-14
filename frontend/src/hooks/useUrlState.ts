/**
 * Read and write state to URL search params for persistence across reloads.
 */

export function readUrlState(): { page?: string; tab?: string; filters?: Record<string, string> } {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") ?? undefined;
  const tab = params.get("tab") ?? undefined;
  const filters: Record<string, string> = {};
  params.forEach((v, k) => {
    if (k !== "page" && k !== "tab") filters[k] = v;
  });
  return { page, tab, filters: Object.keys(filters).length ? filters : undefined };
}

let lastWrittenPage = "";

export function updateUrlPage(page: string, tab: string) {
  const params = new URLSearchParams(window.location.search);
  const pageChanged = lastWrittenPage !== "" && page !== lastWrittenPage;
  lastWrittenPage = page;

  params.set("page", page);
  if (tab) params.set("tab", tab); else params.delete("tab");

  // Only clear filter params when navigating to a DIFFERENT page, not on reload
  if (pageChanged) {
    for (const key of [...params.keys()]) {
      if (key !== "page" && key !== "tab") params.delete(key);
    }
  }

  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

export function updateUrlFilters(filters: Record<string, unknown>) {
  const params = new URLSearchParams(window.location.search);
  // Clear all non-page/tab params first, then set new ones
  for (const key of [...params.keys()]) {
    if (key !== "page" && key !== "tab") params.delete(key);
  }
  for (const [k, v] of Object.entries(filters)) {
    if (v == null || v === "" || v === "ALL" || v === false) continue;
    if (typeof v === "object") {
      params.set(k, JSON.stringify(v));
    } else {
      params.set(k, String(v));
    }
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}
