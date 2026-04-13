"""FastAPI server - API routes, static file serving, WebSocket for hot reload."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from lens.config import LensConfig, UIConfig
from lens.database import Database
from lens.filters import resolve_filter_params
from lens.watcher import ConfigWatcher

logger = logging.getLogger("lens.server")

STATIC_DIR = Path(__file__).parent / "static"


class QueryRequest(BaseModel):
    query: str
    params: dict[str, Any] = {}


class FilterOptionsRequest(BaseModel):
    query: str
    params: dict[str, Any] = {}


def create_app(
    config: LensConfig,
    db: Database,
    watcher: ConfigWatcher | None = None,
    config_path: str | None = None,
) -> FastAPI:
    """Create the FastAPI application."""

    app = FastAPI(
        title=config.app.title,
        version="0.1.0",
        docs_url="/api/docs" if config.app.debug else None,
        redoc_url=None,
    )

    # Store config reference (mutable for hot reload)
    app.state.config = config
    app.state.db = db
    app.state.watcher = watcher
    app.state.config_path = config_path

    # --- API Routes ---

    @app.get("/api/config")
    async def get_config() -> dict[str, Any]:
        """Return the config as JSON for the frontend.

        Strips sensitive data (database connection) and query strings
        (those stay server-side only).
        """
        cfg = app.state.config.app
        return _serialize_config_for_frontend(cfg)

    @app.post("/api/query")
    async def run_query(request: QueryRequest) -> dict[str, Any]:
        """Execute a parameterized SQL query and return results."""
        try:
            rows = await app.state.db.execute_query(request.query, request.params)
            return {"data": rows, "count": len(rows)}
        except Exception as e:
            logger.error(f"Query failed: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/filter-options")
    async def get_filter_options(request: FilterOptionsRequest) -> dict[str, Any]:
        """Execute a filter's option query."""
        try:
            rows = await app.state.db.execute_query(request.query, request.params)
            # Flatten single-column results to a list of values
            if rows and len(rows[0]) == 1:
                key = list(rows[0].keys())[0]
                return {"options": [row[key] for row in rows]}
            return {"options": rows}
        except Exception as e:
            logger.error(f"Filter options query failed: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/health")
    async def health_check() -> dict[str, Any]:
        """Health check endpoint."""
        db_ok = await app.state.db.health_check()
        return {"status": "ok" if db_ok else "degraded", "database": db_ok}

    # --- Theme Settings ---

    @app.get("/api/settings")
    async def get_settings() -> dict[str, Any]:
        """Return current UI/theme settings from JSON file, falling back to config."""
        import json
        config_path = app.state.config_path
        if config_path:
            settings_path = Path(config_path).with_suffix(".settings.json")
            if settings_path.exists():
                try:
                    with open(settings_path) as f:
                        return json.load(f)
                except Exception:
                    pass
        ui = app.state.config.app.ui
        if ui:
            return ui.model_dump()
        return {}

    @app.post("/api/settings")
    async def save_settings(settings: UIConfig) -> dict[str, str]:
        """Save UI/theme settings to a separate JSON file (avoids triggering config watcher)."""
        import json

        config_path = app.state.config_path
        if not config_path:
            raise HTTPException(status_code=400, detail="Config path not available")

        try:
            settings_path = Path(config_path).with_suffix(".settings.json")
            with open(settings_path, "w") as f:
                json.dump(settings.model_dump(), f, indent=2)

            # Update in-memory config
            app.state.config.app.ui = settings
            app.state.config.app.theme = settings.mode

            logger.info(f"Theme settings saved to {settings_path}")
            return {"status": "saved"}
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # --- WebSocket for hot reload ---

    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket) -> None:
        await websocket.accept()
        if app.state.watcher:
            app.state.watcher.register_client(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            if app.state.watcher:
                app.state.watcher.unregister_client(websocket)

    # --- Static files (React frontend) ---

    if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
        # Serve static assets
        if (STATIC_DIR / "assets").exists():
            app.mount(
                "/assets",
                StaticFiles(directory=STATIC_DIR / "assets"),
                name="assets",
            )

        # Serve static files (images, fonts, etc.) from STATIC_DIR root
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str) -> HTMLResponse:
            # Try serving as a static file first
            file_path = STATIC_DIR / full_path
            if full_path and file_path.is_file() and file_path.resolve().is_relative_to(STATIC_DIR.resolve()):
                from fastapi.responses import FileResponse
                return FileResponse(file_path)
            # Fall back to SPA index.html
            index_html = (STATIC_DIR / "index.html").read_text()
            return HTMLResponse(content=index_html)
    else:
        @app.get("/")
        async def no_frontend() -> JSONResponse:
            return JSONResponse(
                content={
                    "message": "Lens backend is running. Frontend static files not found.",
                    "hint": "Build the frontend with 'make build-frontend' or check lens/static/",
                },
                status_code=200,
            )

    return app


