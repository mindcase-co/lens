"""Complete Lens YAML configuration schema — exposed as an MCP resource."""

YAML_SCHEMA = '''# Lens YAML Configuration Schema
# Every possible field with types and descriptions.

app:
  title: string                      # Dashboard title
  theme: "light" | "dark" | "system" # Default theme mode
  port: number                       # Server port (default 8080)
  debug: boolean                     # Enable hot-reload via WebSocket
  date_format: string                # Date display format (e.g. "MMM DD, YYYY")
  currency: string                   # Currency code (e.g. "USD")
  timezone: string                   # Timezone (e.g. "America/New_York")
  refresh: string                    # Auto-refresh interval ("30s", "5m", "1h")

  database:
    connection: string               # PostgreSQL URL — supports ${ENV_VAR}
    pool_size: number                # Connection pool size (default 10)
    query_timeout: number            # Query timeout in seconds (default 30)

  sidebar:
    logo: string                     # Logo URL/path for light mode
    logo_dark: string                # Logo URL/path for dark mode
    title: string                    # Sidebar title (shown when no logo)
    default_collapsed: boolean       # Start collapsed
    footer: string                   # Footer text
    sections:
      - label: string                # Section header
        pages: [string]              # Page IDs in this section
    external_links:
      - label: string
        url: string
        icon: string                 # Lucide icon name

  pages:
    - id: string                     # Unique page ID
      name: string                   # Display name
      icon: string                   # Lucide icon: bar-chart, users, shopping-cart, package, layers, truck, briefcase, etc.
      default: boolean               # Default page on load
      description: string            # Subtitle under page name
      refresh: string                # Page-level auto-refresh

      filters:                       # Page-level filters
        # DROPDOWN — for categorical columns
        - id: string                 # Maps to SQL param :id
          type: "dropdown"
          label: string
          query: string              # SQL to fetch options (e.g. "SELECT DISTINCT region FROM sales")
          options: [string]           # OR static options
          all: boolean               # Add "All" option
          default: string            # Default value
          multi: boolean             # Allow multiple selections
          depends_on: string         # Re-fetch when this filter changes

        # DATE RANGE — for date filtering
        - id: string                 # Maps to :id_start and :id_end
          type: "daterange"
          label: string
          presets: [string]          # "7d", "30d", "90d", "MTD", "QTD", "YTD", "custom"
          min_date: string
          max_date: string

        # SINGLE DATE
        - id: string                 # Maps to :id
          type: "date"
          label: string

        # TEXT SEARCH
        - id: string                 # Maps to :id
          type: "text"
          label: string
          placeholder: string

        # NUMBER RANGE
        - id: string                 # Maps to :id_min and :id_max
          type: "number_range"
          label: string
          min: number
          max: number
          step: number

        # TOGGLE
        - id: string                 # Maps to :id
          type: "toggle"
          label: string
          default: boolean
          on_label: string
          off_label: string

      tabs:                          # Optional — shown as sidebar sub-items
        - name: string               # Tab name
          default: boolean
          filters: [...]             # Tab-level filters (merged with page filters)
          rows: [...]                # Tab content

      rows:                          # Direct content (when no tabs)
        - height: "small" | "medium" | "large" | "auto"  # Fixed row height
          title: string              # Section title
          description: string        # Section subtitle
          collapsible: boolean
          items:

            # KPI CARD
            - type: "kpi"
              title: string
              description: string
              query: string          # Must return current_value, optionally previous_value for trend
              prefix: string         # Before number (e.g. "$")
              suffix: string         # After number (e.g. "%")
              decimals: number
              compact: boolean       # Abbreviate: 1.2K, 3.4M

            # CHART
            - type: "chart"
              chart_type: "bar" | "horizontal_bar" | "line" | "area" | "pie" | "donut" | "combo"
              title: string
              description: string
              query: string
              x: string              # X-axis field
              y: string | [string]   # Y-axis field(s) — array for multi-series
              y_format: "currency" | "number" | "percentage" | "compact"
              x_label: string
              y_label: string
              stacked: boolean
              data_labels: boolean
              legend: "top" | "bottom" | "right" | "hidden"
              sort: "value_asc" | "value_desc"
              limit: number          # Top N (rest grouped as "Other")
              colors: [string]       # Custom hex colors
              reference_line:
                value: number
                label: string
              # COMBO only:
              series:
                - name: string       # SQL alias / legend label
                  as: "bar" | "line" # Render type
                  axis: "left" | "right"  # Y-axis side

            # DATA TABLE
            - type: "table"
              title: string
              description: string
              query: string
              page_size: number      # Rows per page (default 25)
              default_sort:
                column: string
                direction: "asc" | "desc"
              columns:
                - id: string         # Field name from query
                  label: string      # Column header
                  format: "currency" | "number" | "date" | "percentage" | "link"
                  hidden: boolean
                  pinned: boolean    # Sticky left column
                  conditional:
                    rule: "threshold" | "positive_negative"
                    threshold: number

            # TEXT BLOCK
            - type: "text"
              title: string
              content: string        # Markdown

            # DIVIDER
            - type: "divider"

# SQL PARAMETER MAPPING:
# Filter ID → SQL named params:
#   dropdown  "region"      → :region
#   daterange "period"      → :period_start, :period_end
#   number_range "price"    → :price_min, :price_max
#   date      "as_of"      → :as_of
#   text      "search"     → :search
#   toggle    "active"     → :active
#
# SAFE WHERE PATTERNS:
#   dropdown:     WHERE (:region = 'ALL' OR column = :region)
#   daterange:    WHERE (COALESCE(:period_start, '') = '' OR date_col >= CAST(:period_start AS date))
#   number_range: WHERE column BETWEEN COALESCE(:price_min, 0) AND COALESCE(:price_max, 99999)
#   toggle:       WHERE (:active = true OR column = 0)
#   text:         WHERE (:search = '' OR column ILIKE '%' || :search || '%')
#
# IMPORTANT: Use CAST(x AS type) not x::type to avoid param collision.
'''
