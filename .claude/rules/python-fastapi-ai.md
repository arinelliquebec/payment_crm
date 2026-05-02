---
paths:
  - "services/ai-service/**/*.py"
  - "services/ai-service/pyproject.toml"
  - "services/ai-service/requirements*.txt"
  - "services/ai-service/Dockerfile"
---

# Python FastAPI AI Service

This service is for AI-specific capabilities such as LLM orchestration, embeddings, semantic search, document processing, classification, extraction, recommendations, or model-facing workflows.

Keep AI logic isolated from the BFF and core backend.

Responsibilities:
- expose AI-specific HTTP APIs through FastAPI
- validate requests and responses
- isolate LLM/provider integrations
- manage prompts, embeddings, retrieval, or AI pipelines
- provide predictable contracts to the BFF/backend
- handle timeouts, retries, and provider errors
- avoid leaking provider-specific details to callers

Rules:
- keep routes thin
- put business/AI workflows in service modules
- isolate provider clients under `clients/` or `providers/`
- validate input/output with Pydantic
- never log prompts containing secrets or sensitive user data
- never hardcode API keys
- use environment variables for configuration
- add health/readiness endpoints
- add structured logging
- add tests for prompt builders, parsers, and service logic

Suggested structure:

```text
services/ai-service/
  app/
    main.py
    api/
      routes/
    core/
      config.py
      logging.py
    schemas/
    services/
    clients/
    providers/
    prompts/
    tests/
  pyproject.toml
  Dockerfile