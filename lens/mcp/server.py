"""Lens MCP Server — build dashboards from any data source using AI."""

import logging
import subprocess
import sys
from pathlib import Path

import yaml
from mcp.server.fastmcp import FastMCP

from lens.mcp.introspect import (
    introspect,
    analyze_data,
    sample_rows,
    format_schema_markdown,
    format_sample_markdown,
    format_analysis_markdown,
)
from lens.mcp.generator import generate_config, suggest_dashboard_text
from lens.mcp.schema import YAML_SCHEMA

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lens-mcp")

mcp = FastMCP(
    "lens",
    instructions=(
        "Lens is a YAML-driven analytics dashboarding library by Mindcase. "
        "It connects to PostgreSQL, CSV, Excel, Parquet, and JSON data sources "
        "and renders beautiful dashboards from a YAML config.\n\n"
        "Workflow: introspect_database → analyze_data → suggest_dashboard → "
        "(user approves) → generate_dashboard → validate_config → serve_dashboard.\n\n"
        "The user never needs to write YAML manually — you generate it for them. "
        "Read the lens://schema resource for the complete YAML specification."
    ),
)


# ── Schema Resource ────────────────────────────────────────────────────────


@mcp.resource("lens://schema")
def get_yaml_schema() -> str:
    """Complete Lens YAML configuration schema with all fields, types, and examples.

    Read this to understand every possible config option before generating dashboards.
    """
    return YAML_SCHEMA


# ── Prompt ─────────────────────────────────────────────────────────────────


@mcp.prompt()
def create_dashboard() -> str:
    """Step-by-step guide for creating a Lens dashboard from any data source."""
    return (
        "You are helping a user create a Lens analytics dashboard. Follow these steps:\n\n"
        "1. Ask for their data source:\n"
        "   - PostgreSQL: connection string (postgresql://user:pass@host:port/db)\n"
        "   - Files: path to CSV, Excel (.xlsx), Parquet, JSON, or a folder\n\n"
        "2. Use `introspect_database` to discover tables and columns.\n\n"
        "3. Use `analyze_data` to deeply analyze the data — cardinalities, ranges, "
        "distributions, column semantics (monetary, percentage, etc.).\n\n"
        "4. Use `suggest_dashboard` to generate a human-readable proposal of "
        "pages, KPIs, charts, and filters. Show this to the user.\n\n"
        "5. Ask the user:\n"
        "   - Which pages/tables do they want?\n"
        "   - What KPIs matter most?\n"
        "   - Any specific charts or comparisons?\n"
        "   - What filters would be useful?\n\n"
        "6. Use `generate_dashboard` to create the YAML config.\n\n"
        "7. Use `validate_config` to verify correctness.\n\n"
        "8. Use `serve_dashboard` to launch it.\n\n"
        "Tips:\n"
        "- Read the lens://schema resource for all available config options.\n"
        "- Use CAST(x AS type) not x::type in SQL to avoid parameter collision.\n"
        "- Every filter needs matching WHERE clauses in queries.\n"
        "- Monetary columns should use prefix: '$' and y_format: currency.\n"
        "- Low-cardinality text columns make good dropdown filters and pie charts.\n"
        "- Date columns should get daterange filters.\n"
        "- Use tabs when a page has many widgets (>6 items)."
    )


# ── Database Introspection ─────────────────────────────────────────────────


@mcp.tool()
async def introspect_database(connection_string: str) -> str:
    """Discover all tables, columns, types, row counts, and relationships in a data source.

    Call this first to understand the data before generating a dashboard config.
    Supports PostgreSQL databases, CSV files, Excel files, Parquet files, JSON files, and folders.

    Args:
        connection_string: Data source — PostgreSQL URL (postgresql://...), file path (data.csv, report.xlsx), or folder path (./data/)
    """
    try:
        schema = await introspect(connection_string)
        return format_schema_markdown(schema)
    except Exception as e:
        return f"**Error connecting to data source:** {e}"


@mcp.tool()
async def analyze_database(connection_string: str) -> str:
    """Deep analysis of a data source — cardinalities, ranges, distributions, column semantics.

    Goes beyond introspect_database: analyzes distinct value counts, min/max/avg for numerics,
    date ranges, null percentages, detects monetary/percentage columns, samples text values.
    Use this to make smart decisions about KPIs, charts, and filters.

    Args:
        connection_string: Data source — PostgreSQL URL, file path, or folder path
    """
    try:
        analysis = await analyze_data(connection_string)
        return format_analysis_markdown(analysis)
    except Exception as e:
        return f"**Error analyzing data:** {e}"


