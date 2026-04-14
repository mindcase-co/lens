import { useState, useMemo, useSyncExternalStore } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { BarChart3, TrendingUp, Activity, PieChart, CircleDot, BarChartHorizontal, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { ChartConfig } from "@/types/config";
import { useQuery, parseRefreshInterval } from "@/hooks/useQuery";
import { formatAxisValue } from "@/lib/formatting";

const CHART_TYPES = [
  { type: "bar", label: "Bar", icon: BarChart3 },
  { type: "line", label: "Line", icon: TrendingUp },
  { type: "area", label: "Area", icon: Activity },
  { type: "horizontal_bar", label: "Horizontal Bar", icon: BarChartHorizontal },
  { type: "pie", label: "Pie", icon: PieChart },
  { type: "donut", label: "Donut", icon: CircleDot },
] as const;

function getChartColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  const fallbacks = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
  return [1, 2, 3, 4, 5].map(i => {
    const hex = style.getPropertyValue(`--chart-hex-${i}`).trim();
    if (hex) return hex;
    return fallbacks[i - 1];
  });
}

// Track chart palette changes via CSS variable observation
let chartColorSnapshot = "";
const chartColorListeners = new Set<() => void>();
function getChartColorSnapshot() { return chartColorSnapshot; }
function subscribeChartColors(cb: () => void) {
  chartColorListeners.add(cb);
  return () => { chartColorListeners.delete(cb); };
}
// Observe --chart-1 changes on :root
if (typeof window !== "undefined") {
  const observer = new MutationObserver(() => {
    const next = getChartColors().join(",");
    if (next !== chartColorSnapshot) {
      chartColorSnapshot = next;
      chartColorListeners.forEach(cb => cb());
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  chartColorSnapshot = getChartColors().join(",");
}

const CHART_PAGE_SIZE = 8;

export function Chart({ config, queryParams, queryRegistry, refreshInterval, themeMode, appConfig }: {
  config: ChartConfig; queryParams: Record<string, unknown>; queryRegistry: Record<string, string>;
  refreshInterval?: string; themeMode?: "light" | "dark"; appConfig?: { currency?: string; locale?: string };
}) {
  const [typeOverride, setTypeOverride] = useState<string | null>(null);
  const [chartPage, setChartPage] = useState(0);
  const { data, loading, error, refresh } = useQuery(config.query_id, queryParams, queryRegistry, parseRefreshInterval(refreshInterval));
  const chartColorsKey = useSyncExternalStore(subscribeChartColors, getChartColorSnapshot);

  const effectiveConfig = typeOverride ? { ...config, chart_type: typeOverride } as ChartConfig : config;
  const currentType = effectiveConfig.chart_type;
  const CurrentIcon = CHART_TYPES.find(t => t.type === currentType)?.icon ?? BarChart3;

  // Pagination: show max 8 at a time for non-pie/donut charts
  const isPieOrDonut = currentType === "pie" || currentType === "donut";
  const isPaginated = !isPieOrDonut && data.length > CHART_PAGE_SIZE;
  const totalPages = isPaginated ? Math.ceil(data.length / CHART_PAGE_SIZE) : 1;
  const safePage = Math.min(chartPage, totalPages - 1);
  const pageData = isPaginated
    ? data.slice(safePage * CHART_PAGE_SIZE, (safePage + 1) * CHART_PAGE_SIZE)
    : data;

  // Reset page when data changes (e.g. filter change)
  const dataKey = data.length;
  const prevDataKey = useMemo(() => ({ current: dataKey }), []);
  if (prevDataKey.current !== dataKey) {
    prevDataKey.current = dataKey;
    if (chartPage !== 0) setChartPage(0);
  }

  const { options, series, chartType } = useMemo(() => {
    if (!pageData.length) return { options: {} as ApexOptions, series: [] as any, chartType: "bar" };
    return buildApex(effectiveConfig, pageData, themeMode ?? "light", appConfig);
  }, [pageData, effectiveConfig, themeMode, appConfig, chartColorsKey]);

  if (loading) return <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
  if (error) return <Card><CardHeader><CardTitle className="text-base">{config.title}</CardTitle></CardHeader><CardContent className="flex flex-col items-center justify-center h-64 gap-2"><span className="text-sm text-destructive">Failed to load chart</span><Button variant="outline" size="sm" onClick={refresh}>Retry</Button></CardContent></Card>;
  if (!data.length) return <Card><CardHeader><CardTitle className="text-base">{config.title}</CardTitle></CardHeader><CardContent className="flex items-center justify-center h-64 text-sm text-muted-foreground">No data available</CardContent></Card>;

  return (
      <Card className="h-full group border-border/50 flex flex-col p-4">
        <CardHeader className="flex flex-row items-start justify-between p-0 shrink-0">
          <div>
            <CardTitle className="text-[13px] font-semibold text-foreground/90">{config.title}</CardTitle>
            {config.description && <CardDescription className="text-[11px] mt-0.5">{config.description}</CardDescription>}
          </div>
          <div className="flex items-center gap-1">
            {isPaginated && (
              <div className="flex items-center gap-0.5">
                <button onClick={() => setChartPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
                  className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums min-w-[2rem] text-center">{safePage + 1}/{totalPages}</span>
                <button onClick={() => setChartPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
                  className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="h-7 px-2 flex items-center gap-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-colors" title="Change chart type">
                  <CurrentIcon className="size-3.5" />
                  <span className="text-[11px]">{CHART_TYPES.find(t => t.type === currentType)?.label ?? currentType}</span>
                </button>
              } />
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {CHART_TYPES.map(({ type, label, icon: Icon }) => (
                  <DropdownMenuItem key={type} onClick={() => setTypeOverride(type === config.chart_type ? null : type)}>
                    <Icon className="size-4" />
                    <span>{label}</span>
                    {currentType === type && <Check className="size-3.5 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          {isPieOrDonut && data.length > 0 ? (
            <div className="flex h-full items-center">
              <div className="flex-1 min-w-0 h-full">
                <ReactApexChart options={options} series={series} type={chartType as any} height="100%" />
              </div>
              <div className="w-[130px] shrink-0 h-full flex items-center pr-3">
                <div className="border border-border/50 rounded-lg px-3 py-2 overflow-y-auto w-full" style={{ maxHeight: "clamp(80px, 60%, 200px)" }}>
                  <div className="flex flex-col gap-1.5">
                    {data.map((r, i) => {
                      const xKey = effectiveConfig.x ?? "x";
                      const label = String(r[xKey] ?? "");
                      const color = (options.colors as string[])?.[i % ((options.colors as string[])?.length ?? 5)] ?? "#6366F1";
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[11px] text-muted-foreground truncate">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ReactApexChart options={options} series={series} type={chartType as any} height="100%" />
          )}
        </CardContent>
      </Card>
  );
}

function buildApex(config: ChartConfig, data: Record<string, unknown>[], mode: "light" | "dark", appConfig?: { currency?: string; locale?: string }) {
  const colors = config.colors ?? getChartColors();
  const isDark = mode === "dark";
  const xKey = config.x ?? "x";
  const categories = data.map(r => String(r[xKey] ?? ""));
  const fg = isDark ? "#94A3B8" : "#6B7280";
  const grid = isDark ? "#334155" : "#E5E7EB";

  const isPie = config.chart_type === "pie" || config.chart_type === "donut";
  const base: ApexOptions = {
    chart: { background: "transparent", toolbar: { show: false }, parentHeightOffset: 0, zoom: { enabled: false }, selection: { enabled: false }, ...(isPie ? {} : { offsetY: -10 }), animations: { enabled: true, speed: 500, dynamicAnimation: { enabled: true, speed: 350 } } },
    colors, grid: { borderColor: grid, strokeDashArray: 3, padding: isPie ? { left: 0, right: 0, bottom: 0, top: 0 } : { left: 4, right: 4, bottom: -10, top: -15 } },
    tooltip: {
      theme: mode,
      cssClass: "lens-tooltip",
      style: { fontSize: "12px" },
      y: { formatter: (val: number) => val != null ? val.toLocaleString() : "" },
    },
    legend: { show: config.legend !== "hidden", position: (config.legend === "hidden" ? "top" : config.legend ?? "top") as any, labels: { colors: fg }, ...(isPie ? {} : { offsetY: -5 }) },
    dataLabels: { enabled: config.data_labels ?? false }, theme: { mode: isDark ? "dark" : "light" },
  };

  if (config.chart_type === "pie" || config.chart_type === "donut") {
    const yKey = typeof config.y === "string" ? config.y : config.y?.[0] ?? "value";
    return {
      options: {
        ...base,
        labels: categories,
        legend: { show: false },
      },
      series: data.map(r => Number(r[yKey]) || 0),
      chartType: config.chart_type,
    };
  }

  if (config.chart_type === "combo" && config.series) {
    const series = config.series.map(s => ({ name: s.name, type: s.as, data: data.map(r => Number(r[s.name]) || 0) }));
    const hasRight = config.series.some(s => s.axis === "right");
    return {
      options: { ...base, xaxis: { categories, labels: { style: { colors: fg } } },
        yaxis: hasRight ? [
          { labels: { style: { colors: fg }, formatter: (v: number) => formatAxisValue(v, config.y_format, appConfig) } },
          { opposite: true, labels: { style: { colors: fg }, formatter: (v: number) => formatAxisValue(v, config.y_format, appConfig) } },
        ] : { labels: { style: { colors: fg }, formatter: (v: number) => formatAxisValue(v, config.y_format, appConfig) } },
        stroke: { width: config.series.map(s => s.as === "line" ? 3 : 0) },
      }, series, chartType: "line",
    };
  }

  let processed = [...data];
  if (config.sort === "value_asc" && typeof config.y === "string") processed.sort((a, b) => (Number(a[config.y as string]) || 0) - (Number(b[config.y as string]) || 0));
  else if (config.sort === "value_desc" && typeof config.y === "string") processed.sort((a, b) => (Number(b[config.y as string]) || 0) - (Number(a[config.y as string]) || 0));

  if (config.limit && config.limit < processed.length) {
    const yKey = typeof config.y === "string" ? config.y : config.y?.[0] ?? "value";
    const top = processed.slice(0, config.limit);
    const rest = processed.slice(config.limit);
    top.push({ [xKey]: "Other", [yKey]: rest.reduce((s, r) => s + (Number(r[yKey]) || 0), 0) } as Record<string, unknown>);
    processed = top;
  }

  const cats = processed.map(r => String(r[xKey] ?? ""));
  const yKeys = typeof config.y === "string" ? [config.y] : config.y ?? ["value"];
  const series = yKeys.map(k => ({ name: k, data: processed.map(r => Number(r[k]) || 0) }));

  let apexType = config.chart_type === "horizontal_bar" ? "bar" : config.chart_type;
  const hideLegend = series.length <= 1;
  const opts: ApexOptions = {
    ...base,
    legend: { ...base.legend, show: !hideLegend },
    chart: { ...base.chart, type: apexType as any, stacked: config.stacked },
    plotOptions: { bar: { horizontal: config.chart_type === "horizontal_bar", borderRadius: 4 } },
    xaxis: {
      categories: cats,
      labels: {
        style: { colors: fg },
        ...(config.chart_type === "horizontal_bar" && config.y_format ? { formatter: (v: string) => formatAxisValue(Number(v), config.y_format, appConfig) } : {}),
      },
      ...(config.x_label ? { title: { text: config.x_label, style: { color: fg } } } : {}),
    },
    yaxis: {
      labels: {
        style: { colors: fg },
        ...(config.chart_type !== "horizontal_bar" && config.y_format ? { formatter: (v: number) => formatAxisValue(v, config.y_format, appConfig) } : {}),
      },
      ...(config.y_label ? { title: { text: config.y_label, style: { color: fg } } } : {}),
    },
    stroke: { curve: "smooth", width: apexType === "line" || apexType === "area" ? 3 : 0 },
    fill: { type: apexType === "area" ? "gradient" : "solid", opacity: apexType === "area" ? 0.3 : 1 },
  };

  if (config.reference_line) {
    opts.annotations = { yaxis: [{ y: config.reference_line.value, borderColor: isDark ? "#F87171" : "#EF4444", strokeDashArray: 4,
      label: { text: config.reference_line.label ?? String(config.reference_line.value), style: { color: isDark ? "#F8FAFC" : "#111827", background: isDark ? "#1E293B" : "#FFFFFF" } } }] };
  }

  return { options: opts, series, chartType: apexType };
}
