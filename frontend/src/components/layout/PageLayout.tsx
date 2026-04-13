import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FilterBar } from "@/components/layout/FilterBar";
import { KPICard } from "@/components/widgets/KPICard";
import { Chart } from "@/components/widgets/Chart";
import { DataTable } from "@/components/widgets/DataTable";
import { TextBlock } from "@/components/widgets/TextBlock";
import { Divider } from "@/components/widgets/Divider";
import type { PageConfig, RowEntry, RowObject, ComponentConfig } from "@/types/config";
import { isRowObject, isTextBlock, isDividerBlock } from "@/types/config";
import { useFilters } from "@/hooks/useFilters";

export function PageLayout({ page, activeTab, onTabChange: _, queryRegistry, themeMode, appConfig }: {
  page: PageConfig; activeTab: string; onTabChange: (tab: string) => void;
  queryRegistry: Record<string, string>; themeMode: "light" | "dark";
  appConfig: { currency: string; number_locale: string; date_format: string; refresh?: string };
}) {
  const tabs = page.tabs ?? [];
  const activeTabConfig = tabs.find(t => t.name === activeTab);

  const allFilters = useMemo(() => [...(page.filters ?? []), ...(activeTabConfig?.filters ?? [])], [page.filters, activeTabConfig?.filters]);
  const { values, setValue, options, loadingOptions, queryParams } = useFilters(allFilters, queryRegistry);

  const rows = activeTabConfig?.rows ?? page.rows ?? [];
  const refreshInterval = page.refresh ?? appConfig.refresh;
  const fmtConfig = { currency: appConfig.currency, locale: appConfig.number_locale, date_format: appConfig.date_format };

  return (
    <div className="px-8 py-6">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="shrink-0">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">{page.name}</h2>
          {page.description && <p className="text-[13px] text-muted-foreground/60 mt-1">{page.description}</p>}
        </div>
        <FilterBar filters={allFilters} values={values} options={options} loadingOptions={loadingOptions} onValueChange={setValue} />
      </div>
      <div className="flex flex-col gap-8">
        {rows.map((entry, idx) => <RowRenderer key={idx} entry={entry} queryParams={queryParams} queryRegistry={queryRegistry} refreshInterval={refreshInterval} themeMode={themeMode} appConfig={fmtConfig} />)}
      </div>
    </div>
  );
}

function RowRenderer({ entry, queryParams, queryRegistry, refreshInterval, themeMode, appConfig }: {
  entry: RowEntry; queryParams: Record<string, unknown>; queryRegistry: Record<string, string>;
  refreshInterval?: string; themeMode: "light" | "dark"; appConfig: { currency: string; locale: string; date_format: string };
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (isTextBlock(entry)) return <TextBlock config={entry} />;
  if (isDividerBlock(entry)) return <Divider />;
  if (!isRowObject(entry)) return null;

  const row = entry as RowObject;
  const heightMap = { small: "h-[6rem]", medium: "h-[20rem]", large: "h-[28rem]", auto: "" };
  const heightClass = heightMap[row.height ?? "auto"];

  return (
    <div>
      {(row.title || row.collapsible) && (
        <div className="flex items-start gap-2 mb-4">
          {row.collapsible && (
            <button className="size-6 mt-0.5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          )}
          <div>
            {row.title && <h3 className="text-[13px] font-semibold text-foreground/80 uppercase tracking-wide">{row.title}</h3>}
            {row.description && <p className="text-[11px] text-muted-foreground/50 mt-0.5">{row.description}</p>}
          </div>
        </div>
      )}
      {!collapsed && (
        <div className={`flex gap-6 ${heightClass}`}>
          {row.items.map((item, idx) => (
            <div key={idx} className="min-w-0" style={{ flex: `1 1 ${100 / row.items.length}%` }}>
              <ComponentRenderer config={item} queryParams={queryParams} queryRegistry={queryRegistry} refreshInterval={refreshInterval} themeMode={themeMode} appConfig={appConfig} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentRenderer({ config, queryParams, queryRegistry, refreshInterval, themeMode, appConfig }: {
  config: ComponentConfig; queryParams: Record<string, unknown>; queryRegistry: Record<string, string>;
  refreshInterval?: string; themeMode: "light" | "dark"; appConfig?: { currency?: string; locale?: string; date_format?: string };
}) {
  switch (config.type) {
    case "kpi": return <KPICard config={config} queryParams={queryParams} queryRegistry={queryRegistry} refreshInterval={refreshInterval} appConfig={appConfig} />;
    case "chart": return <Chart config={config} queryParams={queryParams} queryRegistry={queryRegistry} refreshInterval={refreshInterval} themeMode={themeMode} appConfig={appConfig} />;
    case "table": return <DataTable config={config} queryParams={queryParams} queryRegistry={queryRegistry} refreshInterval={refreshInterval} appConfig={appConfig} />;
    default: return null;
  }
}
