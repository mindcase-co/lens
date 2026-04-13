import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { KPIConfig } from "@/types/config";
import { useQuery, parseRefreshInterval } from "@/hooks/useQuery";
import { formatNumber } from "@/lib/formatting";

function getTrendColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    up: style.getPropertyValue("--chart-hex-2").trim() || "#10B981",
    down: style.getPropertyValue("--chart-hex-4").trim() || "#EF4444",
  };
}

export function KPICard({ config, queryParams, queryRegistry, refreshInterval, appConfig }: {
  config: KPIConfig; queryParams: Record<string, unknown>; queryRegistry: Record<string, string>;
  refreshInterval?: string; appConfig?: { currency?: string; locale?: string };
}) {
  const { data, loading, error, refresh } = useQuery(config.query_id, queryParams, queryRegistry, parseRefreshInterval(refreshInterval));
  const row = data[0] ?? {};
  const current = row.current_value as number | null;
  const previous = row.previous_value as number | null;

  let delta: number | null = null;
  let dir: "up" | "down" | "flat" = "flat";
  if (current != null && previous != null && previous !== 0) {
    delta = ((current - previous) / Math.abs(previous)) * 100;
    dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  }

  const trendColors = getTrendColors();
  const trendColor = dir === "up" ? trendColors.up : dir === "down" ? trendColors.down : undefined;

  if (loading) return (
    <Card className="h-full border-border/50 p-4">
      <CardContent className="p-0 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-28" />
      </CardContent>
    </Card>
  );

  if (error) return (
    <Card className="h-full border-border/50 p-4">
      <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
        <span className="text-sm text-destructive">Failed to load</span>
        <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
      </CardContent>
    </Card>
  );

  return (
    <Card
      className="h-full overflow-hidden border-border/50 p-4"
      style={trendColor ? {
        background: `linear-gradient(135deg, ${trendColor}08 0%, transparent 60%)`,
        borderColor: `${trendColor}20`,
      } : undefined}
    >
      <CardContent className="p-0 flex flex-col justify-center h-full gap-1">
        {/* Title row with trend badge */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
            {config.title}
          </p>
          {delta !== null && trendColor && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
              style={{
                backgroundColor: `${trendColor}15`,
                color: trendColor,
              }}
            >
              {dir === "up" && <ArrowUpRight className="size-2.5" strokeWidth={3} />}
              {dir === "down" && <ArrowDownRight className="size-2.5" strokeWidth={3} />}
              {dir === "flat" && <Minus className="size-2.5" strokeWidth={3} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Big number */}
        <p className="text-[1.75rem] font-bold text-foreground leading-none tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatNumber(current, {
            locale: appConfig?.locale,
            decimals: config.decimals,
            compact: config.compact,
            prefix: config.prefix,
            suffix: config.suffix,
          })}
        </p>

        {/* Context line */}
        {config.description && (
          <p className="text-[11px] text-muted-foreground/60">{config.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
