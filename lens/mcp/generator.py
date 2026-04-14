"""Auto-generate Lens YAML configs from data analysis."""

from __future__ import annotations

import yaml

from lens.mcp.introspect import NUMERIC_TYPES, DATE_TYPES, TEXT_TYPES, BOOL_TYPES


def generate_config(
    schema: dict,
    title: str = "Dashboard",
    connection_string: str = "",
    tables: list[str] | None = None,
    analysis: dict | None = None,
) -> str:
    """Generate a complete Lens YAML config.

    If `analysis` is provided (from analyze_data), uses it for smarter generation.
    Falls back to schema-only heuristics if not.
    """
    source_tables = analysis["tables"] if analysis else schema["tables"]
    fks = (analysis or schema).get("foreign_keys", [])

    if tables:
        source_tables = [t for t in source_tables if t["name"] in tables]

    if not source_tables:
        return "# No tables found to generate config from."

    fk_map: dict[str, list[dict]] = {}
    for fk in fks:
        fk_map.setdefault(fk["from_table"], []).append(fk)

    pages = []
    sidebar_pages = []

    for table in source_tables:
        page = _generate_page(table, fk_map.get(table["name"], []), source_tables)
        pages.append(page)
        sidebar_pages.append(table["name"])

    config = {
        "app": {
            "title": title,
            "theme": "system",
            "port": 8080,
            "debug": True,
            "database": {
                "connection": connection_string,
                "pool_size": 10,
                "query_timeout": 30,
            },
            "sidebar": {
                "title": title,
                "footer": f"Powered by Lens",
                "sections": [{"label": "Pages", "pages": sidebar_pages}],
            },
            "pages": pages,
        }
    }

    return yaml.dump(config, default_flow_style=False, sort_keys=False, allow_unicode=True)


