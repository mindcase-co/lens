"""PostgreSQL backend using asyncpg with connection pooling."""

from __future__ import annotations

from typing import Any

import asyncpg

from lens.backends.base import DatabaseBackend
from lens.config import DatabaseConfig


class PostgresBackend(DatabaseBackend):
    """Async PostgreSQL database backend with connection pooling and read-only enforcement."""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        connection = self.config.connection
        if isinstance(connection, list):
            connection = next((c for c in connection if c.startswith("postgresql://")), connection[0])

        self.pool = await asyncpg.create_pool(
            connection,
            min_size=2,
            max_size=self.config.pool_size,
            command_timeout=self.config.query_timeout,
            init=self._init_connection,
        )

    async def _init_connection(self, conn: asyncpg.Connection) -> None:
        await conn.execute("SET default_transaction_read_only = ON")

    async def disconnect(self) -> None:
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def execute_query(self, query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        if not self.pool:
            raise RuntimeError("Database not connected. Call connect() first.")

        processed_query, positional_params = self._convert_named_params(query, params or {})

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(processed_query, *positional_params)
            return [dict(row) for row in rows]

    async def health_check(self) -> bool:
        try:
            if not self.pool:
                return False
            processed_query, positional_params = self._convert_named_params("SELECT 1", {})
            async with self.pool.acquire() as conn:
                result = await conn.fetchval(processed_query, *positional_params)
                return result == 1
        except Exception:
            return False
