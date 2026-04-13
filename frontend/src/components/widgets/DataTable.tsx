import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { TableConfig, TableColumnConfig } from "@/types/config";
import { useQuery, parseRefreshInterval } from "@/hooks/useQuery";
import { formatCellValue } from "@/lib/formatting";

export function DataTable({ config, queryParams, queryRegistry, refreshInterval, appConfig }: {
  config: TableConfig; queryParams: Record<string, unknown>; queryRegistry: Record<string, string>;
  refreshInterval?: string; appConfig?: { currency?: string; locale?: string; date_format?: string };
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(config.default_sort?.column ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(config.default_sort?.direction ?? "asc");
  const { data, loading, error, refresh } = useQuery(config.query_id, queryParams, queryRegistry, parseRefreshInterval(refreshInterval));

  const columns: TableColumnConfig[] = useMemo(() => {
    if (config.columns) return config.columns.filter(c => !c.hidden);
    if (!data.length) return [];
    return Object.keys(data[0]).map(k => ({ id: k }));
  }, [config.columns, data]);

  const sorted = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  const pageSize = config.page_size ?? 25;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleExport = () => {
    const headers = columns.map(c => c.label ?? c.id);
    const rows = sorted.map(r => columns.map(c => r[c.id] == null ? "" : String(r[c.id])));
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${config.title.replace(/\s+/g, "_").toLowerCase()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cellClass = (col: TableColumnConfig, value: unknown) => {
    if (!col.conditional) return "";
    const n = Number(value); if (isNaN(n)) return "";
    if (col.conditional.rule === "positive_negative") return n > 0 ? "text-emerald-500" : n < 0 ? "text-red-500" : "";
    if (col.conditional.rule === "threshold" && col.conditional.threshold != null) return n >= col.conditional.threshold ? "text-emerald-500" : "text-red-500";
    return "";
  };

  if (loading) return <Card className="border-border/50"><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
  if (error) return <Card className="border-border/50"><CardHeader><CardTitle className="text-[13px] font-semibold">{config.title}</CardTitle></CardHeader><CardContent className="flex flex-col items-center justify-center h-40 gap-2"><span className="text-sm text-destructive">Failed to load</span><button onClick={refresh} className="text-xs text-primary hover:underline">Retry</button></CardContent></Card>;

  const tableContent = (
    <>
      <CardHeader className="flex flex-row items-start justify-between p-0 pb-3">
        <div>
          <CardTitle className="text-[13px] font-semibold text-foreground/90">{config.title}</CardTitle>
          {config.description && <CardDescription className="text-[11px] mt-0.5">{config.description}</CardDescription>}
        </div>
        <div className="flex gap-0.5">
          <button onClick={handleExport} title="Export CSV"
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-colors">
            <Download className="size-3.5" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} title="Fullscreen"
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-colors">
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                {columns.map(col => (
                  <TableHead key={col.id}
                    className={`cursor-pointer select-none whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 h-9 ${col.pinned ? "sticky left-0 bg-card z-10" : ""}`}
                    onClick={() => handleSort(col.id)}>
                    <span className="flex items-center gap-1">
                      {col.label ?? col.id}
                      {sortCol === col.id && (sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((row, i) => (
                <TableRow key={i} className="border-border/30 hover:bg-accent/30 transition-colors">
                  {columns.map(col => (
                    <TableCell key={col.id}
                      className={`whitespace-nowrap text-[13px] py-2.5 ${col.pinned ? "sticky left-0 bg-card z-10" : ""} ${cellClass(col, row[col.id])}`}>
                      {col.format === "link" ? <a href={String(row[col.id])} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{String(row[col.id])}</a>
                        : formatCellValue(row[col.id], col.format, appConfig)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border/30">
          <span className="text-[11px] text-muted-foreground/50">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-1.5">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="size-7 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground/60 px-2">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="size-7 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </>
  );

  return fullscreen ? (
    <Dialog open onOpenChange={() => setFullscreen(false)}><DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto"><Card className="border-0 shadow-none">{tableContent}</Card></DialogContent></Dialog>
  ) : <Card className="h-full border-border/50 p-4">{tableContent}</Card>;
}
