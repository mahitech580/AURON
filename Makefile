.PHONY: help install install-api-gateway install-product-service \
        run-api-gateway run-product-service run-frontend \
        test lint format clean \
        db-start db-stop db-status db-shell

PYTHON := python
PIP := pip
UVICORN := uvicorn

API_GATEWAY_DIR := backend/api-gateway
PRODUCT_SERVICE_DIR := backend/product-service
FRONTEND_DIR := frontend

POSTGRES_BIN := tools/postgresql/pgsql/bin
POSTGRES_DATA := database/postgres-data
POSTGRES_LOG := database/postgres.log

help:
	@echo "AURON Development Commands"
	@echo ""
	@echo "Application:"
	@echo "  make install                Install project dependencies"
	@echo "  make run-api-gateway       Start API Gateway"
	@echo "  make run-product-service   Start Product Service"
	@echo "  make run-frontend          Start frontend server"
	@echo ""
	@echo "Database:"
	@echo "  make db-start              Start PostgreSQL"
	@echo "  make db-stop               Stop PostgreSQL"
	@echo "  make db-status             Check PostgreSQL status"
	@echo "  make db-shell              Open PostgreSQL shell"
	@echo ""
	@echo "Quality:"
	@echo "  make test                  Run tests"
	@echo "  make lint                  Run lint checks"
	@echo "  make format                Format Python code"
	@echo "  make clean                 Remove generated files"

install: install-api-gateway install-product-service
	@echo "AURON dependencies installed."

install-api-gateway:
	cd $(API_GATEWAY_DIR) && $(PYTHON) -m pip install -r requirements.txt

install-product-service:
	cd $(PRODUCT_SERVICE_DIR) && $(PYTHON) -m pip install -r requirements.txt

run-api-gateway:
	cd $(API_GATEWAY_DIR) && $(UVICORN) app.main:app --reload --port 8000

run-product-service:
	cd $(PRODUCT_SERVICE_DIR) && $(UVICORN) app.main:app --reload --port 8001

run-frontend:
	cd $(FRONTEND_DIR) && $(PYTHON) -m http.server 5500

db-start:
	$(POSTGRES_BIN)/pg_ctl.exe -D $(POSTGRES_DATA) -l $(POSTGRES_LOG) start

db-stop:
	$(POSTGRES_BIN)/pg_ctl.exe -D $(POSTGRES_DATA) stop

db-status:
	$(POSTGRES_BIN)/pg_ctl.exe -D $(POSTGRES_DATA) status

db-shell:
	$(POSTGRES_BIN)/psql.exe -h 127.0.0.1 -U auron -d auron

test:
	$(PYTHON) -m pytest

lint:
	$(PYTHON) -m ruff check backend

format:
	$(PYTHON) -m ruff format backend

clean:
	$(PYTHON) -c "import pathlib; [p.unlink() for p in pathlib.Path('.').rglob('*.pyc') if p.is_file()]"
	$(PYTHON) -c "import shutil, pathlib; [shutil.rmtree(p) for p in pathlib.Path('.').rglob('__pycache__') if p.is_dir()]"
