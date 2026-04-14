import { useState, useEffect, useRef } from "react";
import type { FilterConfig } from "@/types/config";
import { Input } from "@/components/ui/input";

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
    <Input type="text" value={local} onChange={handle} placeholder={config.placeholder ?? config.label} className="h-8 w-[150px] text-xs" />
  );
}
