import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import type { FilterConfig } from "@/types/config";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const PRESETS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "MTD", label: "Month to date" },
  { key: "QTD", label: "Quarter to date" },
  { key: "YTD", label: "Year to date" },
  { key: "custom", label: "Custom" },
] as const;

function getPresetDates(p: string) {
  const now = new Date(), end = now.toISOString().split("T")[0];
  let s: Date;
  switch (p) {
    case "7d": s = new Date(now.getTime() - 7 * 864e5); break;
    case "30d": s = new Date(now.getTime() - 30 * 864e5); break;
    case "90d": s = new Date(now.getTime() - 90 * 864e5); break;
    case "MTD": s = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "QTD": s = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
    case "YTD": s = new Date(now.getFullYear(), 0, 1); break;
    default: s = new Date(now.getTime() - 30 * 864e5);
  }
  return { start: s.toISOString().split("T")[0], end };
}

export function DateRangeFilter({ config, value, onChange }: {
  config: FilterConfig;
  value: { start?: string; end?: string; preset?: string } | undefined;
  onChange: (v: { start: string; end: string; preset: string }) => void;
}) {
  const presets = config.presets
    ? [...config.presets.map(p => PRESETS.find(pr => pr.key === p) ?? { key: p, label: p }), { key: "custom", label: "Custom" }]
    : PRESETS;

  const activePreset = value?.preset ?? "30d";
  const [showCustom, setShowCustom] = useState(activePreset === "custom");
  const [rangeStart, setRangeStart] = useState<Date | undefined>(
    value?.start ? new Date(value.start) : undefined
  );
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(
    value?.end ? new Date(value.end) : undefined
  );

  const displayText = (() => {
    if (activePreset !== "custom") {
      return PRESETS.find(p => p.key === activePreset)?.label ?? activePreset;
    }
    if (value?.start && value?.end) {
      return `${format(new Date(value.start), "MMM d, yyyy")} – ${format(new Date(value.end), "MMM d, yyyy")}`;
    }
    return "Select dates";
  })();

  const handlePreset = (key: string) => {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const dates = getPresetDates(key);
    onChange({ ...dates, preset: key });
  };

  const handleDayClick = (day: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day);
      setRangeEnd(undefined);
    } else {
      const start = day < rangeStart ? day : rangeStart;
      const end = day < rangeStart ? rangeStart : day;
      setRangeStart(start);
      setRangeEnd(end);
      onChange({
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        preset: "custom",
      });
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">{config.label}</label>
      <Popover>
        <PopoverTrigger render={
          <button className="h-9 px-3 flex items-center gap-2 rounded-md border border-border/50 bg-background text-[13px] text-foreground hover:bg-accent/30 transition-colors">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <span className="truncate">{displayText}</span>
          </button>
        } />
        <PopoverContent align="start" sideOffset={4} className="w-auto p-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Select Date Range</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button key={p.key} onClick={() => handlePreset(p.key)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    activePreset === p.key
                      ? "bg-foreground text-background font-medium"
                      : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            {showCustom && (
              <div className="border-t border-border pt-3">
                <DayPicker
                  mode="range"
                  selected={rangeStart && rangeEnd ? { from: rangeStart, to: rangeEnd } : rangeStart ? { from: rangeStart, to: rangeStart } : undefined}
                  onDayClick={handleDayClick}
                  numberOfMonths={2}
                  classNames={{
                    root: "text-sm",
                    months: "flex gap-4",
                    month_caption: "text-sm font-medium mb-2 text-center",
                    nav: "flex items-center justify-between mb-2",
                    button_previous: "size-7 flex items-center justify-center rounded-md hover:bg-accent",
                    button_next: "size-7 flex items-center justify-center rounded-md hover:bg-accent",
                    table: "w-full border-collapse",
                    weekday: "text-[11px] text-muted-foreground font-medium w-8 text-center",
                    day: "w-8 h-8 text-center text-[13px]",
                    day_button: "w-full h-full rounded-md hover:bg-accent transition-colors",
                    selected: "bg-foreground text-background rounded-md",
                    range_start: "bg-foreground text-background rounded-l-md",
                    range_end: "bg-foreground text-background rounded-r-md",
                    range_middle: "bg-accent",
                    today: "font-bold",
                  }}
                />
                {rangeStart && rangeEnd && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(rangeStart, "MMM d, yyyy")} – {format(rangeEnd, "MMM d, yyyy")}
                  </p>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
