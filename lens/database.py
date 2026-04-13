"""Database factory — auto-detects backend from connection string."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from lens.config import DatabaseConfig

logger = logging.getLogger("lens")


def _detect_backend(connection: str | list[str]) -> str:
    """Detect which backend to use based on the connection string."""
    if isinstance(connection, list):
        # Multiple sources: if any are files, use DuckDB
        has_files = any(not c.startswith("postgresql://") for c in connection)
        if has_files:
            return "duckdb"
        return "postgres"

    if connection.startswith("postgresql://"):
        return "postgres"

    if connection.endswith((".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl")):
        return "duckdb"

    if Path(connection).is_dir():
        return "duckdb"

    return "postgres"


class Database:
    """Database wrapper that auto-detects and delegates to the right backend."""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        backend_type = _detect_backend(config.connection)

        if backend_type == "postgres":
            from lens.backends.postgres import PostgresBackend
            self._backend = PostgresBackend(config)
            logger.info("Using PostgreSQL backend")
        else:
            from lens.backends.duckdb import DuckDBBackend
            self._backend = DuckDBBackend(config)
            logger.info("Using DuckDB backend")

    async def connect(self) -> None:
        await self._backend.connect()

    async def disconnect(self) -> None:
        await self._backend.disconnect()

    async def execute_query(self, query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        return await self._backend.execute_query(query, params)

    async def health_check(self) -> bool:
        return await self._backend.health_check()
