import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { FilterConfig } from "@/types/config";
import { fetchFilterOptions } from "@/api/client";
import { updateUrlFilters } from "@/hooks/useUrlState";

function parseUrlFilterValue(raw: string, type: string): unknown {
  if (type === "toggle") return raw === "true";
  if (type === "number_range" || type === "daterange") {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

// Snapshot URL filters ONCE at page load, before React does anything
const INITIAL_URL_FILTERS: Record<string, string> = {};
(() => {
  const params = new URLSearchParams(window.location.search);
  params.forEach((v, k) => {
    if (k !== "page" && k !== "tab") INITIAL_URL_FILTERS[k] = v;
  });
})();

export function useFilters(filters: FilterConfig[], queryRegistry: Record<string, string>) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize state from URL immediately — no effects needed
    const defaults: Record<string, unknown> = {};
    for (const f of filters) {
      if (INITIAL_URL_FILTERS[f.id] !== undefined) {
        defaults[f.id] = parseUrlFilterValue(INITIAL_URL_FILTERS[f.id], f.type);
      } else if (f.default !== undefined) {
        defaults[f.id] = f.default;
      } else if (f.type === "dropdown" && f.all) {
        defaults[f.id] = "ALL";
      }
    }
    return defaults;
  });
  const [options, setOptions] = useState<Record<string, unknown[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const userHasInteracted = useRef(false);

  // Re-initialize when filters change (page/tab navigation) but NOT on reload
  const prevFilterKey = useRef(filters.map(f => f.id).join(","));
  useEffect(() => {
    const key = filters.map(f => f.id).join(",");
    if (key === prevFilterKey.current && Object.keys(values).length > 0) return;
    prevFilterKey.current = key;

    const defaults: Record<string, unknown> = {};
    for (const f of filters) {
      // On page change, only use URL values if user hasn't navigated away
      if (!userHasInteracted.current && INITIAL_URL_FILTERS[f.id] !== undefined) {
        defaults[f.id] = parseUrlFilterValue(INITIAL_URL_FILTERS[f.id], f.type);
      } else if (f.default !== undefined) {
        defaults[f.id] = f.default;
      } else if (f.type === "dropdown" && f.all) {
        defaults[f.id] = "ALL";
      }
    }
    setValues(defaults);
  }, [filters]);

  useEffect(() => {
    for (const f of filters) {
      if (f.type === "dropdown" && f.query_id) loadOpts(f);
      else if (f.type === "dropdown" && f.options) setOptions(p => ({ ...p, [f.id]: f.options! }));
    }
  }, [filters, queryRegistry]);

  const loadOpts = useCallback(async (f: FilterConfig, parentParams: Record<string, unknown> = {}) => {
    if (!f.query_id) return;
    setLoadingOptions(p => ({ ...p, [f.id]: true }));
    try {
      const result = await fetchFilterOptions(f.query_id, parentParams, queryRegistry);
      setOptions(p => ({ ...p, [f.id]: result.options }));
    } catch { setOptions(p => ({ ...p, [f.id]: [] })); }
    finally { setLoadingOptions(p => ({ ...p, [f.id]: false })); }
  }, [queryRegistry]);

  const setValue = useCallback((filterId: string, value: unknown) => {
    userHasInteracted.current = true;
    setValues(prev => {
      const next = { ...prev, [filterId]: value };
      for (const f of filters) {
        if (f.depends_on === filterId) {
          next[f.id] = f.all ? "ALL" : undefined;
          loadOpts(f, { [filterId]: value });
        }
      }
      updateUrlFilters(next);
      return next;
    });
  }, [filters, loadOpts]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    for (const f of filters) {
      const v = values[f.id];
      if (f.type === "daterange") {
        const dv = v as { start?: string; end?: string } | undefined;
        params[`${f.id}_start`] = dv?.start ?? null;
        params[`${f.id}_end`] = dv?.end ?? null;
      } else if (f.type === "number_range") {
        const nv = v as { min?: number; max?: number } | undefined;
        params[`${f.id}_min`] = nv?.min ?? f.min ?? null;
        params[`${f.id}_max`] = nv?.max ?? f.max ?? null;
      } else if (f.type === "toggle") {
        params[f.id] = (v === true || v === f.on_value) ? (f.on_value ?? true) : (f.off_value ?? false);
      } else {
        params[f.id] = v ?? (f.type === "dropdown" && f.all ? "ALL" : null);
      }
    }
    return params;
  }, [values, filters]);

  return { values, setValue, options, loadingOptions, queryParams };
}
