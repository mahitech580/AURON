.PHONY: help \
		install install-api-gateway install-product-service \
		run-api-gateway run-product-service run-frontend \
		run-all \
		test test-verbose \
		lint format check \
		docker-up docker-down docker-restart docker-status docker-logs \
		docker-postgres docker-redis \
		db-start db-stop db-status db-shell db-reset \
		redis-ping redis-shell \
		logs clean clean-pyc \
		health health-api health-product \
		venv

# =========================================================
# Python
# =========================================================

PYTHON := python
PIP := pip
UVICORN := uvicorn
PYTEST := pytest
RUFF := ruff

# =========================================================
# Project Directories
# =========================================================

API_GATEWAY_DIR := backend/api-gateway
PRODUCT_SERVICE_DIR := backend/product-service
FRONTEND_DIR := frontend
BACKEND_DIR := backend

# =========================================================
# Application Ports
# =========================================================

API_GATEWAY_PORT := 8000
PRODUCT_SERVICE_PORT := 8001
FRONTEND_PORT := 5500

# =========================================================
# Docker
# =========================================================

COMPOSE := docker compose
COMPOSE_FILE := docker-compose.yml

POSTGRES_CONTAINER := auron-postgres
REDIS_CONTAINER := auron-redis

# =========================================================
# Local PostgreSQL Fallback
# =========================================================

POSTGRES_BIN := tools/postgresql/pgsql/bin
POSTGRES_DATA := database/postgres-data
POSTGRES_LOG := database/postgres.log

POSTGRES_HOST := 127.0.0.1
POSTGRES_PORT := 5432
POSTGRES_DB := auron
POSTGRES_USER := auron

# =========================================================
# Default Target
# =========================================================

help:
	@echo ""
	@echo "========================================================="
	@echo " AURON Development Commands"
	@echo "========================================================="
	@echo ""
	@echo "Application:"
	@echo "  make install              Install all dependencies"
	@echo "  make run-api-gateway     Start API Gateway"
	@echo "  make run-product-service Start Product Service"
	@echo "  make run-frontend        Start frontend"
	@echo "  make run-all             Show commands to run full stack"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up           Start PostgreSQL + Redis"
	@echo "  make docker-down         Stop PostgreSQL + Redis"
	@echo "  make docker-restart      Restart infrastructure"
	@echo "  make docker-status       Show container status"
	@echo "  make docker-logs         Show infrastructure logs"
	@echo "  make docker-postgres     Show PostgreSQL logs"
	@echo "  make docker-redis        Show Redis logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-start            Start local PostgreSQL"
	@echo "  make db-stop             Stop local PostgreSQL"
	@echo "  make db-status           Check local PostgreSQL"
	@echo "  make db-shell            Open PostgreSQL shell"
	@echo "  make db-reset            Reset Docker database"
	@echo ""
	@echo "Redis:"
	@echo "  make redis-ping          Test Redis"
	@echo "  make redis-shell         Open Redis CLI"
	@echo ""
	@echo "Testing:"
	@echo "  make test                Run tests"
	@echo "  make test-verbose        Run verbose tests"
	@echo ""
	@echo "Quality:"
	@echo "  make lint                Run Ruff checks"
	@echo "  make format              Format Python code"
	@echo "  make check               Run lint + tests"
	@echo ""
	@echo "Health:"
	@echo "  make health              Check all services"
	@echo "  make health-api          Check API Gateway"
	@echo "  make health-product      Check Product Service"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean               Remove generated files"
	@echo "  make clean-pyc           Remove Python cache"
	@echo ""


# =========================================================
# Installation
# =========================================================

install: install-api-gateway install-product-service
	@echo ""
	@echo "AURON dependencies installed successfully."
	@echo ""

install-api-gateway:
	@echo "Installing API Gateway dependencies..."
	cd $(API_GATEWAY_DIR) && $(PYTHON) -m pip install -r requirements.txt

install-product-service:
	@echo "Installing Product Service dependencies..."
	cd $(PRODUCT_SERVICE_DIR) && $(PYTHON) -m pip install -r requirements.txt


# =========================================================
# Virtual Environment
# =========================================================

venv:
	$(PYTHON) -m venv .venv
	@echo ""
	@echo "Virtual environment created."
	@echo "Activate it with:"
	@echo "  Windows: .venv\\Scripts\\activate"
	@echo ""


# =========================================================
# Application Services
# =========================================================

run-api-gateway:
	@echo "Starting AURON API Gateway on port $(API_GATEWAY_PORT)..."
	cd $(API_GATEWAY_DIR) && $(UVICORN) app.main:app --reload --host 0.0.0.0 --port $(API_GATEWAY_PORT)

run-product-service:
	@echo "Starting AURON Product Service on port $(PRODUCT_SERVICE_PORT)..."
	cd $(PRODUCT_SERVICE_DIR) && $(UVICORN) app.main:app --reload --host 0.0.0.0 --port $(PRODUCT_SERVICE_PORT)

run-frontend:
	@echo "Starting AURON frontend on port $(FRONTEND_PORT)..."
	cd $(FRONTEND_DIR) && $(PYTHON) -m http.server $(FRONTEND_PORT)

