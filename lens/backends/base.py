"""Abstract base class for database backends."""

from __future__ import annotations

import re
from abc import ABC, abstractmethod
from typing import Any


class DatabaseBackend(ABC):
    """Base class for all database backends (Postgres, DuckDB, etc.)."""

    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    @abstractmethod
    async def execute_query(self, query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def health_check(self) -> bool: ...

    @staticmethod
    def _convert_named_params(query: str, params: dict[str, Any]) -> tuple[str, list[Any]]:
        """Convert :param_name style to $1, $2, ... style.

        Works for both asyncpg (Postgres) and DuckDB.
        """
        positional_params: list[Any] = []
        param_index_map: dict[str, int] = {}

        def replacer(match: re.Match) -> str:
            param_name = match.group(1)
            if param_name not in param_index_map:
                param_index_map[param_name] = len(positional_params) + 1
                positional_params.append(params.get(param_name, "ALL"))
            return f"${param_index_map[param_name]}"

        converted = re.sub(r"(?<!:):(\w+)", replacer, query)
        return converted, positional_params
