import type { SidebarConfig, PageConfig } from "@/types/config";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  BarChart3, Users, ShoppingCart, FileText, BookOpen, ExternalLink, Home, Settings,
  LayoutDashboard, TrendingUp, CreditCard, Package, Layers, ChevronLeft, ChevronRight,
  Truck, Briefcase,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "bar-chart": BarChart3, users: Users, "shopping-cart": ShoppingCart, "file-text": FileText,
  "book-open": BookOpen, home: Home, settings: Settings, dashboard: LayoutDashboard,
  "trending-up": TrendingUp, "credit-card": CreditCard, package: Package, layers: Layers,
  truck: Truck, briefcase: Briefcase,
};
const getIcon = (name?: string) => ICONS[name ?? ""] ?? LayoutDashboard;

export function AppSidebar({ config, pages, activePageId, activeTab, onPageChange, onTabChange, collapsed, onToggleCollapse, themeMode }: {
  config?: SidebarConfig; pages: PageConfig[]; activePageId: string; activeTab: string;
  onPageChange: (id: string) => void; onTabChange: (tab: string) => void;
  collapsed: boolean; onToggleCollapse: () => void; themeMode: "light" | "dark";
}) {
  const pageMap = Object.fromEntries(pages.map(p => [p.id, p]));
  const sections = config?.sections;

  const renderPageLink = (id: string) => {
    const page = pageMap[id]; if (!page) return null;
    const Icon = getIcon(page.icon);
    const active = page.id === activePageId;
    const hasTabs = page.tabs && page.tabs.length > 1;

    if (collapsed && hasTabs) {
      return (
        <div key={page.id}>
          <Popover {...{ openOnHover: true, delay: 0, closeDelay: 200 } as any}>
            <PopoverTrigger render={
              <button onClick={() => onPageChange(page.id)}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-200 ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
                <Icon className="size-[18px]" />
              </button>
            } />
            <PopoverContent side="right" align="start" sideOffset={8} className="w-[160px] p-1.5">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{page.name}</p>
              {page.tabs!.map(tab => {
                const isActive = active && activeTab === tab.name;
                return (
                  <button key={tab.name} onClick={() => { if (!active) onPageChange(page.id); onTabChange(tab.name); }}
                    className={`flex items-center w-full px-2 py-1.5 rounded-md text-[13px] transition-colors ${isActive ? "text-foreground font-medium bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                    {tab.name}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    return (
      <div key={page.id}>
        <button onClick={() => onPageChange(page.id)} title={collapsed ? page.name : undefined}
          className={`flex items-center rounded-lg transition-all duration-200 ${
            active
              ? "bg-accent text-foreground font-semibold"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          } ${collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 w-full px-3 py-2"}`}>
          <Icon className={`shrink-0 ${collapsed ? "size-[18px]" : "size-4"}`} />
          {!collapsed && <span className="truncate text-[13px] font-medium">{page.name}</span>}
        </button>
        {hasTabs && !collapsed && (
          <div className="ml-[1.45rem] pl-3 border-l-[1.5px] border-border/40 space-y-px mt-0.5 mb-1.5">
            {page.tabs!.map(tab => {
              const isActive = active && activeTab === tab.name;
              return (
                <button key={tab.name} onClick={() => { if (!active) onPageChange(page.id); onTabChange(tab.name); }}
                  className={`flex items-center w-full px-2.5 py-1.5 rounded-md text-[12px] transition-all duration-200 ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/50 hover:text-foreground"
                  }`}>
                  <span className="truncate">{tab.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border/40 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Logo area — no border, clean */}
      <div className={`flex items-center h-14 ${collapsed ? "justify-center" : "justify-between px-5"}`}>
        {!collapsed && (() => {
          const logo = themeMode === "dark" && config?.logo_dark ? config.logo_dark : config?.logo;
          return logo
            ? <img src={logo} alt="Logo" className="h-5" />
            : <span className="text-sm font-semibold text-foreground truncate">{config?.title ?? "Dashboard"}</span>;
        })()}
        <button onClick={onToggleCollapse}
          className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-4 space-y-5">
        {sections ? sections.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                {section.label}
              </p>
            )}
            <div className="space-y-1">{section.pages.map(renderPageLink)}</div>
          </div>
        )) : (
          <div className="space-y-1">{pages.map(p => renderPageLink(p.id))}</div>
        )}

        {config?.external_links?.length ? (
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">Links</p>
            )}
            {config.external_links.map(link => {
              const Icon = getIcon(link.icon);
              return (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200">
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <><span className="truncate">{link.label}</span><ExternalLink className="size-3 ml-auto opacity-40" /></>}
                </a>
              );
            })}
          </div>
        ) : null}
      </nav>

      {/* Footer — subtle, no border */}
      {!collapsed && config?.footer && (
        <div className="px-5 py-3">
          <span className="text-[10px] text-muted-foreground/40">{config.footer}</span>
        </div>
      )}
    </aside>
  );
}
