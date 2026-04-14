"""Database introspection — discover tables, columns, types, and relationships."""

from __future__ import annotations

import asyncio
from pathlib import Path

import asyncpg


def _is_file_source(source: str) -> bool:
    """Check if a source is a file/folder rather than a database URL."""
    if source.startswith("postgresql://"):
        return False
    if source.endswith((".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl")):
        return True
    if Path(source).is_dir():
        return True
    return False


async def introspect(conn_string: str | list[str]) -> dict:
    """Connect to a data source and return full schema metadata.

    Supports PostgreSQL connection strings and file/folder paths (CSV, Excel, Parquet).
    """
    sources = conn_string if isinstance(conn_string, list) else [conn_string]
    has_files = any(_is_file_source(s) for s in sources)

    if has_files:
        return await _introspect_duckdb(sources)
    else:
        pg_source = sources[0] if isinstance(conn_string, list) else conn_string
        return await _introspect_postgres(pg_source)


async def _introspect_postgres(conn_string: str) -> dict:
    """Introspect a PostgreSQL database."""
    conn = await asyncpg.connect(conn_string)
    try:
        tables_raw = await conn.fetch("""
            SELECT t.table_name,
                   COALESCE((SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name), 0) as row_count
            FROM information_schema.tables t
            WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name
        """)

        tables = []
        for t in tables_raw:
            name = t["table_name"]
            cols_raw = await conn.fetch("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            """, name)

            columns = [
                {"name": c["column_name"], "type": c["data_type"], "nullable": c["is_nullable"] == "YES"}
                for c in cols_raw
            ]
            tables.append({"name": name, "row_count": int(t["row_count"]), "columns": columns})

        fks_raw = await conn.fetch("""
            SELECT tc.table_name as from_table, kcu.column_name as from_column,
                   ccu.table_name as to_table, ccu.column_name as to_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        """)

        foreign_keys = [
            {"from_table": fk["from_table"], "from_column": fk["from_column"],
             "to_table": fk["to_table"], "to_column": fk["to_column"]}
            for fk in fks_raw
        ]

        return {"tables": tables, "foreign_keys": foreign_keys}
    finally:
        await conn.close()


async def _introspect_duckdb(sources: list[str]) -> dict:
    """Introspect file/folder sources using DuckDB."""
    import duckdb

    def _run() -> dict:
        conn = duckdb.connect(":memory:")
        file_exts = {".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl"}

        # Register all sources
        for source in sources:
            if source.startswith("postgresql://"):
                continue  # skip postgres in file mode
            path = Path(source)
            if path.is_dir():
                for f in sorted(path.iterdir()):
                    if f.is_file() and f.suffix.lower() in file_exts:
                        _register_file(conn, f)
            elif path.is_file():
                _register_file(conn, path)

        # Get all tables
        table_rows = conn.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
        ).fetchall()

        tables = []
        for (table_name,) in table_rows:
            col_rows = conn.execute(
                "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                "WHERE table_schema = 'main' AND table_name = ?", [table_name]
            ).fetchall()

            row_count = conn.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]

            columns = [
                {"name": c[0], "type": c[1], "nullable": c[2] == "YES"}
                for c in col_rows
            ]
            tables.append({"name": table_name, "row_count": row_count, "columns": columns})

        conn.close()
        return {"tables": tables, "foreign_keys": []}

    return await asyncio.to_thread(_run)


def _register_file(conn, path: Path) -> None:
    """Register a file as a DuckDB table."""
    ext = path.suffix.lower()
    table_name = path.stem.lower().replace("-", "_").replace(" ", "_")

    if ext in (".csv", ".tsv"):
        conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM read_csv(\'{path}\', auto_detect=true)')
    elif ext in (".xlsx", ".xls"):
        conn.execute("INSTALL spatial; LOAD spatial;")
        conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM st_read(\'{path}\')')
    elif ext == ".parquet":
        conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM read_parquet(\'{path}\')')
    elif ext in (".json", ".jsonl"):
        conn.execute(f'CREATE TABLE "{table_name}" AS SELECT * FROM read_json(\'{path}\', auto_detect=true)')


async def sample_rows(conn_string: str, table_name: str, limit: int = 5) -> dict:
    """Get sample rows from a table."""
    sources = conn_string if isinstance(conn_string, list) else [conn_string]
    has_files = any(_is_file_source(s) for s in sources)

    if has_files:
        return await _sample_duckdb(sources, table_name, limit)
    else:
        return await _sample_postgres(conn_string, table_name, limit)


