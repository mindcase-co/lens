import { useState, useCallback, useMemo, useEffect } from "react";
import type { FilterConfig } from "@/types/config";
import { fetchFilterOptions } from "@/api/client";

export function useFilters(filters: FilterConfig[], queryRegistry: Record<string, string>) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [options, setOptions] = useState<Record<string, unknown[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const defaults: Record<string, unknown> = {};
    for (const f of filters) {
      if (f.default !== undefined) defaults[f.id] = f.default;
      else if (f.type === "dropdown" && f.all) defaults[f.id] = "ALL";
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
    setValues(prev => {
      const next = { ...prev, [filterId]: value };
      for (const f of filters) {
        if (f.depends_on === filterId) {
          next[f.id] = f.all ? "ALL" : undefined;
          loadOpts(f, { [filterId]: value });
        }
      }
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
