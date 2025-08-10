# Goal Tracker Development Commands

.PHONY: help install dev build clean test logs

help: ## Show this help message
	@echo "Goal Tracker - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies for both frontend and backend
	@echo "Installing backend dependencies..."
	@cd backend && go mod tidy
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

dev: ## Start development environment with Docker Compose
	@echo "Starting development environment..."
	@docker-compose up --build

dev-detached: ## Start development environment in background
	@echo "Starting development environment in background..."
	@docker-compose up --build -d

build: ## Build production images
	@echo "Building production images..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

clean: ## Clean up Docker containers and images
	@echo "Cleaning up..."
	@docker-compose down --volumes --remove-orphans
	@docker system prune -f

logs: ## Show logs from all services
	@docker-compose logs -f

logs-backend: ## Show backend logs only
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs only
	@docker-compose logs -f frontend

logs-db: ## Show database logs only
	@docker-compose logs -f postgres

stop: ## Stop all services
	@docker-compose down

restart: ## Restart all services
	@docker-compose restart

shell-backend: ## Open shell in backend container
	@docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	@docker-compose exec frontend sh

shell-db: ## Open postgres shell
	@docker-compose exec postgres psql -U postgres -d goaltracker

test-backend: ## Run backend tests
	@cd backend && go test ./...

test-frontend: ## Run frontend tests
	@cd frontend && npm test

migrate: ## Run database migrations
	@docker-compose exec backend sh -c "go run main.go migrate"

seed: ## Seed the database with sample data
	@docker-compose exec backend sh -c "go run main.go seed"