def _generate_page(table: dict, fks: list[dict], all_tables: list[dict]) -> dict:
    """Generate a page config for a single table."""
    name = table["name"]
    columns = table["columns"]

    # Classify columns using analysis data if available
    numeric_cols = [c for c in columns if c["type"] in NUMERIC_TYPES]
    date_cols = [c for c in columns if c["type"] in DATE_TYPES]
    text_cols = [c for c in columns if c["type"] in TEXT_TYPES]
    bool_cols = [c for c in columns if c["type"] in BOOL_TYPES]

    # Separate low/high cardinality text columns
    low_card_text = [c for c in text_cols if c.get("distinct_count", 999) <= 20]
    high_card_text = [c for c in text_cols if c.get("distinct_count", 999) > 20]

    # Detect monetary and percentage columns
    monetary_cols = [c for c in numeric_cols if c.get("is_monetary", False)]
    pct_cols = [c for c in numeric_cols if c.get("is_percentage", False)]
    plain_numeric = [c for c in numeric_cols if not c.get("is_monetary") and not c.get("is_percentage")]

    # Build filters
    filters = _generate_filters(name, columns, date_cols, low_card_text, high_card_text, bool_cols, numeric_cols)

    # Build filter WHERE clauses for queries
    where_parts = _build_where_clauses(filters)
    where_sql = (" AND " + " AND ".join(where_parts)) if where_parts else ""

    # Decide if we need tabs (many widgets)
    has_time_series = bool(date_cols and numeric_cols)
    has_categories = bool(low_card_text)
    widget_count = len(numeric_cols[:4]) + (2 if has_time_series else 0) + (min(2, len(low_card_text))) + 1
    use_tabs = widget_count > 6

    # Build rows
    overview_rows = []
    analysis_rows = []

    # KPI row
    kpi_items = []
    for col in numeric_cols[:4]:
        kpi = {
            "type": "kpi",
            "title": _humanize(col["name"]),
            "query": f"SELECT SUM(\"{col['name']}\")::numeric as current_value FROM \"{name}\" WHERE 1=1{where_sql}",
            "compact": True,
            "decimals": 0,
        }
        if col.get("is_monetary"):
            kpi["prefix"] = "$"
        elif col.get("is_percentage"):
            kpi["suffix"] = "%"
            kpi["decimals"] = 1
        kpi_items.append(kpi)
    if kpi_items:
        overview_rows.append({"height": "small", "items": kpi_items})

    # Time series charts
    if date_cols and numeric_cols:
        date_col = date_cols[0]["name"]
        chart_items = []

        if monetary_cols:
            num_col = monetary_cols[0]["name"]
        elif numeric_cols:
            num_col = numeric_cols[0]["name"]
        else:
            num_col = None

        if num_col:
            chart = {
                "type": "chart",
                "chart_type": "bar",
                "title": f"{_humanize(num_col)} by Month",
                "query": (
                    f"SELECT TO_CHAR(\"{date_col}\", 'Mon YY') as month, "
                    f"SUM(\"{num_col}\")::int as value "
                    f"FROM \"{name}\" WHERE 1=1{where_sql} "
                    f"GROUP BY TO_CHAR(\"{date_col}\", 'Mon YY'), DATE_TRUNC('month', \"{date_col}\") "
                    f"ORDER BY DATE_TRUNC('month', \"{date_col}\")"
                ),
                "x": "month",
                "y": "value",
            }
            if monetary_cols and num_col == monetary_cols[0]["name"]:
                chart["y_format"] = "currency"
            chart_items.append(chart)

        # Line chart for count over time
        chart_items.append({
            "type": "chart",
            "chart_type": "line",
            "title": f"{_humanize(name)} Count by Month",
            "query": (
                f"SELECT TO_CHAR(\"{date_col}\", 'Mon YY') as month, "
                f"COUNT(*) as count "
                f"FROM \"{name}\" WHERE 1=1{where_sql} "
                f"GROUP BY TO_CHAR(\"{date_col}\", 'Mon YY'), DATE_TRUNC('month', \"{date_col}\") "
                f"ORDER BY DATE_TRUNC('month', \"{date_col}\")"
            ),
            "x": "month",
            "y": "count",
        })

        if chart_items:
            overview_rows.append({
                "title": "Trends",
                "description": f"Time series analysis based on {_humanize(date_col)}",
                "height": "medium",
                "items": chart_items,
            })

    # Multi-series chart — if 2+ numeric columns and a date column
    if date_cols and len(numeric_cols) >= 2:
        date_col = date_cols[0]["name"]
        series_cols = numeric_cols[:3]
        y_fields = [f"SUM(\"{c['name']}\")::int as \"{_humanize(c['name'])}\"" for c in series_cols]
        y_keys = [_humanize(c["name"]) for c in series_cols]

        analysis_rows.append({
            "title": "Comparison",
            "height": "medium",
            "items": [{
                "type": "chart",
                "chart_type": "bar",
                "title": f"{' vs '.join(y_keys[:2])} by Month",
                "query": (
                    f"SELECT TO_CHAR(\"{date_col}\", 'Mon YY') as month, "
                    + ", ".join(y_fields) + " "
                    f"FROM \"{name}\" WHERE 1=1{where_sql} "
                    f"GROUP BY TO_CHAR(\"{date_col}\", 'Mon YY'), DATE_TRUNC('month', \"{date_col}\") "
                    f"ORDER BY DATE_TRUNC('month', \"{date_col}\")"
                ),
                "x": "month",
                "y": y_keys,
            }],
        })

    # Pie/donut charts for low-cardinality text columns
    if low_card_text:
        pie_items = []
        for i, col in enumerate(low_card_text[:2]):
            chart_type = "pie" if i == 0 else "donut"
            pie_items.append({
                "type": "chart",
                "chart_type": chart_type,
                "title": f"By {_humanize(col['name'])}",
                "query": (
                    f"SELECT \"{col['name']}\", COUNT(*) as count "
                    f"FROM \"{name}\" "
                    f"WHERE \"{col['name']}\" IS NOT NULL "
                    f"GROUP BY \"{col['name']}\" "
                    f"ORDER BY count DESC LIMIT 10"
                ),
                "x": col["name"],
                "y": "count",
            })
        if pie_items:
            target = analysis_rows if use_tabs else overview_rows
            target.append({
                "title": "Distribution",
                "height": "medium",
                "items": pie_items,
            })

    # Data table — always at the end
    table_columns = []
    for c in columns[:10]:
        tc: dict = {"id": c["name"], "label": _humanize(c["name"])}
        if c["type"] in NUMERIC_TYPES:
            if c.get("is_monetary"):
                tc["format"] = "currency"
            else:
                tc["format"] = "number"
        elif c["type"] in DATE_TYPES:
            tc["format"] = "date"
        table_columns.append(tc)

    col_names = ", ".join(f'"{c["name"]}"' for c in columns[:10])
    table_row = {
        "title": f"All {_humanize(name)}",
        "height": "large",
        "items": [{
            "type": "table",
            "title": _humanize(name),
            "query": f"SELECT {col_names} FROM \"{name}\" WHERE 1=1{where_sql} ORDER BY 1 DESC LIMIT 200",
            "page_size": 25,
            "columns": table_columns,
        }],
    }

    # Build final page
    page: dict = {
        "id": name,
        "name": _humanize(name),
        "icon": _pick_icon(name),
    }

    if filters:
        page["filters"] = filters

    if use_tabs:
        page["tabs"] = [
            {"name": "Overview", "default": True, "rows": overview_rows},
            {"name": "Analysis", "rows": analysis_rows},
            {"name": "Data", "rows": [table_row]},
        ]
    else:
        page["rows"] = overview_rows + analysis_rows + [table_row]

    return page


