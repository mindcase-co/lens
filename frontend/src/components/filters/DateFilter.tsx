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
    <Popover>
      <PopoverTrigger render={
        <Button variant="outline" className="justify-start font-normal h-8 w-[150px] px-2.5 text-xs">
          <CalendarDays className="size-3 mr-1.5 text-muted-foreground" />
          {date ? format(date, "MMM d, yyyy") : <span className="text-muted-foreground">{config.label}</span>}
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
  );
}
