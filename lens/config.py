"""YAML config parser with Pydantic validation and env var substitution."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field, model_validator


# --- Env var substitution ---

ENV_VAR_PATTERN = re.compile(r"\$\{(\w+)\}")


def resolve_env_vars(value: Any) -> Any:
    """Recursively resolve ${ENV_VAR} patterns in config values."""
    if isinstance(value, str):
        def replacer(match: re.Match) -> str:
            var_name = match.group(1)
            env_value = os.environ.get(var_name)
            if env_value is None:
                raise ValueError(
                    f"Environment variable '{var_name}' is not set. "
                    f"Referenced in config as ${{{var_name}}}"
                )
            return env_value
        return ENV_VAR_PATTERN.sub(replacer, value)
    elif isinstance(value, dict):
        return {k: resolve_env_vars(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [resolve_env_vars(item) for item in value]
    return value


# --- Pydantic Models ---

class DatabaseConfig(BaseModel):
    connection: str | list[str]
    pool_size: int = 10
    query_timeout: int = 30


class ExternalLink(BaseModel):
    label: str
    icon: str | None = None
    url: str


class SidebarSection(BaseModel):
    label: str
    pages: list[str]


class SidebarConfig(BaseModel):
    logo: str | None = None
    logo_dark: str | None = None
    title: str | None = None
    default_collapsed: bool = False
    sections: list[SidebarSection] | None = None
    external_links: list[ExternalLink] | None = None
    footer: str | None = None


class ConditionalFormat(BaseModel):
    rule: Literal["positive_negative", "threshold"]
    threshold: float | None = None


class TableColumn(BaseModel):
    id: str
    label: str | None = None
    format: Literal["currency", "number", "date", "text", "link", "percentage"] | None = None
    hidden: bool = False
    pinned: bool = False
    conditional: ConditionalFormat | None = None


class TableDetail(BaseModel):
    enabled: bool
    query: str
    key: str


class DefaultSort(BaseModel):
    column: str
    direction: Literal["asc", "desc"]


class ReferenceLine(BaseModel):
    value: float
    label: str | None = None


class ComboSeries(BaseModel):
    name: str
    as_type: Literal["bar", "line"] = Field(alias="as")
    axis: Literal["left", "right"] = "left"

    model_config = {"populate_by_name": True}


class KPIComponent(BaseModel):
    type: Literal["kpi"]
    title: str
    description: str | None = None
    query: str
    prefix: str | None = None
    suffix: str | None = None
    decimals: int | None = None
    compact: bool = False
    icon: str | None = None
    status_query: str | None = None


class ChartComponent(BaseModel):
    type: Literal["chart"]
    chart_type: Literal["bar", "horizontal_bar", "line", "area", "pie", "donut", "combo"]
    title: str
    description: str | None = None
    query: str
    x: str | None = None
    y: str | list[str] | None = None
    stacked: bool = False
    colors: list[str] | None = None
    x_label: str | None = None
    y_label: str | None = None
    y_format: Literal["currency", "number", "percentage", "compact"] = "number"
    legend: Literal["top", "bottom", "right", "hidden"] = "top"
    data_labels: bool = False
    sort: Literal["value_asc", "value_desc", "none"] = "none"
    limit: int | None = None
    reference_line: ReferenceLine | None = None
    series: list[ComboSeries] | None = None


class TableComponent(BaseModel):
    type: Literal["table"]
    title: str
    description: str | None = None
    query: str
    page_size: int = 25
    default_sort: DefaultSort | None = None
    columns: list[TableColumn] | None = None
    detail: TableDetail | None = None


class TextBlock(BaseModel):
    type: Literal["text"]
    content: str
    title: str | None = None


class DividerBlock(BaseModel):
    type: Literal["divider"]


# Union type for all components
Component = KPIComponent | ChartComponent | TableComponent


# Union type for row entries (rows, text blocks, dividers)
class RowEntry(BaseModel):
    title: str | None = None
    description: str | None = None
    height: Literal["small", "medium", "large", "auto"] = "auto"
    collapsible: bool = False
    items: list[dict[str, Any]]  # parsed into Component types at runtime


class FilterConfig(BaseModel):
    id: str
    type: Literal["dropdown", "daterange", "date", "text", "number_range", "toggle"]
    label: str
    placeholder: str | None = None
    # dropdown
    query: str | None = None
    options: list[str] | None = None
    multi: bool = False
    all: bool = True
    # daterange
    presets: list[str] | None = None
    min_date: str | None = None
    max_date: str | None = None
    # number_range
    min: float | None = None
    max: float | None = None
    step: float = 1
    range_query: str | None = None
    # toggle
    on_label: str = "On"
    off_label: str = "Off"
    on_value: str | float | bool = True
    off_value: str | float | bool = False
    # common
    default: str | float | bool | None = None
    depends_on: str | None = None
    required: bool = False


class TabConfig(BaseModel):
    name: str
    default: bool = False
    badge_query: str | None = None
    filters: list[FilterConfig] | None = None
    rows: list[dict[str, Any]] = []  # RowEntry or TextBlock or DividerBlock


class PageConfig(BaseModel):
    id: str
    name: str
    icon: str | None = None
    default: bool = False
    description: str | None = None
    refresh: str | None = None
    filters: list[FilterConfig] | None = None
    tabs: list[TabConfig] | None = None
    rows: list[dict[str, Any]] | None = None  # for pages without tabs


class UIConfig(BaseModel):
    theme: str = "slate"
    base_color: str = "slate"
    accent_color: str = "default"
    chart_palette: str = "slate"
    font_family: str = "system"
    radius: float = 0.625
    mode: Literal["light", "dark", "system"] = "system"


class AppConfig(BaseModel):
    title: str = "Lens"
    logo: str | None = None
    favicon: str | None = None
    theme: Literal["light", "dark", "system"] = "system"
    ui: UIConfig | None = None
    port: int = 8080
    base_path: str = "/"
    refresh: str | None = None
    date_format: str = "YYYY-MM-DD"
    number_locale: str = "en-US"
    currency: str = "USD"
    timezone: str = "UTC"
    debug: bool = False
    database: DatabaseConfig
    sidebar: SidebarConfig | None = None
    pages: list[PageConfig]

    @model_validator(mode="after")
    def validate_pages(self) -> "AppConfig":
        if not self.pages:
            raise ValueError("At least one page must be defined")
        # Ensure unique page IDs
        page_ids = [p.id for p in self.pages]
        if len(page_ids) != len(set(page_ids)):
            raise ValueError("Page IDs must be unique")
        # Validate sidebar section page references
        if self.sidebar and self.sidebar.sections:
            for section in self.sidebar.sections:
                for page_id in section.pages:
                    if page_id not in page_ids:
                        raise ValueError(
                            f"Sidebar section '{section.label}' references "
                            f"unknown page ID '{page_id}'"
                        )
        return self


class LensConfig(BaseModel):
    app: AppConfig


def load_config(config_path: str | Path) -> LensConfig:
    """Load, resolve env vars, and validate a YAML config file."""
    config_path = Path(config_path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(config_path) as f:
        raw = yaml.safe_load(f)

    if not raw or "app" not in raw:
        raise ValueError("Config must have a top-level 'app' key")

    resolved = resolve_env_vars(raw)
    return LensConfig(**resolved)
