"""Filter parameter resolution - converts filter state to query parameters."""

from __future__ import annotations

from typing import Any

from lens.config import FilterConfig


def resolve_filter_params(
    filters: list[FilterConfig], filter_values: dict[str, Any]
) -> dict[str, Any]:
    """Convert filter values into named query parameters.

    Conventions:
        dropdown  id:"region"  → :region
        daterange id:"period"  → :period_start, :period_end
        date      id:"as_of"   → :as_of
        text      id:"search"  → :search
        number_range id:"price" → :price_min, :price_max
        toggle    id:"active"  → :active (resolves to on_value/off_value)
    """
    params: dict[str, Any] = {}

    for f in filters:
        value = filter_values.get(f.id)

        if f.type == "dropdown":
            if value is None:
                value = f.default if f.default is not None else "ALL"
            params[f.id] = value

        elif f.type == "daterange":
            if isinstance(value, dict):
                params[f"{f.id}_start"] = value.get("start")
                params[f"{f.id}_end"] = value.get("end")
            else:
                params[f"{f.id}_start"] = None
                params[f"{f.id}_end"] = None

        elif f.type == "date":
            params[f.id] = value if value is not None else f.default

        elif f.type == "text":
            params[f.id] = value if value is not None else f.default

        elif f.type == "number_range":
            if isinstance(value, dict):
                params[f"{f.id}_min"] = value.get("min")
                params[f"{f.id}_max"] = value.get("max")
            else:
                params[f"{f.id}_min"] = f.min
                params[f"{f.id}_max"] = f.max

        elif f.type == "toggle":
            if value is True or value == f.on_value:
                params[f.id] = f.on_value
            elif value is False or value == f.off_value:
                params[f.id] = f.off_value
            else:
                params[f.id] = f.default if f.default is not None else f.off_value

    return params
