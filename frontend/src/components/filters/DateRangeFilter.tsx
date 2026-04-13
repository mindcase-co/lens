import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { FilterConfig } from "@/types/config";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function getPresetRange(p: string): DateRange {
  const now = new Date();
  let from: Date;
  switch (p) {
    case "7d": from = new Date(now.getTime() - 7 * 864e5); break;
    case "30d": from = new Date(now.getTime() - 30 * 864e5); break;
    case "90d": from = new Date(now.getTime() - 90 * 864e5); break;
    case "MTD": from = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "QTD": from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
    case "YTD": from = new Date(now.getFullYear(), 0, 1); break;
    default: from = new Date(now.getTime() - 30 * 864e5);
  }
  return { from, to: now };
}

const PRESETS = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "MTD", label: "MTD" },
  { key: "QTD", label: "QTD" },
  { key: "YTD", label: "YTD" },
];

export function DateRangeFilter({ config, value, onChange }: {
  config: FilterConfig;
  value: { start?: string; end?: string; preset?: string } | undefined;
  onChange: (v: { start: string; end: string; preset: string }) => void;
}) {
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (value?.start && value?.end) return { from: new Date(value.start), to: new Date(value.end) };
    return getPresetRange(value?.preset ?? "30d");
  });
  const [activePreset, setActivePreset] = React.useState(value?.preset ?? "30d");

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    setActivePreset("custom");
    if (range?.from && range?.to) {
      onChange({
        start: range.from.toISOString().split("T")[0],
        end: range.to.toISOString().split("T")[0],
        preset: "custom",
      });
    }
  };

  const handlePreset = (key: string) => {
    const range = getPresetRange(key);
    setDate(range);
    setActivePreset(key);
    onChange({
      start: range.from!.toISOString().split("T")[0],
      end: range.to!.toISOString().split("T")[0],
      preset: key,
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <Popover>
        <PopoverTrigger render={
          <Button variant="outline" className="justify-start px-2.5 h-9 font-normal text-sm">
            <CalendarIcon className="size-4 text-muted-foreground" />
            {date?.from ? (
              date.to ? (
                <span>{format(date.from, "LLL dd, y")} – {format(date.to, "LLL dd, y")}</span>
              ) : (
                <span>{format(date.from, "LLL dd, y")}</span>
              )
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </Button>
        } />
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex gap-1.5 px-3 pt-3">
            {PRESETS.map(p => (
              <Button key={p.key} variant={activePreset === p.key ? "default" : "outline"} size="sm"
                className="text-xs h-7 px-2" onClick={() => handlePreset(p.key)}>
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
