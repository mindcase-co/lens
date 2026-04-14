import { useState } from "react";
import type { FilterConfig } from "@/types/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NumberRangeFilter({ config, value, onChange }: {
  config: FilterConfig; value: { min?: number; max?: number } | undefined;
  onChange: (v: { min: number; max: number }) => void;
}) {
  const currentMin = value?.min ?? config.min ?? 0;
  const currentMax = value?.max ?? config.max ?? 100;
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);

  const hasValue = value?.min != null || value?.max != null;
  const displayText = hasValue ? `${currentMin} – ${currentMax}` : config.label;

  const apply = () => {
    onChange({ min: localMin, max: localMax });
  };

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="outline" className="justify-start font-normal h-8 w-[150px] px-2.5 text-xs">
          <span className={hasValue ? "" : "text-muted-foreground"}>{displayText}</span>
        </Button>
      } />
      <PopoverContent align="start" sideOffset={4} className="w-[200px] p-3">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium">{config.label}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-1 block">Min</label>
              <Input type="number" className="h-8 text-xs" step={config.step}
                value={localMin} onChange={e => setLocalMin(Number(e.target.value))} />
            </div>
            <span className="text-xs text-muted-foreground mt-4">–</span>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-1 block">Max</label>
              <Input type="number" className="h-8 text-xs" step={config.step}
                value={localMax} onChange={e => setLocalMax(Number(e.target.value))} />
            </div>
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={apply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
