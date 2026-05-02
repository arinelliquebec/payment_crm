---
paths:
  - "backend/**/*.sql"
  - "backend/**/*migration*"
  - "backend/**/Migrations/**/*"
  - "setup-database.sh"
  - "**/*.sql"
---

# PostgreSQL / Database

Database changes must be migration-driven whenever possible.

Before schema changes:
1. inspect current schema
2. identify access patterns
3. propose migration
4. propose rollback
5. explain risks

Ask before:
- DROP
- TRUNCATE
- destructive DELETE
- destructive UPDATE
- destructive ALTER
- bulk data changes
- permission changes

Rules:
- use transactions for multi-step consistency
- use parameterized SQL or safe ORM APIs
- avoid unbounded queries
- use pagination
- add indexes based on query patterns
- use consistent timestamps
- never log sensitive data

PostgreSQL MCP may be used for dev inspection, but destructive commands require approval.