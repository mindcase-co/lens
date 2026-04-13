import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { FilterConfig } from "@/types/config";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateFilter({ config, value, onChange }: {
  config: FilterConfig; value: string | undefined; onChange: (v: string) => void;
}) {
  const date = value ? new Date(value) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <Popover>
        <PopoverTrigger render={
          <Button variant="outline" className="justify-start font-normal h-9 min-w-[160px] text-sm">
            <CalendarDays className="size-3.5 mr-2 text-muted-foreground" />
            {date ? format(date, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
          </Button>
        } />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? d.toISOString().split("T")[0] : "")}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