run-all:
	@echo ""
	@echo "AURON Full Stack"
	@echo "========================================================="
	@echo ""
	@echo "Terminal 1:"
	@echo "  make docker-up"
	@echo ""
	@echo "Terminal 2:"
	@echo "  make run-api-gateway"
	@echo ""
	@echo "Terminal 3:"
	@echo "  make run-product-service"
	@echo ""
	@echo "Terminal 4:"
	@echo "  make run-frontend"
	@echo ""


# =========================================================
# Docker Infrastructure
# =========================================================

docker-up:
	@echo "Starting AURON infrastructure..."
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

docker-down:
	@echo "Stopping AURON infrastructure..."
	$(COMPOSE) -f $(COMPOSE_FILE) down

docker-restart:
	@echo "Restarting AURON infrastructure..."
	$(COMPOSE) -f $(COMPOSE_FILE) down
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

docker-status:
	@echo ""
	@echo "AURON Docker Services"
	@echo "========================================================="
	$(COMPOSE) -f $(COMPOSE_FILE) ps
	@echo ""

docker-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

docker-postgres:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f postgres

docker-redis:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f redis


# =========================================================
# Docker Individual Services
# =========================================================

docker-postgres:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d postgres

docker-redis:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d redis


# =========================================================
# PostgreSQL - Local Fallback
# =========================================================

db-start:
	@echo "Starting local PostgreSQL..."
	$(POSTGRES_BIN)/pg_ctl.exe \
		-D $(POSTGRES_DATA) \
		-l $(POSTGRES_LOG) \
		start

db-stop:
	@echo "Stopping local PostgreSQL..."
	$(POSTGRES_BIN)/pg_ctl.exe \
		-D $(POSTGRES_DATA) \
		stop

db-status:
	$(POSTGRES_BIN)/pg_ctl.exe \
		-D $(POSTGRES_DATA) \
		status

db-shell:
	$(POSTGRES_BIN)/psql.exe \
		-h $(POSTGRES_HOST) \
		-p $(POSTGRES_PORT) \
		-U $(POSTGRES_USER) \
		-d $(POSTGRES_DB)

db-reset:
	@echo "WARNING: This will DELETE the AURON Docker database."
	@echo "Press Ctrl+C to cancel."
	@timeout /t 5
	$(COMPOSE) down -v
	$(COMPOSE) up -d


# =========================================================
# Redis
# =========================================================

redis-ping:
	@echo "Testing Redis..."
	$(COMPOSE) exec redis redis-cli ping

redis-shell:
	$(COMPOSE) exec redis redis-cli


# =========================================================
# Testing
# =========================================================

test:
	@echo "Running AURON tests..."
	$(PYTHON) -m $(PYTEST)

test-verbose:
	@echo "Running AURON tests in verbose mode..."
	$(PYTHON) -m $(PYTEST) -v


# =========================================================
# Code Quality
# =========================================================

lint:
	@echo "Running Ruff lint checks..."
	$(PYTHON) -m $(RUFF) check $(BACKEND_DIR)

format:
	@echo "Formatting Python code..."
	$(PYTHON) -m $(RUFF) format $(BACKEND_DIR)

check: lint test
	@echo ""
	@echo "AURON quality checks passed."
	@echo ""


# =========================================================
# Health Checks
# =========================================================

health:
	@echo ""
	@echo "========================================================="
	@echo " AURON Health Check"
	@echo "========================================================="
	@echo ""

	@echo "[Docker]"
	@$(COMPOSE) ps

	@echo ""
	@echo "[API Gateway]"
	@curl -s http://localhost:$(API_GATEWAY_PORT)/health || echo "API Gateway unavailable"

	@echo ""
	@echo "[Product Service]"
	@curl -s http://localhost:$(PRODUCT_SERVICE_PORT)/health || echo "Product Service unavailable"

	@echo ""
	@echo "[Redis]"
	@$(COMPOSE) exec -T redis redis-cli ping || echo "Redis unavailable"

	@echo ""

health-api:
	@echo "Checking API Gateway..."
	@curl -s http://localhost:$(API_GATEWAY_PORT)/health

health-product:
	@echo "Checking Product Service..."
	@curl -s http://localhost:$(PRODUCT_SERVICE_PORT)/health


# =========================================================
# Cleanup
# =========================================================

clean-pyc:
	@echo "Removing Python cache files..."
	$(PYTHON) -c "import pathlib; [p.unlink() for p in pathlib.Path('.').rglob('*.pyc') if p.is_file()]"
	$(PYTHON) -c "import shutil, pathlib; [shutil.rmtree(p) for p in pathlib.Path('.').rglob('__pycache__') if p.is_dir()]"

clean: clean-pyc
	@echo "Removing generated test/cache directories..."
	$(PYTHON) -c "import shutil, pathlib; [shutil.rmtree(p) for p in pathlib.Path('.').rglob('.pytest_cache') if p.is_dir()]"
	$(PYTHON) -c "import shutil, pathlib; [shutil.rmtree(p) for p in pathlib.Path('.').rglob('.ruff_cache') if p.is_dir()]"
	@echo ""
	@echo "AURON cleanup complete."
