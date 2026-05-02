#!/usr/bin/env bash
# Carrega seed/seed-demo.sql com sintaxe de ligação correta.
#
# Anti-padrão (NÃO usar):
#   psql "host=... port=... user=..." -d outra_base ...
#   - libpq trata o primeiro argumento como conninfo e o "user" lá dentro
#     pode ser interpretado como toda a string, resultando em erros do tipo
#     "password authentication failed for user \"host=... user=...\"".
#
# Padrão correto:
#   - export PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE individualmente
#     (PGUSER deve conter APENAS o nome do utilizador), ou
#   - export DEV_DB_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require'
#
# Uso:
#   export PGHOST=... PGUSER=... PGPASSWORD=...
#   export PGDATABASE=payment_crm_demo   # opcional; default abaixo
#   ./seed/run-demo-seed.sh
#
# Ou:
#   export DEV_DB_URL='postgresql://user:pass@host:5432/payment_crm_demo?sslmode=require'
#   ./seed/run-demo-seed.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED_FILE="$ROOT/seed/seed-demo.sql"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Ficheiro em falta: $SEED_FILE" >&2
  exit 1
fi

# Validação: PGUSER deve ser apenas o login. Se contém espaços, '=', ou
# começa com 'host=', a shell do utilizador exportou a conninfo inteira.
if [[ -n "${PGUSER:-}" ]] && [[ "$PGUSER" =~ [[:space:]=] || "$PGUSER" == host=* ]]; then
  cat >&2 <<EOF
PGUSER parece conter uma connection string em vez de um login:
  PGUSER='${PGUSER}'

Corrija com, por exemplo:
  export PGUSER='nome_do_utilizador'           # apenas o login
  # opcional, recomendado em Azure:
  export PGSSLMODE=require

Ou use uma URL única:
  export DEV_DB_URL='postgresql://user:pass@host:5432/payment_crm_demo?sslmode=require'
  unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
EOF
  exit 2
fi

run_psql() {
  psql "$@" -v ON_ERROR_STOP=1 -f "$SEED_FILE"
}

if [[ -n "${DEV_DB_URL:-}" ]]; then
  run_psql "$DEV_DB_URL"
elif [[ -n "${DATABASE_URL:-}" ]]; then
  run_psql "$DATABASE_URL"
else
  : "${PGHOST:?defina PGHOST ou DEV_DB_URL}"
  : "${PGUSER:?defina PGUSER ou DEV_DB_URL}"
  PGPORT="${PGPORT:-5432}"
  PGDATABASE="${PGDATABASE:-payment_crm_demo}"

  # Guard: 'postgres' / 'postgresql' são bases administrativas; o seed
  # nunca deve ir para lá. Aborta com mensagem clara.
  case "$PGDATABASE" in
    postgres|postgresql|template0|template1|azure_*)
      cat >&2 <<EOF
PGDATABASE='${PGDATABASE}' aponta para uma base administrativa.
O seed deve ser aplicado apenas em 'payment_crm_demo' (ou outra base de demo).

Corrija com:
  export PGDATABASE=payment_crm_demo
EOF
      exit 3
      ;;
  esac

  export PGSSLMODE="${PGSSLMODE:-require}"
  run_psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"
fi
