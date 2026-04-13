# Lens

[![PyPI version](https://img.shields.io/pypi/v/mindcase-lens.svg)](https://pypi.org/project/mindcase-lens/)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

**Instant dashboards from Claude Code. One prompt. Under a minute. Done.**

Point Claude at your data -- PostgreSQL, CSV, Excel, Parquet -- and get a production-ready analytics dashboard. No frontend code. No setup. No cleanup needed.

```bash
pip install mindcase-lens
claude mcp add lens -- uvx mindcase-lens-mcp
```

Then tell Claude:

> "Build me a dashboard from my database at postgresql://localhost:5432/mydb"

That's it. Claude introspects your schema, generates the config, and serves a full dashboard with KPIs, charts, tables, filters, and theming.

## See It in Action

```
You: "I have a folder of CSV files in ./data/ — build me a dashboard"

Claude: Introspecting ./data/...
        Found 3 tables: sales (10K rows), customers (500 rows), products (200 rows)
        Generating dashboard config...
        Dashboard running at http://localhost:8080
```

Under a minute. Every time.

## What You Get

- **KPIs** with trend indicators and % change
- **Charts** -- bar, line, area, pie, donut, horizontal bar (with pagination for dense data)
- **Data tables** -- sortable, paginated, conditional formatting, CSV export
- **Filters** -- dropdowns (single/multi with search), date range, text, number range, toggle
- **Theming** -- light/dark mode, color themes, fonts, corner radius. All live-preview.
- **Sidebar navigation** -- auto-generated, with logo support

## Any Data Source

| Source | Just point to it |
|--------|-----------------|
| **PostgreSQL** | `postgresql://user:pass@host:5432/db` |
| **CSV / TSV** | `data.csv` or `./folder/` |
| **Excel** | `report.xlsx` |
| **Parquet** | `data.parquet` |
| **Mix them** | A list of any of the above |

```yaml
# One file
connection: "sales.csv"

# A whole folder — each file becomes a table
connection: "./data/"

# Multiple sources together
connection:
  - "sales.csv"
  - "customers.xlsx"
  - "postgresql://localhost:5432/mydb"
```

## Why Lens?

| | Lens | Grafana | Metabase | Streamlit |
|---|---|---|---|---|
| **Time to dashboard** | < 1 minute | 10+ minutes | 10+ minutes | Hours |
| **Works with Claude** | Native MCP | No | No | No |
| **Frontend code** | None | None | None | Yes |
| **CSV/Excel** | Built-in | Plugin | Upload | Code |
| **Setup** | `pip install` | Docker | Docker/JAR | pip + code |

Lens exists because every other dashboarding tool requires you to either build a frontend, learn a UI, or write code. With Lens, you describe what you want to Claude, and it's done.

## For Power Users

Everything Claude generates is a YAML config file. You can edit it directly:

```yaml
app:
  title: "Sales Dashboard"
  database:
    connection: "postgresql://localhost:5432/mydb"
  pages:
    - id: sales
      name: Sales
      icon: bar-chart
      filters:
        - id: region
          type: dropdown
          label: Region
          query: "SELECT DISTINCT region FROM sales"
          all: true
      rows:
        - height: small
          items:
            - type: kpi
              title: Revenue
              query: "SELECT SUM(amount) as current_value FROM sales WHERE (:region = 'ALL' OR region = :region)"
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
              y_format: currency
```

Full YAML reference: [llms-full.txt](llms-full.txt)

## CLI

```bash
lens serve dashboard.yaml              # start dashboard
lens serve dashboard.yaml --port 3000  # custom port
lens validate dashboard.yaml           # validate config
```

## Python API

```python
from lens import Lens

app = Lens("dashboard.yaml")
app.serve(port=8080)
```

## Privacy & Security

- All database connections are **read-only** by default
- SQL queries are parameterized -- no injection risk
- Raw SQL never reaches the browser
- No telemetry, no external calls, no data leaves your machine

## Also Available

- **[Lens MCP Server](https://github.com/mindcase-co/lens-mcp)** -- the Claude integration (`pip install mindcase-lens-mcp`)

## License

MIT -- Built by [Mindcase](https://mindcase.co)
