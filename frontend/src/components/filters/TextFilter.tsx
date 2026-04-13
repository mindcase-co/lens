import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import type { FilterConfig } from "@/types/config";

export function TextFilter({ config, value, onChange }: {
  config: FilterConfig; value: string | undefined; onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => { setLocal(value ?? ""); }, [value]);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(e.target.value), 300);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">{config.label}</span>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
        <input type="text" value={local} onChange={handle}
          placeholder={config.placeholder ?? "Search..."}
          className="h-8 pl-7 pr-3 min-w-[140px] text-[13px] font-medium bg-accent/40 border-0 rounded-md hover:bg-accent/70 focus:bg-accent/70 focus:outline-none focus:ring-1 focus:ring-ring/30 transition-colors placeholder:text-muted-foreground/30" />
      </div>
    </div>
  );
}