async def _sample_postgres(conn_string: str, table_name: str, limit: int) -> dict:
    conn = await asyncpg.connect(conn_string)
    try:
        tables = await conn.fetch(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
            table_name,
        )
        if not tables:
            return {"error": f"Table '{table_name}' not found"}

        rows = await conn.fetch(f'SELECT * FROM "{table_name}" LIMIT {int(limit)}')
        if not rows:
            return {"columns": [], "rows": []}

        columns = list(rows[0].keys())
        data = [dict(r) for r in rows]
        return {"columns": columns, "rows": data}
    finally:
        await conn.close()


async def _sample_duckdb(sources: list[str], table_name: str, limit: int) -> dict:
    import duckdb

    def _run() -> dict:
        conn = duckdb.connect(":memory:")
        file_exts = {".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl"}

        for source in sources:
            if source.startswith("postgresql://"):
                continue
            path = Path(source)
            if path.is_dir():
                for f in sorted(path.iterdir()):
                    if f.is_file() and f.suffix.lower() in file_exts:
                        _register_file(conn, f)
            elif path.is_file():
                _register_file(conn, path)

        try:
            result = conn.execute(f'SELECT * FROM "{table_name}" LIMIT {int(limit)}')
            columns = [desc[0] for desc in result.description]
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            conn.close()
            return {"columns": columns, "rows": rows}
        except Exception as e:
            conn.close()
            return {"error": str(e)}

    return await asyncio.to_thread(_run)


