SHELL := /bin/bash
DC := docker compose
ENV_FILES := apps/api/.env apps/web/.env

.PHONY: dev down migrate seed lint test ensure-env

ensure-env:
	@for file in $(ENV_FILES); do \
		if [ ! -f $$file ]; then \
			cp $$file.example $$file; \
			echo "Created $$file from example"; \
		fi; \
	done

dev: ensure-env
	$(DC) up --build

down:
	$(DC) down --remove-orphans

migrate: ensure-env
	$(DC) run --rm api alembic -c alembic.ini upgrade head

seed: ensure-env
	$(DC) run --rm api python -m app.scripts.seed

lint: ensure-env
	$(DC) run --rm web npm run lint
	$(DC) run --rm api python -m app.scripts.lint

test: ensure-env
	$(DC) run --rm web npm test
	$(DC) run --rm api pytest