def _generate_filters(
    table_name: str,
    all_columns: list[dict],
    date_cols: list[dict],
    low_card_text: list[dict],
    high_card_text: list[dict],
    bool_cols: list[dict],
    numeric_cols: list[dict],
) -> list[dict]:
    """Generate filter configs with data-driven defaults."""
    filters = []

    # Dropdown filters for low-cardinality text columns (max 3)
    for col in low_card_text[:3]:
        f: dict = {
            "id": col["name"],
            "type": "dropdown",
            "label": _humanize(col["name"]),
            "all": True,
            "default": "ALL",
        }
        # Use static options if we have sample values, otherwise query
        if "sample_values" in col and len(col["sample_values"]) <= 20:
            f["options"] = col["sample_values"]
        else:
            f["query"] = (
                f"SELECT DISTINCT \"{col['name']}\" FROM \"{table_name}\" "
                f"WHERE \"{col['name']}\" IS NOT NULL ORDER BY \"{col['name']}\""
            )
        filters.append(f)

    # Date range filter for date columns
    if date_cols:
        date_col = date_cols[0]
        f = {
            "id": f"{date_col['name']}_range",
            "type": "daterange",
            "label": _humanize(date_col["name"]),
        }
        if date_col.get("min_date"):
            f["min_date"] = date_col["min_date"][:10]
        if date_col.get("max_date"):
            f["max_date"] = date_col["max_date"][:10]
        filters.append(f)

    # Text search for high-cardinality text columns (max 1)
    for col in high_card_text[:1]:
        filters.append({
            "id": col["name"],
            "type": "text",
            "label": f"Search {_humanize(col['name'])}",
            "placeholder": f"Search...",
            "default": "",
        })

    # Toggle filters for boolean columns (max 2)
    for col in bool_cols[:2]:
        filters.append({
            "id": col["name"],
            "type": "toggle",
            "label": _humanize(col["name"]),
            "default": False,
        })

    # Number range for monetary columns with clear ranges (max 1)
    for col in numeric_cols[:1]:
        if col.get("min") is not None and col.get("max") is not None and col.get("is_monetary"):
            filters.append({
                "id": f"{col['name']}_range",
                "type": "number_range",
                "label": _humanize(col["name"]),
                "min": int(col["min"]),
                "max": int(col["max"]),
                "step": max(1, int((col["max"] - col["min"]) / 20)),
            })
            break

    return filters


