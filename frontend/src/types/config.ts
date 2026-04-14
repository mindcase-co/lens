/**
 * TypeScript types matching the Lens backend config schema exactly.
 * The frontend receives this from GET /api/config.
 * Queries are replaced with query_ids by the backend.
 */

export interface AppConfig {
  title: string;
  logo?: string;
  favicon?: string;
  theme: "light" | "dark" | "system";
  port: number;
  base_path: string;
  refresh?: string;
  date_format: string;
  number_locale: string;
  currency: string;
  timezone: string;
  debug: boolean;
  sidebar?: SidebarConfig;
  pages: PageConfig[];
  _query_registry: Record<string, string>;
}

export interface SidebarConfig {
  logo?: string;
  logo_dark?: string;
  title?: string;
  default_collapsed: boolean;
  sections?: SidebarSection[];
  external_links?: ExternalLink[];
  footer?: string;
}

export interface SidebarSection {
  label: string;
  pages: string[];
}

export interface ExternalLink {
  label: string;
  icon?: string;
  url: string;
}

export interface PageConfig {
  id: string;
  name: string;
  icon?: string;
  default?: boolean;
  description?: string;
  refresh?: string;
  filters?: FilterConfig[];
  tabs?: TabConfig[];
  rows?: RowEntry[];
}

export interface TabConfig {
  name: string;
  default?: boolean;
  badge_query_id?: string;
  filters?: FilterConfig[];
  rows: RowEntry[];
}

export interface FilterConfig {
  id: string;
  type: "dropdown" | "daterange" | "date" | "text" | "number_range" | "toggle";
  label: string;
  placeholder?: string;
  query_id?: string;
  options?: string[];
  multi?: boolean;
  all?: boolean;
  presets?: string[];
  min_date?: string;
  max_date?: string;
  min?: number;
  max?: number;
  step?: number;
  range_query_id?: string;
  on_label?: string;
  off_label?: string;
  on_value?: string | number | boolean;
  off_value?: string | number | boolean;
  default?: string | number | boolean;
  depends_on?: string;
  required?: boolean;
}

// --- Row entries ---

export interface RowObject {
  title?: string;
  description?: string;
  height?: "small" | "medium" | "large" | "auto";
  collapsible?: boolean;
  items: ComponentConfig[];
}

export interface TextBlock {
  type: "text";
  content: string;
  title?: string;
}

export interface DividerBlock {
  type: "divider";
}

export type RowEntry = RowObject | TextBlock | DividerBlock;

export function isRowObject(entry: RowEntry): entry is RowObject {
  return "items" in entry;
}

export function isTextBlock(entry: RowEntry): entry is TextBlock {
  return "type" in entry && (entry as TextBlock).type === "text";
}

export function isDividerBlock(entry: RowEntry): entry is DividerBlock {
  return "type" in entry && (entry as DividerBlock).type === "divider";
}

// --- Components ---

export interface KPIConfig {
  type: "kpi";
  title: string;
  description?: string;
  query_id: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
  icon?: string;
  status_query_id?: string;
}

export interface ChartConfig {
  type: "chart";
  chart_type: "bar" | "horizontal_bar" | "line" | "area" | "pie" | "donut" | "combo";
  title: string;
  description?: string;
  query_id: string;
  x?: string;
  y?: string | string[];
  stacked?: boolean;
  colors?: string[];
  x_label?: string;
  y_label?: string;
  y_format?: "currency" | "number" | "percentage" | "compact";
  legend?: "top" | "bottom" | "right" | "hidden";
  data_labels?: boolean;
  sort?: "value_asc" | "value_desc" | "none";
  limit?: number;
  reference_line?: { value: number; label?: string };
  series?: { name: string; as: "bar" | "line"; axis?: "left" | "right" }[];
}

export interface TableColumnConfig {
  id: string;
  label?: string;
  format?: "currency" | "number" | "date" | "text" | "link" | "percentage";
  hidden?: boolean;
  pinned?: boolean;
  conditional?: {
    rule: "positive_negative" | "threshold";
    threshold?: number;
  };
}

export interface TableConfig {
  type: "table";
  title: string;
  description?: string;
  query_id: string;
  page_size?: number;
  default_sort?: { column: string; direction: "asc" | "desc" };
  columns?: TableColumnConfig[];
  detail?: { enabled: boolean; query_id: string; key: string };
}

export type ComponentConfig = KPIConfig | ChartConfig | TableConfig;
