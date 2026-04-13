import type { FilterConfig } from "@/types/config";
import { Switch } from "@/components/ui/switch";

export function ToggleFilter({ config, value, onChange }: {
  config: FilterConfig; value: unknown; onChange: (v: boolean) => void;
}) {
  const isOn = value === true || value === config.on_value;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">{config.label}</span>
      <div className="h-8 px-2.5 flex items-center gap-2 bg-accent/40 rounded-md">
        <Switch checked={isOn} onCheckedChange={onChange} />
        <span className="text-[12px] font-medium text-muted-foreground">{isOn ? (config.on_label ?? "On") : (config.off_label ?? "Off")}</span>
      </div>
    </div>
  );
}
