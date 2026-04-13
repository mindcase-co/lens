"""File watcher for hot reload in debug mode."""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Callable

from watchfiles import awatch

logger = logging.getLogger("lens.watcher")


class ConfigWatcher:
    """Watches the YAML config file and triggers reload on changes."""

    def __init__(
        self,
        config_path: Path,
        on_change: Callable[[], Any],
    ):
        self.config_path = config_path
        self.on_change = on_change
        self._task: asyncio.Task | None = None
        self._websocket_clients: set[Any] = set()
        self._suppress_next = False

    def register_client(self, ws: Any) -> None:
        """Register a WebSocket client for reload notifications."""
        self._websocket_clients.add(ws)

    def unregister_client(self, ws: Any) -> None:
        """Unregister a WebSocket client."""
        self._websocket_clients.discard(ws)

    async def start(self) -> None:
        """Start watching the config file."""
        self._task = asyncio.create_task(self._watch())
        logger.info(f"Watching config file: {self.config_path}")

    async def stop(self) -> None:
        """Stop watching."""
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    def suppress_next_change(self) -> None:
        """Suppress the next file change event (used when saving settings)."""
        self._suppress_next = True

    async def _watch(self) -> None:
        """Watch the config file for changes."""
        async for changes in awatch(self.config_path):
            if self._suppress_next:
                self._suppress_next = False
                logger.debug("Suppressed config reload (settings save)")
                continue
            logger.info(f"Config file changed: {changes}")
            try:
                self.on_change()
                await self._notify_clients()
            except Exception as e:
                logger.error(f"Error reloading config: {e}")
                await self._notify_clients(error=str(e))

    async def _notify_clients(self, error: str | None = None) -> None:
        """Notify all WebSocket clients to reload."""
        message = json.dumps({
            "type": "config_reload",
            "error": error,
        })
        dead_clients = set()
        for ws in self._websocket_clients:
            try:
                await ws.send_text(message)
            except Exception:
                dead_clients.add(ws)
        self._websocket_clients -= dead_clients
