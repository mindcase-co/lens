import { Calendar } from "lucide-react";
import type { FilterConfig } from "@/types/config";

export function DateFilter({ config, value, onChange }: {
  config: FilterConfig; value: string | undefined; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">{config.label}</span>
      <div className="relative">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
        <input type="date" value={value ?? ""} min={config.min_date} max={config.max_date}
          onChange={e => onChange(e.target.value)}
          className="h-8 pl-7 pr-3 w-[150px] text-[13px] font-medium bg-accent/40 border-0 rounded-md hover:bg-accent/70 focus:bg-accent/70 focus:outline-none focus:ring-1 focus:ring-ring/30 transition-colors" />
      </div>
    </div>
  );
}
