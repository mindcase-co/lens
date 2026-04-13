"""Lens main class - the user-facing API."""

from __future__ import annotations

import asyncio
import logging
import webbrowser
from pathlib import Path

import uvicorn

from lens.config import LensConfig, load_config
from lens.database import Database
from lens.server import create_app
from lens.watcher import ConfigWatcher

logger = logging.getLogger("lens")


class Lens:
    """Main entry point for Lens dashboards.

    Usage:
        app = Lens("dashboard.yaml")
        app.serve()
    """

    def __init__(self, config_path: str | Path):
        self.config_path = Path(config_path)
        self.config: LensConfig | None = None
        self.db: Database | None = None
        self._query_registry: dict[str, str] = {}

    def _load_config(self) -> LensConfig:
        """Load and validate the config file."""
        try:
            config = load_config(self.config_path)
            logger.info(f"Config loaded: {config.app.title}")
            return config
        except Exception as e:
            logger.error(f"Config error: {e}")
            raise

    def serve(
        self,
        host: str = "0.0.0.0",
        port: int | None = None,
        open_browser: bool = True,
    ) -> None:
        """Start the dashboard server.

        Args:
            host: Host to bind to.
            port: Port to bind to. Defaults to config value or 8080.
            open_browser: Whether to open the browser automatically.
        """
        self.config = self._load_config()
        port = port or self.config.app.port

        self.db = Database(self.config.app.database)

        # Set up hot reload watcher if debug mode
        watcher = None
        if self.config.app.debug:
            watcher = ConfigWatcher(
                config_path=self.config_path,
                on_change=self._reload_config,
            )

        app = create_app(self.config, self.db, watcher, config_path=str(self.config_path))

        # Store query registry from serialization
        @app.on_event("startup")
        async def startup() -> None:
            await self.db.connect()
            logger.info(f"Connected to database")
            if watcher:
                await watcher.start()
                logger.info("Hot reload enabled (debug mode)")

        @app.on_event("shutdown")
        async def shutdown() -> None:
            await self.db.disconnect()
            if watcher:
                await watcher.stop()

        # Open browser
        if open_browser:
            import threading
            url = f"http://localhost:{port}{self.config.app.base_path}"
            threading.Timer(1.5, lambda: webbrowser.open(url)).start()

        # Configure logging
        log_level = "debug" if self.config.app.debug else "info"
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
            datefmt="%H:%M:%S",
        )

        logger.info(f"Starting Lens on http://localhost:{port}")

        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level=log_level,
        )

    def _reload_config(self) -> None:
        """Reload config from file (called by watcher)."""
        try:
            self.config = self._load_config()
            logger.info("Config reloaded successfully")
        except Exception as e:
            logger.error(f"Config reload failed: {e}")
