---
paths:
  - "mocks/**/*"
  - "seed/**/*"
  - "frontend/**/*"
  - "bff/**/*"
  - "backend/**/*"
  - "services/**/*"
  - ".env.example"
  - "docker-compose*.yml"
---

# Mock Data and Data Safety

This is a public portfolio project.

Never use real data from any employer, ex-employer, client, customer, production system, private database, logs, screenshots, emails, contracts, invoices, tickets, payment records, PIX keys, boleto data, CPF, CNPJ, phone numbers, addresses, or credentials.

Use only synthetic data.

Allowed:
- fake customer names
- fake company names
- fake emails using example.com, demo.local, or test.local
- fake payment records
- fake invoices
- fake transaction IDs
- fake PIX/Boleto-like records
- fake dates and amounts
- local development placeholders
- .env.example placeholders

Forbidden:
- real company credentials
- real Azure/PostgreSQL connection strings from an employer
- real customer data
- real payment payloads
- real logs
- real screenshots
- anonymized employer data that still came from a real source

When creating mock data:
- use clearly fake names
- use example.com, demo.local, or test.local
- use non-real document numbers
- use deterministic seeds when possible
- keep data realistic but fictional
- document that all data is synthetic

Ask before touching .env, MCP configs, database credentials, auth, deployment settings, or destructive SQL.
