"""CLI entry point for Lens."""

from __future__ import annotations

import click

from lens.app import Lens


@click.group()
@click.version_option(version="0.1.0", prog_name="lens")
def main() -> None:
    """Lens - An opinionated analytics dashboarding library."""
    pass


@main.command()
@click.argument("config_path", type=click.Path(exists=True))
@click.option("--host", default="0.0.0.0", help="Host to bind to.")
@click.option("--port", default=None, type=int, help="Port to bind to.")
@click.option("--no-browser", is_flag=True, help="Don't open browser automatically.")
def serve(config_path: str, host: str, port: int | None, no_browser: bool) -> None:
    """Start a Lens dashboard from a YAML config file.

    Example:
        lens serve dashboard.yaml
        lens serve dashboard.yaml --port 3000
        lens serve dashboard.yaml --no-browser
    """
    app = Lens(config_path)
    app.serve(host=host, port=port, open_browser=not no_browser)


@main.command()
@click.argument("config_path", type=click.Path(exists=True))
def validate(config_path: str) -> None:
    """Validate a YAML config file without starting the server.

    Example:
        lens validate dashboard.yaml
    """
    from lens.config import load_config

    try:
        config = load_config(config_path)
        page_count = len(config.app.pages)
        tab_count = sum(len(p.tabs or []) for p in config.app.pages)
        click.echo(f"Config is valid: {page_count} pages, {tab_count} tabs")
    except Exception as e:
        click.echo(f"Config error: {e}", err=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
