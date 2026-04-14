import type { FilterConfig } from "@/types/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function DropdownFilter({ config, value, options, loading, onChange }: {
  config: FilterConfig; value: string | undefined; options: unknown[]; loading: boolean;
  onChange: (v: string) => void;
}) {
  if (loading) return <Skeleton className="h-8 w-[150px] rounded-md" />;

  const opts = (options as string[]).map(String);

  if (config.multi) {
    return <MultiDropdown config={config} value={value} options={opts} onChange={onChange} />;
  }

  const isAll = !value || value === "ALL";

  return (
    <Select value={isAll ? "__ALL__" : value} onValueChange={(v) => onChange(v === "__ALL__" ? "ALL" : v)}>
      <SelectTrigger className="h-8 w-[150px] text-xs">
        <SelectValue placeholder={config.label}>
          {isAll ? <span className="text-muted-foreground">{config.label}</span> : value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__ALL__" className="text-muted-foreground">{config.label} (all)</SelectItem>
        {opts.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function MultiDropdown({ config, value, options, onChange }: {
  config: FilterConfig; value: string | undefined; options: string[];
  onChange: (v: string) => void;
}) {
  const selected = !value || value === "ALL" ? [] : value.split(",");
  const allSelected = selected.length === 0;

  const displayText = allSelected
    ? config.label
    : selected.length > 1
      ? `${config.label} (${selected.length})`
      : selected[0];

  const toggle = (opt: string, checked: boolean) => {
    const next = checked
      ? [...selected, opt]
      : selected.filter(s => s !== opt);
    onChange(next.length === 0 ? "ALL" : next.join(","));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" className="h-8 w-[150px] text-xs font-normal justify-between">
          <span className={`truncate ${allSelected ? "text-muted-foreground" : ""}`}>{displayText}</span>
        </Button>
      } />
      <DropdownMenuContent className="w-[180px]">
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={allSelected}
            onCheckedChange={() => onChange("ALL")}
          >
            All
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {options.map(opt => (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={selected.includes(opt)}
              onCheckedChange={(checked) => toggle(opt, checked === true)}
            >
              {opt}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
