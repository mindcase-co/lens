.PHONY: install dev build-frontend copy-static build clean

# Install Python package in editable mode
install:
	pip install -e .

# Install all dev dependencies
dev:
	pip install -e ".[dev]"
	cd frontend && npm install

# Build React frontend
build-frontend:
	cd frontend && npm run build

# Copy built frontend to Python package
copy-static:
	rm -rf lens/static/*
	cp -r frontend/dist/* lens/static/

# Full build: frontend + copy
build: build-frontend copy-static

# Clean build artifacts
clean:
	rm -rf frontend/dist
	rm -rf lens/static/assets
	rm -f lens/static/index.html
	rm -rf dist/
	rm -rf *.egg-info

# Run example dashboard
run:
	python -c "from lens import Lens; Lens('examples/northwind_dashboard.yaml').serve()"

# Validate example config
validate:
	lens validate examples/sales_dashboard.yaml

# Package for PyPI
package: build
	python -m build

# Publish to PyPI
publish: package
	twine upload dist/*
