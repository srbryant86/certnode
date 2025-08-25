.PHONY: help build run curl-health install-dev clean

help: ## Show this help
@echo "CertNode Make Targets:"
@grep -E "^[a-zA-Z_-]+:.*?## .*$$" $(MAKEFILE_LIST) | awk "BEGIN {FS = \":.*?## \"}; {printf \"\\033[36m%-15s\\033[0m %s\\n\", \$$1, \$$2}"

build: ## Build docker image
docker build -f infra/Dockerfile -t certnode:latest .

run: ## Run locally (container)
docker run --rm -it -p 8080:8080 -e APP_ENV=development -e LOG_LEVEL=DEBUG certnode:latest

curl-health: ## Test local endpoints
@echo "→ /healthz"; curl -s http://localhost:8080/healthz | python3 -m json.tool || true
@echo "→ /readyz";  curl -s http://localhost:8080/readyz  | python3 -m json.tool || true
@echo "→ /metrics (head)"; curl -s http://localhost:8080/metrics | head -10 || true

install-dev: ## Install Python dev deps
pip install -r requirements.txt
pip install black flake8 mypy pytest

clean: ## Clean artifacts
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
docker rmi certnode:latest 2>/dev/null || true