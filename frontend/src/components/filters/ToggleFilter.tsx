import type { FilterConfig } from "@/types/config";
import { Switch } from "@/components/ui/switch";

export function ToggleFilter({ config, value, onChange }: {
  config: FilterConfig; value: unknown; onChange: (v: boolean) => void;
}) {
  const isOn = value === true || value === config.on_value;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <div className="flex items-center gap-2 h-9">
        <Switch checked={isOn} onCheckedChange={onChange} />
        <span className="text-sm text-muted-foreground">{isOn ? (config.on_label ?? "On") : (config.off_label ?? "Off")}</span>
      </div>
    </div>
  );
}
