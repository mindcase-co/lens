# Lens

[![PyPI version](https://img.shields.io/pypi/v/mindcase-lens.svg)](https://pypi.org/project/mindcase-lens/)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

An opinionated YAML-driven analytics dashboarding library. Connect to PostgreSQL, CSV, Excel, or Parquet -- get a beautiful dashboard from a single config file. Built by [Mindcase](https://mindcase.co).

```bash
pip install mindcase-lens
```

## Why Lens?

| | Lens | Grafana | Metabase | Streamlit |
|---|---|---|---|---|
| **Config format** | YAML | UI + JSON | UI | Python code |
| **Frontend code needed** | None | None | None | Yes |
| **Setup time** | Seconds | Minutes | Minutes | Hours |
| **AI-native** | Yes (MCP) | No | No | No |
| **CSV/Excel support** | Built-in | Plugin | Upload | Code |
| **Self-contained** | Single `pip install` | Docker/binary | Docker/JAR | pip + code |

Lens is for developers who want instant dashboards without building frontend code. Write a YAML config (or let Claude write it for you), point it at your data, done.

## Quick Start

**1. Create a YAML config:**

```yaml
app:
  title: "Sales Dashboard"
  database:
    connection: "sales.csv"  # or postgresql://, .xlsx, .parquet, or a folder
  pages:
    - id: overview
      name: Overview
      icon: bar-chart
      rows:
        - height: small
          items:
            - type: kpi
              title: Total Revenue
              query: "SELECT SUM(amount) as current_value FROM sales"
              prefix: "$"
              compact: true
        - height: medium
          items:
            - type: chart
              chart_type: bar
              title: Revenue by Month
              query: "SELECT month, SUM(amount) as revenue FROM sales GROUP BY month"
              x: month
              y: revenue
```

**2. Serve it:**

```bash
lens serve dashboard.yaml
```

That's it. Full React dashboard with KPIs, charts, tables, filters, and theming.

## Supported Data Sources

| Source | Connection Format |
|--------|------------------|
| **PostgreSQL** | `postgresql://user:pass@host:5432/db` |
| **CSV / TSV** | `data.csv` or `./folder/` |
| **Excel** | `report.xlsx` |
| **Parquet** | `data.parquet` |
| **Multiple sources** | List of any of the above |

```yaml
# Single file
connection: "sales.csv"

# Folder (each file becomes a table)
connection: "./data/"

# Multiple sources
connection:
  - "sales.csv"
  - "customers.xlsx"
```

File-based sources use DuckDB under the hood. PostgreSQL uses asyncpg with connection pooling.

## Use with Claude (MCP)

Install the [Lens MCP server](https://github.com/mindcase-co/lens-mcp) and let Claude build dashboards for you:

```bash
pip install mindcase-lens
claude mcp add lens -- uvx mindcase-lens-mcp
```

Then tell Claude:

> "Connect to my database at postgresql://localhost:5432/mydb and build me a dashboard"

Claude will introspect your schema, generate the YAML, and serve the dashboard -- no manual config needed.

## Features

- **KPIs** -- single metric cards with trend indicators (% change), formatting, and compact numbers
- **Charts** -- bar, line, area, pie, donut, horizontal bar, combo via ApexCharts. Paginated for dense data.
- **Data Tables** -- pagination, sorting, conditional formatting, CSV export
- **Filters** -- dropdown (single/multi with search), date range (presets + calendar), date, text, number range, toggle
- **Theming** -- light/dark mode, 4 color themes, 5 fonts, adjustable corner radius. Live preview.
- **Sidebar** -- auto-generated navigation with collapsible sub-pages, logo support (light/dark variants)
- **Hot Reload** -- edit YAML, dashboard updates instantly (debug mode)
- **Multi-source** -- PostgreSQL, CSV, Excel, Parquet, folders, or any combination
- **Security** -- read-only database connections, parameterized SQL, no raw queries on the client

## Architecture

```
YAML Config → Pydantic Validation → FastAPI Server → React SPA
                                          ↕
                              PostgreSQL (asyncpg) or DuckDB
                              (CSV / Excel / Parquet)
```

The frontend is a pre-built React 19 app using shadcn/ui and ApexCharts. It loads the config from the API and renders everything dynamically. No client-side routing, no build step for users.

## Widget Types

### KPI
```yaml
- type: kpi
  title: Total Revenue
  query: "SELECT SUM(amount) as current_value, SUM(prev_amount) as previous_value FROM sales"
  prefix: "$"
  compact: true
  decimals: 0
```

### Chart
```yaml
- type: chart
  chart_type: bar    # bar | line | area | pie | donut | horizontal_bar | combo
  title: Revenue by Month
  query: "SELECT month, SUM(amount) as revenue FROM sales GROUP BY month"
  x: month
  y: revenue
  y_format: currency  # currency | number | percentage | compact
```

### Table
```yaml
- type: table
  title: Recent Orders
  query: "SELECT id, customer, amount, date FROM orders ORDER BY date DESC"
  page_size: 25
  default_sort:
    column: date
    direction: desc
  columns:
    - id: amount
      label: Amount
      format: currency
      conditional:
        rule: threshold
        threshold: 1000
```

## Filter Types

| Type | Config | SQL Params |
|------|--------|------------|
| `dropdown` | `query` or `options`, `multi`, `all` | `:filter_id` |
| `daterange` | `presets`, `min_date`, `max_date` | `:filter_id_start`, `:filter_id_end` |
| `date` | -- | `:filter_id` |
| `text` | `placeholder` | `:filter_id` |
| `number_range` | `min`, `max`, `step` | `:filter_id_min`, `:filter_id_max` |
| `toggle` | `on_label`, `off_label` | `:filter_id` |

## CLI

```bash
lens serve dashboard.yaml              # start dashboard
lens serve dashboard.yaml --port 3000  # custom port
lens serve dashboard.yaml --no-browser # don't open browser
lens validate dashboard.yaml           # validate config
```

## Python API

```python
from lens import Lens

app = Lens("dashboard.yaml")
app.serve(port=8080)
```

## Development

```bash
pip install -e .
cd frontend && npm install

# Frontend dev (hot reload)
cd frontend && npm run dev

# Build
make build

# Run
lens serve examples/northwind_dashboard.yaml
```

## Also Available

- **[Lens MCP Server](https://github.com/mindcase-co/lens-mcp)** -- build dashboards from Claude using natural language (`pip install mindcase-lens-mcp`)

## Privacy & Security

- All database connections are **read-only** by default
- SQL queries are parameterized -- no injection risk
- Raw SQL never reaches the browser -- queries are replaced with opaque IDs
- No telemetry, no external calls, no data leaves your machine

## License

MIT
