import { useState, useCallback, useEffect } from "react";
import { Sun, Moon, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { readUrlState, updateUrlPage } from "@/hooks/useUrlState";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfig } from "@/hooks/useConfig";
import { ThemeCustomizerContext, useThemeCustomizerProvider } from "@/hooks/useThemeCustomizer";
import { AppSidebar } from "@/components/layout/Sidebar";
import { PageLayout } from "@/components/layout/PageLayout";
import { ThemeCustomizer } from "@/components/layout/ThemeCustomizer";

export default function App() {
  const { config, loading, error, reload } = useConfig();
  const themeCtx = useThemeCustomizerProvider();
  const { mode, toggleMode } = themeCtx;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(config?.sidebar?.default_collapsed ?? false);
  const [activePageId, setActivePageId] = useState(() => readUrlState().page ?? "");
  const [activeTab, setActiveTab] = useState(() => readUrlState().tab ?? "");

  if (config && !activePageId) {
    const urlState = readUrlState();
    const def = (urlState.page && config.pages.find(p => p.id === urlState.page)) ?? config.pages.find(p => p.default) ?? config.pages[0];
    if (def) {
      setActivePageId(def.id);
      const defTab = urlState.tab ?? def.tabs?.find(t => t.default)?.name ?? def.tabs?.[0]?.name ?? "";
      setActiveTab(defTab);
    }
  }

  // Sync page/tab to URL
  useEffect(() => {
    if (activePageId) updateUrlPage(activePageId, activeTab);
  }, [activePageId, activeTab]);

  const handlePageChange = useCallback((pageId: string) => {
    setActivePageId(pageId);
    const page = config?.pages.find(p => p.id === pageId);
    const defTab = page?.tabs?.find(t => t.default)?.name ?? page?.tabs?.[0]?.name ?? "";
    setActiveTab(defTab);
  }, [config]);

  const activePage = config?.pages.find(p => p.id === activePageId);
  const showSidebar = config && config.pages.length > 1;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <span className="text-sm text-muted-foreground">Loading dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
      <h1 className="text-xl font-bold text-destructive">Configuration Error</h1>
      <pre className="bg-card border border-border rounded-lg p-4 max-w-lg overflow-auto text-sm text-muted-foreground">{error}</pre>
      <Button variant="outline" onClick={reload}>Retry</Button>
    </div>
  );

  if (!config) return null;

  return (
    <ThemeCustomizerContext.Provider value={themeCtx}>
      <TooltipProvider>
        <div className="flex min-h-screen bg-background">
          {showSidebar && (
            <AppSidebar config={config.sidebar} pages={config.pages} activePageId={activePageId} activeTab={activeTab}
              onPageChange={handlePageChange} onTabChange={setActiveTab} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} themeMode={mode} />
          )}
          <main className="flex-1 min-w-0 overflow-x-hidden transition-all duration-300" style={{ marginLeft: showSidebar ? (sidebarCollapsed ? "4rem" : "16rem") : "0" }}>
            <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-8 bg-background/80 backdrop-blur-xl border-b border-border/40">
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="text-muted-foreground/70">{activePage?.name ?? config.title}</span>
                {activeTab && activePage?.tabs && activePage.tabs.length > 1 && (
                  <>
                    <ChevronRight className="size-3 text-muted-foreground/30" />
                    <span className="font-medium text-foreground">{activeTab}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {config.debug && <Badge variant="outline" className="text-[10px] font-bold text-amber-500 border-amber-500/30 mr-1">DEBUG</Badge>}
                <ThemeCustomizer />
                <button onClick={toggleMode} title="Toggle theme"
                  className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  {mode === "dark" ? <Sun className="size-[15px]" /> : <Moon className="size-[15px]" />}
                </button>
                <button onClick={reload} title="Refresh"
                  className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <RefreshCw className="size-[15px]" />
                </button>
              </div>
            </header>
            {activePage && (
              <PageLayout page={activePage} activeTab={activeTab} onTabChange={setActiveTab} queryRegistry={config._query_registry} themeMode={mode}
                appConfig={{ currency: config.currency, number_locale: config.number_locale, date_format: config.date_format, refresh: config.refresh }} />
            )}
          </main>
        </div>
      </TooltipProvider>
    </ThemeCustomizerContext.Provider>
  );
}