def _build_where_clauses(filters: list[dict]) -> list[str]:
    """Build safe WHERE clause fragments for each filter."""
    parts = []
    for f in filters:
        fid = f["id"]
        ftype = f["type"]

        if ftype == "dropdown":
            col = fid
            parts.append(f"(:{fid} = 'ALL' OR \"{col}\" = :{fid})")

        elif ftype == "daterange":
            # id is like "order_date_range" → column is "order_date"
            col = fid.replace("_range", "")
            parts.append(f"(COALESCE(:{fid}_start, '') = '' OR \"{col}\" >= CAST(:{fid}_start AS date))")
            parts.append(f"(COALESCE(:{fid}_end, '') = '' OR \"{col}\" <= CAST(:{fid}_end AS date))")

        elif ftype == "text":
            col = fid
            parts.append(f"(:{fid} = '' OR \"{col}\" ILIKE '%' || :{fid} || '%')")

        elif ftype == "toggle":
            col = fid
            parts.append(f"(:{fid} = true OR \"{col}\" = false)")

        elif ftype == "number_range":
            col = fid.replace("_range", "")
            parts.append(f"\"{col}\" BETWEEN COALESCE(:{fid}_min, 0) AND COALESCE(:{fid}_max, 999999999)")

    return parts


def _humanize(name: str) -> str:
    """Convert snake_case to Title Case."""
    return name.replace("_", " ").title()


def _pick_icon(table_name: str) -> str:
    """Pick a sensible icon based on table name."""
    icons = {
        "users": "users", "customers": "users", "employees": "briefcase",
        "orders": "shopping-cart", "sales": "bar-chart", "products": "package",
        "invoices": "file-text", "payments": "credit-card", "categories": "layers",
        "reviews": "book-open", "shipping": "truck", "inventory": "package",
        "transactions": "credit-card", "accounts": "users", "suppliers": "truck",
    }
    lower = table_name.lower()
    for keyword, icon in icons.items():
        if keyword in lower:
            return icon
    return "layers"


def suggest_dashboard_text(analysis: dict, title: str = "Dashboard") -> str:
    """Generate a human-readable suggestion of what dashboard can be built."""
    lines = [f"# Suggested Dashboard: {title}\n"]
    lines.append("Based on your data, here's what I can build:\n")

    for table in analysis["tables"]:
        name = table["name"]
        columns = table["columns"]
        numeric_cols = [c for c in columns if c["type"] in NUMERIC_TYPES]
        date_cols = [c for c in columns if c["type"] in DATE_TYPES]
        text_cols = [c for c in columns if c["type"] in TEXT_TYPES and c.get("distinct_count", 999) <= 20]

        lines.append(f"## Page: {_humanize(name)} ({table['row_count']:,} rows)")

        # KPIs
        if numeric_cols:
            kpi_strs = []
            for c in numeric_cols[:4]:
                label = _humanize(c["name"])
                if c.get("is_monetary"):
                    label = f"${label}"
                if c.get("avg") is not None:
                    kpi_strs.append(f"{label} (avg {c['avg']:,.0f})")
                else:
                    kpi_strs.append(label)
            lines.append(f"  **KPIs:** {', '.join(kpi_strs)}")

        # Charts
        charts = []
        if date_cols and numeric_cols:
            charts.append(f"{_humanize(numeric_cols[0]['name'])} over time (bar)")
            charts.append(f"Count by month (line)")
        if len(numeric_cols) >= 2 and date_cols:
            charts.append(f"Multi-series comparison (grouped bar)")
        if text_cols:
            for c in text_cols[:2]:
                charts.append(f"By {_humanize(c['name'])} (pie, {c.get('distinct_count', '?')} categories)")
        if charts:
            lines.append(f"  **Charts:** {', '.join(charts)}")

        # Filters
        filter_strs = []
        for c in text_cols[:3]:
            filter_strs.append(f"{_humanize(c['name'])} dropdown ({c.get('distinct_count', '?')} options)")
        if date_cols:
            filter_strs.append(f"{_humanize(date_cols[0]['name'])} date range")
        bool_cols = [c for c in columns if c["type"] in BOOL_TYPES]
        for c in bool_cols[:2]:
            filter_strs.append(f"{_humanize(c['name'])} toggle")
        if filter_strs:
            lines.append(f"  **Filters:** {', '.join(filter_strs)}")

        lines.append(f"  **Table:** All columns with pagination\n")

    return "\n".join(lines)
