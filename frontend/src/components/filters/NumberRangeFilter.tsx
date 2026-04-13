import type { FilterConfig } from "@/types/config";

export function NumberRangeFilter({ config, value, onChange }: {
  config: FilterConfig; value: { min?: number; max?: number } | undefined;
  onChange: (v: { min: number; max: number }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">{config.label}</span>
      <div className="flex items-center gap-1.5 h-8 bg-accent/40 rounded-md px-2.5">
        <input type="number" placeholder="Min" step={config.step}
          value={value?.min ?? config.min ?? ""}
          onChange={e => onChange({ min: Number(e.target.value), max: value?.max ?? config.max ?? 0 })}
          className="w-16 bg-transparent border-0 text-[13px] font-medium focus:outline-none placeholder:text-muted-foreground/30" />
        <span className="text-[11px] text-muted-foreground/30">–</span>
        <input type="number" placeholder="Max" step={config.step}
          value={value?.max ?? config.max ?? ""}
          onChange={e => onChange({ min: value?.min ?? config.min ?? 0, max: Number(e.target.value) })}
          className="w-16 bg-transparent border-0 text-[13px] font-medium focus:outline-none placeholder:text-muted-foreground/30" />
      </div>
    </div>
  );
}