NUMERIC_TYPES = {"smallint", "integer", "bigint", "real", "double precision", "numeric", "decimal",
                 "INTEGER", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL", "HUGEINT", "TINYINT"}
DATE_TYPES = {"date", "timestamp without time zone", "timestamp with time zone",
              "DATE", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE"}
TEXT_TYPES = {"character varying", "character", "text", "VARCHAR", "TEXT"}
BOOL_TYPES = {"boolean", "BOOLEAN"}

MONETARY_KEYWORDS = {"price", "amount", "revenue", "cost", "total", "salary", "fee", "payment",
                     "budget", "profit", "income", "expense", "freight", "discount", "unit_price"}
PERCENTAGE_KEYWORDS = {"rate", "ratio", "pct", "percent", "percentage", "share"}


async def analyze_data(conn_string: str) -> dict:
    """Deep analysis of data: cardinalities, ranges, patterns, column semantics."""
    sources = conn_string if isinstance(conn_string, list) else [conn_string]
    has_files = any(_is_file_source(s) for s in sources)

    if has_files:
        return await _analyze_duckdb(sources)
    else:
        pg_source = sources[0] if isinstance(conn_string, list) else conn_string
        return await _analyze_postgres(pg_source)


async def _analyze_postgres(conn_string: str) -> dict:
    """Analyze PostgreSQL data for dashboard generation."""
    conn = await asyncpg.connect(conn_string)
    try:
        schema = await _introspect_postgres(conn_string)
        analysis = {"tables": [], "foreign_keys": schema["foreign_keys"]}

        for table in schema["tables"]:
            table_analysis = {
                "name": table["name"],
                "row_count": table["row_count"],
                "columns": [],
            }

            for col in table["columns"]:
                col_analysis = {
                    "name": col["name"],
                    "type": col["type"],
                    "nullable": col["nullable"],
                    "is_monetary": any(kw in col["name"].lower() for kw in MONETARY_KEYWORDS),
                    "is_percentage": any(kw in col["name"].lower() for kw in PERCENTAGE_KEYWORDS),
                }

                try:
                    if col["type"] in NUMERIC_TYPES:
                        stats = await conn.fetchrow(
                            f'SELECT MIN("{col["name"]}") as min_val, MAX("{col["name"]}") as max_val, '
                            f'AVG("{col["name"]}")::numeric(20,2) as avg_val, '
                            f'COUNT(DISTINCT "{col["name"]}") as distinct_count, '
                            f'COUNT(*) FILTER (WHERE "{col["name"]}" IS NULL) as null_count '
                            f'FROM "{table["name"]}"'
                        )
                        col_analysis.update({
                            "min": float(stats["min_val"]) if stats["min_val"] is not None else None,
                            "max": float(stats["max_val"]) if stats["max_val"] is not None else None,
                            "avg": float(stats["avg_val"]) if stats["avg_val"] is not None else None,
                            "distinct_count": int(stats["distinct_count"]),
                            "null_count": int(stats["null_count"]),
                        })

                    elif col["type"] in DATE_TYPES:
                        stats = await conn.fetchrow(
                            f'SELECT MIN("{col["name"]}") as min_val, MAX("{col["name"]}") as max_val, '
                            f'COUNT(DISTINCT "{col["name"]}") as distinct_count '
                            f'FROM "{table["name"]}"'
                        )
                        col_analysis.update({
                            "min_date": str(stats["min_val"]) if stats["min_val"] else None,
                            "max_date": str(stats["max_val"]) if stats["max_val"] else None,
                            "distinct_count": int(stats["distinct_count"]),
                        })

                    elif col["type"] in TEXT_TYPES:
                        stats = await conn.fetchrow(
                            f'SELECT COUNT(DISTINCT "{col["name"]}") as distinct_count, '
                            f'COUNT(*) FILTER (WHERE "{col["name"]}" IS NULL) as null_count '
                            f'FROM "{table["name"]}"'
                        )
                        distinct = int(stats["distinct_count"])
                        col_analysis["distinct_count"] = distinct
                        col_analysis["null_count"] = int(stats["null_count"])

                        # Sample values for low-cardinality columns
                        if distinct <= 30:
                            samples = await conn.fetch(
                                f'SELECT DISTINCT "{col["name"]}" FROM "{table["name"]}" '
                                f'WHERE "{col["name"]}" IS NOT NULL ORDER BY "{col["name"]}" LIMIT 30'
                            )
                            col_analysis["sample_values"] = [str(r[col["name"]]) for r in samples]

                    elif col["type"] in BOOL_TYPES:
                        col_analysis["distinct_count"] = 2

                except Exception:
                    pass  # Skip analysis for problematic columns

                table_analysis["columns"].append(col_analysis)

            analysis["tables"].append(table_analysis)

        return analysis
    finally:
        await conn.close()


async def _analyze_duckdb(sources: list[str]) -> dict:
    """Analyze file-based data sources using DuckDB."""
    import duckdb

    def _run() -> dict:
        conn = duckdb.connect(":memory:")
        file_exts = {".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl"}

        for source in sources:
            if source.startswith("postgresql://"):
                continue
            path = Path(source)
            if path.is_dir():
                for f in sorted(path.iterdir()):
                    if f.is_file() and f.suffix.lower() in file_exts:
                        _register_file(conn, f)
            elif path.is_file():
                _register_file(conn, path)

        table_rows = conn.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
        ).fetchall()

        analysis = {"tables": [], "foreign_keys": []}

        for (table_name,) in table_rows:
            col_rows = conn.execute(
                "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
                "WHERE table_schema = 'main' AND table_name = ?", [table_name]
            ).fetchall()

            row_count = conn.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]

            table_analysis = {"name": table_name, "row_count": row_count, "columns": []}

            for col_name, col_type, nullable in col_rows:
                col_analysis = {
                    "name": col_name, "type": col_type, "nullable": nullable == "YES",
                    "is_monetary": any(kw in col_name.lower() for kw in MONETARY_KEYWORDS),
                    "is_percentage": any(kw in col_name.lower() for kw in PERCENTAGE_KEYWORDS),
                }

                try:
                    if col_type in NUMERIC_TYPES:
                        r = conn.execute(
                            f'SELECT MIN("{col_name}"), MAX("{col_name}"), AVG("{col_name}")::DECIMAL(20,2), '
                            f'COUNT(DISTINCT "{col_name}"), SUM(CASE WHEN "{col_name}" IS NULL THEN 1 ELSE 0 END) '
                            f'FROM "{table_name}"'
                        ).fetchone()
                        col_analysis.update({
                            "min": float(r[0]) if r[0] is not None else None,
                            "max": float(r[1]) if r[1] is not None else None,
                            "avg": float(r[2]) if r[2] is not None else None,
                            "distinct_count": int(r[3]),
                            "null_count": int(r[4]),
                        })
                    elif col_type in DATE_TYPES:
                        r = conn.execute(
                            f'SELECT MIN("{col_name}"), MAX("{col_name}"), COUNT(DISTINCT "{col_name}") '
                            f'FROM "{table_name}"'
                        ).fetchone()
                        col_analysis.update({
                            "min_date": str(r[0]) if r[0] else None,
                            "max_date": str(r[1]) if r[1] else None,
                            "distinct_count": int(r[2]),
                        })
                    elif col_type in TEXT_TYPES:
                        r = conn.execute(
                            f'SELECT COUNT(DISTINCT "{col_name}"), '
                            f'SUM(CASE WHEN "{col_name}" IS NULL THEN 1 ELSE 0 END) '
                            f'FROM "{table_name}"'
                        ).fetchone()
                        distinct = int(r[0])
                        col_analysis["distinct_count"] = distinct
                        col_analysis["null_count"] = int(r[1])
                        if distinct <= 30:
                            samples = conn.execute(
                                f'SELECT DISTINCT "{col_name}" FROM "{table_name}" '
                                f'WHERE "{col_name}" IS NOT NULL ORDER BY "{col_name}" LIMIT 30'
                            ).fetchall()
                            col_analysis["sample_values"] = [str(s[0]) for s in samples]
                    elif col_type in BOOL_TYPES:
                        col_analysis["distinct_count"] = 2
                except Exception:
                    pass

                table_analysis["columns"].append(col_analysis)

            analysis["tables"].append(table_analysis)

        conn.close()
        return analysis

    return await asyncio.to_thread(_run)


