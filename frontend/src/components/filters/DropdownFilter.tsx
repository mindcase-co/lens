import type { FilterConfig } from "@/types/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function DropdownFilter({ config, value, options, loading, onChange }: {
  config: FilterConfig; value: string | undefined; options: unknown[]; loading: boolean;
  onChange: (v: string) => void;
}) {
  if (loading) return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
      <Skeleton className="h-9 w-[140px] rounded-md" />
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <Select value={value ?? ""} onValueChange={(v) => { if (v) onChange(v); }}>
        <SelectTrigger className="min-w-[140px] h-9 text-sm">
          <SelectValue placeholder={config.placeholder ?? "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {config.all && <SelectItem value="ALL">All</SelectItem>}
          {(options as string[]).map(opt => <SelectItem key={String(opt)} value={String(opt)}>{String(opt)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
