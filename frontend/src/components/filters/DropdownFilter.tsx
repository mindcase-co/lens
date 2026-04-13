import type { FilterConfig } from "@/types/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function DropdownFilter({ config, value, options, loading, onChange }: {
  config: FilterConfig; value: string | undefined; options: unknown[]; loading: boolean;
  onChange: (v: string) => void;
}) {
  if (loading) return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground/40">{config.label}</span>
      <Skeleton className="h-8 w-28 rounded-md" />
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">{config.label}</span>
      <Select value={value ?? ""} onValueChange={(v) => { if (v) onChange(v); }}>
        <SelectTrigger className="h-8 min-w-[100px] text-[13px] font-medium bg-accent/40 border-0 rounded-md hover:bg-accent/70 transition-colors gap-1 px-2.5">
          <SelectValue placeholder={config.placeholder ?? "Select..."} />
        </SelectTrigger>
        <SelectContent align="start">
          {config.all && <SelectItem value="ALL">All</SelectItem>}
          {(options as string[]).map(opt => <SelectItem key={String(opt)} value={String(opt)}>{String(opt)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
