import type { FilterConfig } from "@/types/config";
import { DropdownFilter } from "@/components/filters/DropdownFilter";
import { TextFilter } from "@/components/filters/TextFilter";
import { ToggleFilter } from "@/components/filters/ToggleFilter";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { DateFilter } from "@/components/filters/DateFilter";
import { NumberRangeFilter } from "@/components/filters/NumberRangeFilter";

export function FilterBar({ filters, values, options, loadingOptions, onValueChange }: {
  filters: FilterConfig[]; values: Record<string, unknown>; options: Record<string, unknown[]>;
  loadingOptions: Record<string, boolean>; onValueChange: (id: string, v: unknown) => void;
}) {
  if (!filters?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
        {filters.map(f => {
          const v = values[f.id], opts = options[f.id] ?? f.options ?? [], loading = loadingOptions[f.id] ?? false;
          switch (f.type) {
            case "dropdown": return <DropdownFilter key={f.id} config={f} value={v as string} options={opts} loading={loading} onChange={val => onValueChange(f.id, val)} />;
            case "daterange": return <DateRangeFilter key={f.id} config={f} value={v as any} onChange={val => onValueChange(f.id, val)} />;
            case "date": return <DateFilter key={f.id} config={f} value={v as string} onChange={val => onValueChange(f.id, val)} />;
            case "text": return <TextFilter key={f.id} config={f} value={v as string} onChange={val => onValueChange(f.id, val)} />;
            case "number_range": return <NumberRangeFilter key={f.id} config={f} value={v as any} onChange={val => onValueChange(f.id, val)} />;
            case "toggle": return <ToggleFilter key={f.id} config={f} value={v} onChange={val => onValueChange(f.id, val)} />;
            default: return null;
          }
        })}
    </div>
  );
}
