---
paths:
  - ".github/workflows/**/*"
  - "docker-compose*.yml"
  - "Dockerfile"
  - "**/Dockerfile"
  - "infra/**/*"
  - "**/*.yml"
  - "**/*.yaml"
  - "DOCKER-GUIDE.md"
  - "NATIVE-MAC-GUIDE.md"
  - "VERCEL_DEPLOY.md"
---

# Infrastructure / DevOps

Optimize for reproducible local development and cloud-ready deployment.

Rules:
- never commit secrets
- never modify CI/CD secrets
- do not change deployment credentials
- prefer `.env.example` over real `.env`
- keep Docker Compose files clear and environment-specific
- document required services
- add health checks where useful
- keep local dev setup simple

Ask before changing:
- deployment config
- cloud permissions
- secret handling
- production-like infrastructure
- CI/CD authentication