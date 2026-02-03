.PHONY: help build up down logs restart clean dev test lint

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs (use: make logs s=api)
	docker-compose logs -f $(s)

restart: ## Restart a service (use: make restart s=api)
	docker-compose restart $(s)

clean: ## Stop and remove all containers, volumes, and images
	docker-compose down -v --rmi local

dev: ## Start only infrastructure (postgres, kafka, zookeeper)
	docker-compose up -d postgres kafka zookeeper

test: ## Run tests
	npm run test

lint: ## Run linter
	npm run lint

ps: ## Show running containers
	docker-compose ps

shell: ## Open shell in api container
	docker-compose exec api sh