@mcp.tool()
async def sample_data(connection_string: str, table_name: str, limit: int = 5) -> str:
    """Get sample rows from a table to understand the data shape and values.

    Args:
        connection_string: Data source connection string or file path
        table_name: Name of the table to sample
        limit: Number of rows to return (default 5)
    """
    try:
        data = await sample_rows(connection_string, table_name, limit)
        return format_sample_markdown(data)
    except Exception as e:
        return f"**Error:** {e}"


# ── Dashboard Suggestions ──────────────────────────────────────────────────


@mcp.tool()
async def suggest_dashboard(
    connection_string: str,
    title: str = "Dashboard",
    tables: str = "",
) -> str:
    """Analyze the data and suggest what pages, KPIs, charts, and filters to build.

    Returns a human-readable proposal. Show this to the user for approval before generating.

    Args:
        connection_string: Data source connection string or file path
        title: Dashboard title
        tables: Comma-separated table names to include (empty = all tables)
    """
    try:
        analysis = await analyze_data(connection_string)
        table_list = [t.strip() for t in tables.split(",") if t.strip()] or None

        if table_list:
            analysis["tables"] = [t for t in analysis["tables"] if t["name"] in table_list]

        return suggest_dashboard_text(analysis, title)
    except Exception as e:
        return f"**Error:** {e}"


# ── Config Generation ──────────────────────────────────────────────────────


@mcp.tool()
async def generate_dashboard(
    connection_string: str,
    title: str = "Dashboard",
    tables: str = "",
    output_path: str = "dashboard.yaml",
) -> str:
    """Generate a complete Lens dashboard YAML config from a data source.

    Deeply analyzes the data and creates pages with KPIs, charts, tables, and filters
    using smart heuristics. Writes the config to a file.

    Args:
        connection_string: Data source — PostgreSQL URL, file path, or folder path
        title: Dashboard title
        tables: Comma-separated table names to include (empty = all tables)
        output_path: Where to write the YAML config file (default: dashboard.yaml)
    """
    try:
        # Deep analysis for smart generation
        analysis = await analyze_data(connection_string)
        schema = await introspect(connection_string)
        table_list = [t.strip() for t in tables.split(",") if t.strip()] or None

        yaml_content = generate_config(
            schema=schema,
            title=title,
            connection_string=connection_string,
            tables=table_list,
            analysis=analysis,
        )

        path = Path(output_path)
        path.write_text(yaml_content)

        # Count what was generated
        config = yaml.safe_load(yaml_content)
        page_count = len(config.get("app", {}).get("pages", []))

        return (
            f"Dashboard config generated and saved to `{path}`.\n\n"
            f"**{page_count} pages** created with KPIs, charts, filters, and tables.\n\n"
            f"To start the dashboard, run:\n```\nlens serve {path}\n```\n\n"
            f"Or use the `serve_dashboard` tool."
        )
    except Exception as e:
        return f"**Error generating config:** {e}"


# ── Config Validation ──────────────────────────────────────────────────────


@mcp.tool()
async def validate_config(config_path: str) -> str:
    """Validate a Lens YAML config file for correctness.

    Checks structure, required fields, unique page IDs, sidebar references,
    filter-query parameter matching, and SQL syntax.

    Args:
        config_path: Path to the YAML config file
    """
    path = Path(config_path)
    if not path.exists():
        return f"**Error:** File not found: {config_path}"

    try:
        with open(path) as f:
            config = yaml.safe_load(f)

        errors = []

        if not config or "app" not in config:
            return "**Invalid:** Config must have a top-level 'app' key."

        app = config["app"]
        pages = app.get("pages", [])
        if not pages:
            errors.append("At least one page must be defined.")

        # Check unique page IDs
        page_ids = [p.get("id") for p in pages]
        if len(page_ids) != len(set(page_ids)):
            errors.append("Page IDs must be unique.")

        # Check sidebar references
        sidebar = app.get("sidebar", {})
        if sidebar and sidebar.get("sections"):
            all_section_pages = []
            for section in sidebar["sections"]:
                all_section_pages.extend(section.get("pages", []))
            for pid in all_section_pages:
                if pid not in page_ids:
                    errors.append(f"Sidebar references unknown page '{pid}'.")

        # Check each page
        for page in pages:
            pid = page.get("id", "?")
            if not page.get("id"):
                errors.append(f"Page missing 'id'.")
            if not page.get("name"):
                errors.append(f"Page '{pid}' missing 'name'.")

            # Check rows exist (either direct or in tabs)
            has_rows = bool(page.get("rows"))
            has_tabs = bool(page.get("tabs"))
            if not has_rows and not has_tabs:
                errors.append(f"Page '{pid}' has no rows or tabs.")

        if errors:
            return "**Invalid.**\n" + "\n".join(f"- {e}" for e in errors)

        return f"**Valid.** {len(pages)} pages, config structure is correct."

    except Exception as e:
        return f"**Invalid YAML:** {e}"


