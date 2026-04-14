import type { FilterConfig } from "@/types/config";
import { Switch } from "@/components/ui/switch";

export function ToggleFilter({ config, value, onChange }: {
  config: FilterConfig; value: unknown; onChange: (v: boolean) => void;
}) {
  const isOn = value === true || value === config.on_value;
  return (
    <div className="flex items-center gap-1.5 h-8">
      <Switch checked={isOn} onCheckedChange={onChange} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
