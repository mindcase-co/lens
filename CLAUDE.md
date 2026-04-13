# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Lens

Lens is a YAML-driven analytics dashboarding library. Users define a YAML config with database queries, filters, and layout — and get a full dashboard served as a React SPA backed by a FastAPI server. It connects to PostgreSQL, executes parameterized read-only queries, and renders results as KPIs, charts (ApexCharts), and tables.

## Common Commands

```bash
# Install
make install              # pip install -e .
make dev                  # install Python + frontend deps

# Build
make build-frontend       # cd frontend && npm run build
make build                # build frontend + copy to lens/static/

# Run
make run                  # serve examples/sales_dashboard.yaml
lens serve config.yaml  # serve any config
lens validate config.yaml

# Frontend dev (with hot reload, proxies API to :8080)
cd frontend && npm run dev
cd frontend && npm run lint
```

No test suite exists yet.

## Architecture

### Backend (Python, `lens/`)

```
CLI (cli.py, Click) → Lens (app.py) → FastAPI Server (server.py)
                                       ↕
                        Config (config.py, Pydantic) ← YAML file
                        Database (database.py, asyncpg pool)
                        Filters (filters.py) → parameterized SQL
                        Watcher (watcher.py) → WebSocket hot-reload (debug mode)
```

- **Config flow**: YAML → env var substitution → Pydantic validation → `LensConfig`
- **Query security**: Config serialization strips DB credentials and replaces inline SQL with opaque IDs (`q_0`, `q_1`). Queries live in a server-side `_query_registry` only.
- **Filter resolution** (`filters.py`): Filter IDs map to SQL named params by convention — dropdown `id:"region"` → `:region`, daterange `id:"period"` → `:period_start`/`:period_end`. Missing params default to `"ALL"` for safe patterns like `WHERE :region = 'ALL' OR region = :region`.
- **Database**: asyncpg with connection pooling, enforces read-only transactions.

### Frontend (React 19 + TypeScript + Vite, `frontend/src/`)

- **Config-driven rendering**: No client-side routing. App loads config from `/api/config`, renders pages/tabs/rows/widgets dynamically.
- **Hooks**: `useConfig` (config + WebSocket reload), `useQuery` (query execution with auto-refresh), `useFilters` (filter state → query params), `useTheme`
- **Widgets**: KPICard, Chart (ApexCharts — bar, line, area, pie, donut, combo), DataTable (pagination, sorting, CSV export, conditional formatting), TextBlock, Divider
- **Filters**: Dropdown (single/multi, dynamic options, dependent filters), DateRange (presets), Date, Text, NumberRange, Toggle
- **Styling**: Tailwind CSS v4 via Vite plugin, shadcn/ui components, OKLch theme system with presets
- **Path alias**: `@/` → `src/`
- **Dev proxy**: Vite proxies `/api` and `/ws` to `http://localhost:8080`

### Build Pipeline

Frontend builds to `frontend/dist/`, then `make copy-static` copies it into `lens/static/` which FastAPI serves as a SPA (all non-API routes serve `index.html`).

## YAML Config Structure

```yaml
app:
  title, theme, port, debug
  database: { connection (supports ${ENV_VAR}), pool_size, query_timeout }
  sidebar: { logo, title, sections, footer, external_links }
  ui: { base_color, accent_color, chart_palette, mode }
  pages:
    - id, name, icon, default, description
      filters: [{ id, type, label, default, query, ... }]
      tabs:
        - name, default, badge_query
          filters: [...]
          rows:
            - height, title, collapsible
              items: [{ type: kpi|chart|table|text|divider, query, ... }]
```

Component types: `kpi` (single metric with trend), `chart` (bar/line/area/pie/donut/combo), `table` (paginated with formatting), `text` (markdown), `divider`.
