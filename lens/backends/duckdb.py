"""DuckDB backend for CSV, Excel, Parquet, and JSON files."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any

import duckdb

from lens.backends.base import DatabaseBackend
from lens.config import DatabaseConfig

logger = logging.getLogger("lens.duckdb")

FILE_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl"}


class DuckDBBackend(DatabaseBackend):
    """DuckDB backend that can query CSV, Excel, Parquet, JSON files and folders."""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.conn: duckdb.DuckDBPyConnection | None = None
        self._tables: list[str] = []

    async def connect(self) -> None:
        self.conn = await asyncio.to_thread(self._create_connection)

    def _create_connection(self) -> duckdb.DuckDBPyConnection:
        conn = duckdb.connect(":memory:")

        sources = self.config.connection
        if isinstance(sources, str):
            sources = [sources]

        for source in sources:
            if source.startswith("postgresql://"):
                self._attach_postgres(conn, source)
            else:
                path = Path(source)
                if path.is_dir():
                    self._register_folder(conn, path)
                elif path.is_file():
                    self._register_file(conn, path)
                else:
                    logger.warning(f"Source not found: {source}")

        logger.info(f"DuckDB connected with tables: {self._tables}")
        return conn

    def _register_file(self, conn: duckdb.DuckDBPyConnection, path: Path) -> None:
        ext = path.suffix.lower()
        table_name = path.stem.lower().replace("-", "_").replace(" ", "_")

        if ext in (".csv", ".tsv"):
            conn.execute(f"CREATE TABLE \"{table_name}\" AS SELECT * FROM read_csv('{path}', auto_detect=true)")
        elif ext in (".xlsx", ".xls"):
            conn.execute("INSTALL spatial; LOAD spatial;")
            conn.execute(f"CREATE TABLE \"{table_name}\" AS SELECT * FROM st_read('{path}')")
        elif ext == ".parquet":
            conn.execute(f"CREATE TABLE \"{table_name}\" AS SELECT * FROM read_parquet('{path}')")
        elif ext in (".json", ".jsonl"):
            conn.execute(f"CREATE TABLE \"{table_name}\" AS SELECT * FROM read_json('{path}', auto_detect=true)")
        else:
            logger.warning(f"Unsupported file type: {ext}")
            return

        self._tables.append(table_name)
        logger.info(f"Registered {path} as table '{table_name}'")

    def _register_folder(self, conn: duckdb.DuckDBPyConnection, folder: Path) -> None:
        for file in sorted(folder.iterdir()):
            if file.is_file() and file.suffix.lower() in FILE_EXTENSIONS:
                self._register_file(conn, file)

    def _attach_postgres(self, conn: duckdb.DuckDBPyConnection, connection_string: str) -> None:
        try:
            conn.execute("INSTALL postgres; LOAD postgres;")
            conn.execute(f"ATTACH '{connection_string}' AS pg (TYPE postgres, READ_ONLY true)")

            # Get all tables from postgres and create views
            tables = conn.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_catalog = 'pg'"
            ).fetchall()

            for (table_name,) in tables:
                conn.execute(f"CREATE VIEW \"{table_name}\" AS SELECT * FROM pg.public.\"{table_name}\"")
                self._tables.append(table_name)
                logger.info(f"Attached Postgres table '{table_name}'")
        except Exception as e:
            logger.error(f"Failed to attach Postgres source: {e}")

    async def disconnect(self) -> None:
        if self.conn:
            await asyncio.to_thread(self.conn.close)
            self.conn = None

    async def execute_query(self, query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        if not self.conn:
            raise RuntimeError("Database not connected. Call connect() first.")

        processed_query, positional_params = self._convert_named_params(query, params or {})

        def _run() -> list[dict[str, Any]]:
            result = self.conn.execute(processed_query, positional_params)
            columns = [desc[0] for desc in result.description]
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]

        return await asyncio.to_thread(_run)

    async def health_check(self) -> bool:
        try:
            if not self.conn:
                return False
            result = await asyncio.to_thread(lambda: self.conn.execute("SELECT 1").fetchone()[0])
            return result == 1
        except Exception:
            return False
