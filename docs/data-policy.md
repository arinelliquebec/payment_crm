# Data policy — synthetic-only

> **Scope.** This policy governs every byte of demo / fixture / mock data that
> ships in this public portfolio repository, and every byte that the seed
> scripts insert into a development database.

This is a public portfolio project. Although the architecture and code are
treated as production-grade, the **data** is, and must remain, entirely
fictional. This document is the source of truth for what's allowed.

---

## 1. Hard rules

The repository and any database it seeds **must never** contain:

* Real names, emails, phones, addresses, signatures, or photos of any person,
  whether they were ever a colleague, client, prospect, vendor, or third party.
* CPFs, CNPJs, RGs, CNHs, OAB numbers, or any other government-issued
  identifier that belongs to a real person or company.
* PIX keys (CPF, CNPJ, email, phone, EVP UUID linked to a real account),
  boleto barcodes / linhas digitáveis, NSU codes, transaction ids, payment
  authorizations, settlement files, or anything that could be replayed.
* Real bank account numbers, agency codes, IBANs, card PANs, BINs, or
  cryptographic key material.
* Production logs, support tickets, screenshots, exports, dumps, or files of
  any kind originating from a previous employer or any third-party system.
* Real internal product names, project codenames, partner names, or any
  identifier that maps back to a specific organization.
* Tokens, JWTs, API keys, OAuth client secrets, database connection strings,
  or `.env` files (use `.env.example` placeholders only).

If a contributor is unsure whether a value is real or synthetic, the value
**does not go in**.

---

## 2. Allowed sources

* Algorithmically generated values that respect a documented format
  (e.g. CPF/CNPJ checksum, CEP shape).
* Neutral fictional catalogs maintained inside the repo (first names, last
  names, company suffixes) — every entry in those catalogs must be reviewed
  to ensure it does not match a real person known to the contributor.
* Public-domain, clearly fictional placeholders (`Lorem ipsum`, `Cidade Demo`,
  `[DEMO] …`).

---

## 3. Reserved markers

Demo data carries explicit markers so it can be located, audited, and purged
without ambiguity.

### Display strings

* Display names start with `[DEMO]` (e.g. `[DEMO] Pessoa Demo 003`,
  `[DEMO] Empresa Exemplo 04 Ltda`, `[DEMO] Filial Norte`).
* Free-text observation columns are prefixed with `[DEMO]` whenever a marker
  is feasible.
* Pasta numbers and similar identifiers use the prefix `[DEMO]-` (e.g.
  `[DEMO]-2026-0042`).

### Document numbers

* **CPF**: every demo CPF starts with the prefix `999` (so the visible value
  looks like `999.xxx.xxx-yz`). Check digits are still computed correctly so
  the value is structurally valid, but the leading prefix flags it as demo.
* **CNPJ**: every demo CNPJ starts with the prefix `99` (visible as
  `99.xxx.xxx/0001-yz`). Same checksum rule.
* **CEP**: demo CEPs start with `9` (visible as `9xxxx-xxx`).

### Emails

Only the following domains are allowed in demo / mock data:

| Domain        | Source                            | Example                       |
| ------------- | --------------------------------- | ----------------------------- |
| `example.com` | RFC 2606                          | `demo.pf+003@example.com`     |
| `example.org` | RFC 2606                          | `contato.pj+04@example.org`   |
| `example.net` | RFC 2606                          | `demo.parceiro+01@example.net` |
| `demo.local`  | Private-use (RFC 6762, mDNS-safe) | `demo-admin@demo.local`       |
| `test.local`  | Private-use                       | `qa@test.local`               |

Any other domain is forbidden.

### Phone numbers

Only the following Brazilian formats are allowed:

* Mobile: `(11) 90000-XXXX` — the `90000` block is reserved by this project
  as a non-allocatable test range; combined with `[DEMO]` markers around the
  row, it cannot match a real subscriber.
* Landline: `(11) 3000-XXXX` — same logic.

### URLs / file references

Use `demo://placeholder.pdf`, `demo://placeholder.png`, etc. The `demo://`
scheme is intentionally non-resolvable.

### Passwords

Demo `Usuarios.Senha` rows store the literal string
`__DEMO_PLACEHOLDER_RESET_BEFORE_USE__`. This is **not** a valid bcrypt hash;
it disables login until the password is explicitly reset by the application.
**Never** commit a real hash, even one generated from a throwaway password.

---

## 4. Where demo data lives

| Path                                   | Purpose                                                                |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `seed/seed-demo.sql`                   | Backend SQL seed for the dev PostgreSQL DB. **Persisted.**             |
| `seed/README.md`                       | Operational doc for running / verifying / purging the seed.            |
| `backend/Tests/Helpers/`               | Test fixtures for unit / integration tests. **In-memory only.**        |
| `frontend/src/mocks/`                  | Frontend mocks (Storybook, MSW, snapshot tests). **Build/dev only.**   |
| `mocks/README.md`                      | Top-level pointer + scope summary.                                     |
| `docs/data-policy.md`                  | This document.                                                         |

Anything outside these paths must not contain demo data.

---

## 5. Adding new demo data

Before adding new demo records (e.g. extending the seed to cover Boletos
once the migration ships):

1. Open an issue or ADR describing the entity and the volume target.
2. Define the marker strategy for that entity if existing markers don't fit.
   Markers must be locatable by a single `WHERE` clause.
3. Add a generator (SQL function, C# helper, or TypeScript util) — never
   hard-code lists copied from anywhere.
4. Update this document's [Reserved markers](#3-reserved-markers) section if
   you introduce a new convention.
5. Update `seed/README.md` and the volumes table in it.
6. Add or extend the safety tests under
   `backend/Tests/Demo/DemoDataSafetyTests.cs` (when that suite exists) to
   verify every column you populated continues to satisfy this policy.

---

## 6. Enforcement

These checks are recommended in CI (some may not exist yet — track them as
TODOs):

* **Static**: a regex grep over `seed/`, `backend/Tests/`, `frontend/src/mocks/`
  that fails the build if it finds an email outside the allowed-domains list,
  a CPF / CNPJ that doesn't start with the demo prefix, or a phone outside the
  reserved blocks.
* **Schema-aware** (post-seed, dev DB only): a SQL check that counts rows
  whose markers do not match this policy and fails if any are found.
* **Secrets**: `gitleaks` / equivalent on PRs, blocking `.env`, real-looking
  hashes, JWTs, or AWS keys.

---

## 7. Incident response

If at any point you discover that real data has been committed:

1. **Stop**. Do not push more commits.
2. Remove the data from the working tree and rewrite history with `git filter-repo`
   or `git rebase -i` so the secret/data never reaches `origin/main`.
3. Force-push only after coordinating; if it already reached `origin`, treat
   the secret as compromised: rotate it (passwords, tokens, keys) and notify
   the data subject if the leak involves personal data.
4. Open a postmortem note in `docs/` describing how the data slipped through
   and what control you'll add to prevent recurrence.

---

## 8. Relationship to architecture

This policy intentionally sits beside the architecture docs (`docs/adr/`,
`docs/architecture/`) because it carries the same weight as architectural
decisions: **the project is publicly visible, and the cost of a leak is
permanent.** Treat any deviation from this policy as a security incident,
not a stylistic disagreement.
