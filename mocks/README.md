# `mocks/` — top-level pointer

This folder is intentionally minimal. The repository keeps mock / fixture /
demo data in three locations, each with a distinct lifecycle:

| Location                     | Lifecycle      | Used by                                   |
| ---------------------------- | -------------- | ----------------------------------------- |
| `seed/seed-demo.sql`         | Persisted (DB) | The dev PostgreSQL database. See [`seed/README.md`](../seed/README.md). |
| `frontend/src/mocks/`        | Build / dev    | Storybook, MSW handlers for `pnpm dev`, snapshot tests. _Created on demand — may not exist yet._ |
| `backend/Tests/Helpers/`     | Test           | xUnit / integration tests using EF Core InMemory. |

Whatever you add to any of those folders **must follow** the project-wide data
policy: [`docs/data-policy.md`](../docs/data-policy.md).

---

## Why a top-level `mocks/`?

Because `seed/` is for backend persistence, `backend/Tests/Helpers/` is for
test isolation, and `frontend/src/mocks/` is for the Next.js bundle. There is
no shared physical home for mocks — but contributors looking for "where does
demo data live?" land here first, and this README points them to the right
place.

If we ever introduce shared mock catalogs that genuinely cross frontend/
backend boundaries (e.g. a JSON file consumed by both the .NET seed and the
Next.js Storybook), this folder is where they go.

---

## Quick rules (full text in `docs/data-policy.md`)

* Display names start with `[DEMO]`.
* Emails only on `example.com`, `example.org`, `example.net`, `demo.local`,
  `test.local`.
* CPFs start with `999`, CNPJs with `99`, CEPs with `9`.
* Phones only in `(11) 90000-XXXX` (mobile) or `(11) 3000-XXXX` (landline).
* No real names, documents, transactions, screenshots, or company data — ever.
* No bcrypt hashes, JWTs, API keys, or `.env` values committed.

When in doubt, **don't commit it**.
