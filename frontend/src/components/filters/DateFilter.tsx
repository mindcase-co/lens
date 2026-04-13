import type { FilterConfig } from "@/types/config";
import { Input } from "@/components/ui/input";

export function DateFilter({ config, value, onChange }: {
  config: FilterConfig; value: string | undefined; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <Input type="date" className="h-9 w-[160px] text-sm" value={value ?? ""} min={config.min_date} max={config.max_date} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