def _serialize_config_for_frontend(cfg: Any) -> dict[str, Any]:
    """Convert config to frontend-safe JSON.

    Strips: database connection, raw SQL queries (replaced with query IDs).
    Keeps: layout, pages, tabs, filters, component structure.
    """
    data = cfg.model_dump() if hasattr(cfg, "model_dump") else dict(cfg)

    # Remove sensitive database info
    if "database" in data:
        del data["database"]

    # Build query registry and replace inline queries with IDs
    query_registry: dict[str, str] = {}
    query_counter = [0]

    def register_query(query: str) -> str:
        query_id = f"q_{query_counter[0]}"
        query_counter[0] += 1
        query_registry[query_id] = query
        return query_id

    def process_component(comp: dict) -> dict:
        if "query" in comp and comp["query"]:
            comp["query_id"] = register_query(comp["query"])
            del comp["query"]
        if "status_query" in comp and comp["status_query"]:
            comp["status_query_id"] = register_query(comp["status_query"])
            del comp["status_query"]
        if "badge_query" in comp and comp["badge_query"]:
            comp["badge_query_id"] = register_query(comp["badge_query"])
            del comp["badge_query"]
        if "range_query" in comp and comp["range_query"]:
            comp["range_query_id"] = register_query(comp["range_query"])
            del comp["range_query"]
        if "detail" in comp and isinstance(comp["detail"], dict):
            if "query" in comp["detail"] and comp["detail"]["query"]:
                comp["detail"]["query_id"] = register_query(comp["detail"]["query"])
                del comp["detail"]["query"]
        return comp

    def process_rows(rows: list) -> list:
        for row in rows:
            if isinstance(row, dict):
                if "items" in row:
                    row["items"] = [process_component(item) for item in row["items"]]
                elif "query" in row:
                    process_component(row)
        return rows

    def process_filters(filters: list) -> list:
        for f in filters:
            if isinstance(f, dict) and "query" in f and f["query"]:
                f["query_id"] = register_query(f["query"])
                del f["query"]
            if isinstance(f, dict) and "range_query" in f and f["range_query"]:
                f["range_query_id"] = register_query(f["range_query"])
                del f["range_query"]
        return filters

    if "pages" in data:
        for page in data["pages"]:
            if "filters" in page and page["filters"]:
                process_filters(page["filters"])
            if "tabs" in page and page["tabs"]:
                for tab in page["tabs"]:
                    if "filters" in tab and tab["filters"]:
                        process_filters(tab["filters"])
                    if "rows" in tab:
                        process_rows(tab["rows"])
                    if "badge_query" in tab and tab["badge_query"]:
                        tab["badge_query_id"] = register_query(tab["badge_query"])
                        del tab["badge_query"]
            if "rows" in page and page["rows"]:
                process_rows(page["rows"])

    # Store query registry on app state for query execution
    data["_query_registry"] = query_registry

    return data
