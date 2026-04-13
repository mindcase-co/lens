"""Postgres connection with asyncpg, connection pooling, read-only enforcement."""

from __future__ import annotations

import asyncio
from typing import Any

import asyncpg

from lens.config import DatabaseConfig


class Database:
    """Async Postgres database wrapper with connection pooling and read-only enforcement."""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Create connection pool and enforce read-only mode."""
        self.pool = await asyncpg.create_pool(
            self.config.connection,
            min_size=2,
            max_size=self.config.pool_size,
            command_timeout=self.config.query_timeout,
            init=self._init_connection,
        )

    async def _init_connection(self, conn: asyncpg.Connection) -> None:
        """Set each connection to read-only mode."""
        await conn.execute("SET default_transaction_read_only = ON")

    async def disconnect(self) -> None:
        """Close the connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def execute_query(
        self, query: str, params: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Execute a parameterized query and return results as list of dicts."""
        if not self.pool:
            raise RuntimeError("Database not connected. Call connect() first.")

        # Convert named params (:param) to positional ($1, $2, ...)
        processed_query, positional_params = self._convert_named_params(query, params or {})

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(processed_query, *positional_params)
            return [dict(row) for row in rows]

    async def execute_scalar(
        self, query: str, params: dict[str, Any] | None = None
    ) -> Any:
        """Execute a query and return the first column of the first row."""
        if not self.pool:
            raise RuntimeError("Database not connected. Call connect() first.")

        processed_query, positional_params = self._convert_named_params(query, params or {})

        async with self.pool.acquire() as conn:
            return await conn.fetchval(processed_query, *positional_params)

    @staticmethod
    def _convert_named_params(
        query: str, params: dict[str, Any]
    ) -> tuple[str, list[Any]]:
        """Convert :param_name style to $1, $2, ... style for asyncpg.

        Returns the converted query and a list of positional parameter values.
        """
        import re

        positional_params: list[Any] = []
        param_index_map: dict[str, int] = {}

        def replacer(match: re.Match) -> str:
            param_name = match.group(1)
            if param_name not in param_index_map:
                param_index_map[param_name] = len(positional_params) + 1
                # Default missing params to 'ALL' to work with (:param = 'ALL' OR ...) pattern
                positional_params.append(params.get(param_name, "ALL"))
            return f"${param_index_map[param_name]}"

        # Use negative lookbehind to skip Postgres :: cast operator
        converted = re.sub(r"(?<!:):(\w+)", replacer, query)
        return converted, positional_params

    async def health_check(self) -> bool:
        """Check if the database connection is alive."""
        try:
            result = await self.execute_scalar("SELECT 1")
            return result == 1
        except Exception:
            return False
