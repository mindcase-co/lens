import type { FilterConfig } from "@/types/config";
import { Input } from "@/components/ui/input";

export function NumberRangeFilter({ config, value, onChange }: {
  config: FilterConfig; value: { min?: number; max?: number } | undefined;
  onChange: (v: { min: number; max: number }) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <div className="flex items-center gap-2">
        <Input type="number" className="h-9 w-20 text-sm" placeholder="Min" step={config.step}
          value={value?.min ?? config.min ?? ""} onChange={e => onChange({ min: Number(e.target.value), max: value?.max ?? config.max ?? 0 })} />
        <span className="text-xs text-muted-foreground">–</span>
        <Input type="number" className="h-9 w-20 text-sm" placeholder="Max" step={config.step}
          value={value?.max ?? config.max ?? ""} onChange={e => onChange({ min: value?.min ?? config.min ?? 0, max: Number(e.target.value) })} />
      </div>
    </div>
  );
}
