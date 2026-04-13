# Lens

[![PyPI version](https://img.shields.io/pypi/v/mindcase-lens.svg)](https://pypi.org/project/mindcase-lens/)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

An opinionated YAML-driven analytics dashboarding library. Define a config, get a beautiful dashboard. Built by [Mindcase](https://mindcase.co).

```bash
pip install mindcase-lens
```

## Quick Start

**1. Create a YAML config:**

```yaml
app:
  title: "My Dashboard"
  database:
    connection: "postgresql://user:pass@localhost:5432/mydb"
  pages:
    - id: sales
      name: Sales
      icon: bar-chart
      rows:
        - height: small
          items:
            - type: kpi
              title: Total Revenue
              query: "SELECT SUM(amount) as current_value FROM sales"
              prefix: "$"
              compact: true
```

**2. Serve it:**

```bash
lens serve dashboard.yaml
```

That's it. You get a full React dashboard with KPIs, charts, tables, filters, theming, and more -- all from YAML.

## Features

- **KPIs** with trend indicators, formatting, and compact numbers
- **Charts** -- bar, line, area, pie, donut, horizontal bar, combo (via ApexCharts)
- **Data Tables** -- pagination, sorting, conditional formatting, CSV export
- **Filters** -- dropdown (single/multi), date range, date, text search, number range, toggle
- **Theming** -- light/dark mode, color themes, font selector, border radius
- **Sidebar** -- auto-generated from pages, collapsible, supports logos
- **Hot Reload** -- edit YAML, dashboard updates instantly (debug mode)
- **Security** -- read-only queries, parameterized SQL, no raw SQL on the client

## YAML Config

```yaml
app:
  title: "Dashboard Title"
  theme: system              # light | dark | system
  port: 8080
  debug: true                # enables hot reload
  database:
    connection: "postgresql://..."
    pool_size: 10
    query_timeout: 30
  sidebar:
    logo: "/logo.png"
    logo_dark: "/logo-dark.png"
    title: "My App"
    sections:
      - label: Analytics
        pages: [sales, customers]
    footer: "Powered by Lens"
  pages:
    - id: sales
      name: Sales
      icon: bar-chart
      default: true
      filters:
        - id: region
          type: dropdown
          label: Region
          query: "SELECT DISTINCT region FROM sales"
          all: true
      tabs:
        - name: Overview
          rows:
            - height: small
              items:
                - type: kpi
                  title: Revenue
                  query: "SELECT SUM(amount) as current_value FROM sales WHERE (:region = 'ALL' OR region = :region)"
                  prefix: "$"
                  compact: true
```

## Widget Types

### KPI
```yaml
- type: kpi
  title: Total Revenue
  query: "SELECT SUM(amount) as current_value, SUM(prev_amount) as previous_value FROM sales"
  prefix: "$"
  suffix: ""
  decimals: 0
  compact: true
```

### Chart
```yaml
- type: chart
  chart_type: bar          # bar | line | area | pie | donut | horizontal_bar | combo
  title: Revenue by Month
  query: "SELECT month, SUM(amount) as revenue FROM sales GROUP BY month"
  x: month
  y: revenue
  y_format: currency       # currency | number | percentage | compact
  stacked: false
  data_labels: false
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
# Install
pip install -e .
cd frontend && npm install

# Frontend dev (hot reload)
cd frontend && npm run dev

# Build
make build

# Run
lens serve examples/northwind_dashboard.yaml
```

## License

MIT