def format_analysis_markdown(analysis: dict) -> str:
    """Format data analysis as readable Markdown for AI consumption."""
    lines = ["## Data Analysis\n"]

    for table in analysis["tables"]:
        lines.append(f"### `{table['name']}` ({table['row_count']:,} rows)\n")
        lines.append("| Column | Type | Distinct | Range/Values | Semantic |")
        lines.append("|--------|------|----------|-------------|----------|")

        for col in table["columns"]:
            distinct = col.get("distinct_count", "?")
            semantic = []
            if col.get("is_monetary"):
                semantic.append("monetary")
            if col.get("is_percentage"):
                semantic.append("percentage")

            if col["type"] in NUMERIC_TYPES:
                range_str = f"{col.get('min', '?')} – {col.get('max', '?')} (avg {col.get('avg', '?')})"
            elif col["type"] in DATE_TYPES:
                range_str = f"{col.get('min_date', '?')} to {col.get('max_date', '?')}"
            elif "sample_values" in col:
                vals = col["sample_values"]
                if len(vals) <= 5:
                    range_str = ", ".join(vals)
                else:
                    range_str = f"{', '.join(vals[:3])}... ({len(vals)} total)"
            else:
                range_str = "—"

            lines.append(f"| `{col['name']}` | {col['type']} | {distinct} | {range_str} | {', '.join(semantic) or '—'} |")
        lines.append("")

    if analysis.get("foreign_keys"):
        lines.append("### Relationships")
        for fk in analysis["foreign_keys"]:
            lines.append(f"- `{fk['from_table']}.{fk['from_column']}` → `{fk['to_table']}.{fk['to_column']}`")
        lines.append("")

    return "\n".join(lines)


def format_schema_markdown(schema: dict) -> str:
    """Format introspection result as readable Markdown."""
    lines = ["## Database Schema\n"]

    for table in schema["tables"]:
        lines.append(f"### `{table['name']}` ({table['row_count']:,} rows)")
        lines.append("| Column | Type | Nullable |")
        lines.append("|--------|------|----------|")
        for col in table["columns"]:
            nullable = "Yes" if col["nullable"] else "No"
            lines.append(f"| `{col['name']}` | {col['type']} | {nullable} |")
        lines.append("")

    if schema["foreign_keys"]:
        lines.append("### Relationships")
        for fk in schema["foreign_keys"]:
            lines.append(f"- `{fk['from_table']}.{fk['from_column']}` -> `{fk['to_table']}.{fk['to_column']}`")
        lines.append("")

    return "\n".join(lines)


def format_sample_markdown(data: dict) -> str:
    """Format sample rows as a Markdown table."""
    if "error" in data:
        return f"**Error:** {data['error']}"

    columns = data["columns"]
    rows = data["rows"]

    if not rows:
        return "No data in this table."

    lines = [
        "| " + " | ".join(columns) + " |",
        "| " + " | ".join(["---"] * len(columns)) + " |",
    ]
    for row in rows:
        vals = [str(row.get(c, ""))[:40] for c in columns]
        lines.append("| " + " | ".join(vals) + " |")

    return "\n".join(lines)