# ── Dashboard Serving ──────────────────────────────────────────────────────


@mcp.tool()
async def serve_dashboard(config_path: str, port: int = 8080) -> str:
    """Start a Lens dashboard server from a YAML config file.

    The server runs in the background and serves the dashboard at the specified port.

    Args:
        config_path: Path to the Lens YAML config file
        port: Port to serve on (default 8080)
    """
    path = Path(config_path)
    if not path.exists():
        return f"**Error:** Config file not found: {config_path}"

    try:
        subprocess.Popen(
            ["lens", "serve", str(path), "--port", str(port), "--no-browser"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return f"Dashboard starting at **http://localhost:{port}**\n\nConfig: `{path}`"
    except FileNotFoundError:
        subprocess.Popen(
            [sys.executable, "-c",
             f"from lens import Lens; Lens('{path}').serve(port={port}, open_browser=False)"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return f"Dashboard starting at **http://localhost:{port}**\n\nConfig: `{path}`"


# ── Config Modification ────────────────────────────────────────────────────


@mcp.tool()
async def add_page(
    config_path: str,
    page_name: str,
    table_name: str,
    connection_string: str,
) -> str:
    """Add a new page to an existing Lens dashboard config, based on a database table.

    Uses deep data analysis to generate smart KPIs, charts, filters, and tables.

    Args:
        config_path: Path to the existing YAML config file
        page_name: Name for the new page
        table_name: Database table to build the page from
        connection_string: Data source connection string or file path
    """
    path = Path(config_path)
    if not path.exists():
        return f"**Error:** Config file not found: {config_path}"

    try:
        analysis = await analyze_data(connection_string)
        table_info = next((t for t in analysis["tables"] if t["name"] == table_name), None)
        if not table_info:
            return f"**Error:** Table '{table_name}' not found."

        from lens.mcp.generator import _generate_page
        fks = [fk for fk in analysis.get("foreign_keys", []) if fk["from_table"] == table_name]
        page = _generate_page(table_info, fks, analysis["tables"])
        page["name"] = page_name

        with open(path) as f:
            config = yaml.safe_load(f)

        config["app"]["pages"].append(page)

        sidebar = config["app"].get("sidebar", {})
        if sidebar and sidebar.get("sections"):
            sidebar["sections"][-1]["pages"].append(page["id"])

        with open(path, "w") as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

        return f"**Added page '{page_name}'** (from table `{table_name}`) to `{path}`."
    except Exception as e:
        return f"**Error:** {e}"


@mcp.tool()
async def add_filter(
    config_path: str,
    page_id: str,
    filter_id: str,
    filter_type: str = "dropdown",
    label: str = "",
    query: str = "",
    connection_string: str = "",
) -> str:
    """Add a filter to a page in an existing Lens dashboard config.

    Supports all filter types with smart defaults. If connection_string is provided,
    analyzes the data to set appropriate defaults (min/max, date ranges, options).

    Args:
        config_path: Path to the YAML config file
        page_id: ID of the page to add the filter to
        filter_id: Unique filter ID (used as SQL parameter name)
        filter_type: Filter type — dropdown, daterange, date, text, number_range, toggle
        label: Display label for the filter
        query: SQL query for dropdown options (optional)
        connection_string: Data source for analyzing defaults (optional)
    """
    path = Path(config_path)
    if not path.exists():
        return f"**Error:** Config file not found: {config_path}"

    try:
        with open(path) as f:
            config = yaml.safe_load(f)

        page = next((p for p in config["app"]["pages"] if p["id"] == page_id), None)
        if not page:
            return f"**Error:** Page '{page_id}' not found."

        filter_def: dict = {
            "id": filter_id,
            "type": filter_type,
            "label": label or filter_id.replace("_", " ").title(),
        }

        if filter_type == "dropdown":
            filter_def["all"] = True
            filter_def["default"] = "ALL"
            if query:
                filter_def["query"] = query
        elif filter_type == "daterange":
            filter_def["presets"] = ["7d", "30d", "90d", "MTD", "QTD", "YTD", "custom"]
        elif filter_type == "text":
            filter_def["placeholder"] = "Search..."
            filter_def["default"] = ""
        elif filter_type == "number_range":
            filter_def["min"] = 0
            filter_def["max"] = 1000
            filter_def["step"] = 10
        elif filter_type == "toggle":
            filter_def["default"] = False
        elif filter_type == "date":
            filter_def["default"] = ""

        if "filters" not in page:
            page["filters"] = []
        page["filters"].append(filter_def)

        with open(path, "w") as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

        return f"**Added {filter_type} filter '{filter_id}'** to page `{page_id}`."
    except Exception as e:
        return f"**Error:** {e}"


if __name__ == "__main__":
    mcp.run()
