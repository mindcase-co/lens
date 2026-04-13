import * as React from "react";
import type { FilterConfig } from "@/types/config";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";

export function DropdownFilter({ config, value, options, loading, onChange }: {
  config: FilterConfig; value: string | undefined; options: unknown[]; loading: boolean;
  onChange: (v: string) => void;
}) {
  if (loading) return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
      <Skeleton className="h-9 w-[160px] rounded-md" />
    </div>
  );

  const opts = (options as string[]).map(String);
  const allOpts = config.all ? ["ALL", ...opts] : opts;

  if (config.multi) {
    return <MultiDropdown config={config} value={value} options={opts} onChange={onChange} />;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <Combobox
        items={allOpts}
        value={value ?? (config.all ? "ALL" : "")}
        onValueChange={(v) => onChange(v ?? "ALL")}
      >
        <ComboboxInput placeholder={config.placeholder ?? "Select..."} className="h-9 min-w-[160px] text-sm" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item === "ALL" ? "All" : item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function MultiDropdown({ config, value, options, onChange }: {
  config: FilterConfig; value: string | undefined; options: string[];
  onChange: (v: string) => void;
}) {
  const anchor = useComboboxAnchor();
  const selected = !value || value === "ALL" ? [] : value.split(",");

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{config.label}</label>
      <Combobox
        multiple
        autoHighlight
        items={options}
        value={selected}
        onValueChange={(v) => {
          const arr = v as string[];
          onChange(arr.length === 0 ? "ALL" : arr.join(","));
        }}
      >
        <ComboboxChips ref={anchor} className="min-w-[160px] max-w-[300px]">
          <ComboboxValue>
            {(values: string[]) => (
              <React.Fragment>
                {values.map((v: string) => (
                  <ComboboxChip key={v}>{v}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={values.length === 0 ? "All" : ""} />
              </React.Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
