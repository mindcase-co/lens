export function formatNumber(
  value: number | null | undefined,
  opts: { locale?: string; decimals?: number; compact?: boolean; prefix?: string; suffix?: string } = {}
): string {
  if (value == null) return "—";
  const { locale = "en-US", decimals, compact = false, prefix = "", suffix = "" } = opts;
  let formatted: string;
  if (compact) {
    formatted = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  } else {
    formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals ?? 2,
    }).format(value);
  }
  return `${prefix}${formatted}${suffix}`;
}

export function formatCurrency(value: number | null | undefined, currency = "USD", locale = "en-US", compact = false): string {
  if (value == null) return "—";
  if (compact) {
    const symbol = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(0).replace(/\d/g, "").trim();
    return `${symbol}${new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export function formatPercentage(value: number | null | undefined, locale = "en-US", decimals = 1): string {
  if (value == null) return "—";
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}%`;
}

export function formatDate(value: string | Date | null | undefined, format = "YYYY-MM-DD"): string {
  if (value == null) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return String(value);
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  switch (format) {
    case "MM/DD/YYYY": return `${m}/${d}/${y}`;
    case "DD/MM/YYYY": return `${d}/${m}/${y}`;
    case "MMM DD, YYYY": return `${months[date.getMonth()]} ${d}, ${y}`;
    default: return `${y}-${m}-${d}`;
  }
}

export function formatCellValue(
  value: unknown,
  format?: "currency" | "number" | "date" | "text" | "link" | "percentage",
  config?: { currency?: string; locale?: string; date_format?: string }
): string {
  if (value == null) return "—";
  switch (format) {
    case "currency": return formatCurrency(Number(value), config?.currency, config?.locale);
    case "number": return formatNumber(Number(value), { locale: config?.locale });
    case "percentage": return formatPercentage(Number(value), config?.locale);
    case "date": return formatDate(value as string, config?.date_format);
    default: return String(value);
  }
}

export function formatAxisValue(
  value: number,
  format: "currency" | "number" | "percentage" | "compact" = "number",
  config?: { currency?: string; locale?: string }
): string {
  switch (format) {
    case "currency": return formatCurrency(value, config?.currency, config?.locale, true);
    case "percentage": return `${value}%`;
    case "compact": return new Intl.NumberFormat(config?.locale || "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
    default: return formatNumber(value, { locale: config?.locale });
  }
}
