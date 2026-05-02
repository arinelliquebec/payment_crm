-- ============================================================================
-- seed/seed-demo.sql
-- ----------------------------------------------------------------------------
-- Synthetic demo data for the Payment CRM portfolio project.
--
-- 100 % FICTIONAL. Every name, email, document, phone, address and value here
-- is generated from algorithms or from neutral fictional catalogs. There is
-- ZERO data sourced from real customers, partners, ex-employer systems, or
-- third-party datasets.
--
-- Conventions enforced by this script:
--   * All person/company display names start with the marker  "[DEMO]"
--   * All emails use reserved test domains:
--       example.com / example.org / example.net  (RFC 2606)
--       demo.local  / test.local                 (private-use)
--   * All phones use the reserved test prefixes:
--       "(11) 90000-XXXX"  (mobile)
--       "(11) 3000-XXXX"   (landline)
--   * All CPFs start with prefix "999..."   (checksum-valid; demo prefix)
--   * All CNPJs start with prefix "99..."   (checksum-valid; demo prefix)
--   * All inserted Ids start at 10_000_000 to avoid colliding with rows
--     produced by the application's own ID generator
--   * Passwords are NON-FUNCTIONAL placeholders. They MUST be replaced with
--     real bcrypt hashes through the application's password reset flow before
--     anyone can log in.
--
-- Safety properties:
--   * Single transaction. Any error rolls back everything.
--   * Refuses to run if the target schema already contains person rows that
--     do NOT carry the [DEMO] marker (override: SET demo.allow_non_empty TO 'true').
--   * Helper functions are created in pg_temp (auto-dropped at session end).
--   * Only INSERTs into the 11 listed tables. No DDL on application tables.
--   * Idempotent: re-running is safe (ON CONFLICT DO NOTHING).
--
-- How to run (only after explicit human approval — see seed/README.md):
--   psql "$YOUR_DEV_CONNSTRING" -v ON_ERROR_STOP=1 -f seed/seed-demo.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Safety gate
-- ----------------------------------------------------------------------------

DO $safety$
DECLARE
  non_demo_pf  int;
  non_demo_pj  int;
  override_set text;
BEGIN
  override_set := current_setting('demo.allow_non_empty', true);

  SELECT count(*) INTO non_demo_pf
    FROM "PessoasFisicas"
   WHERE "Nome" NOT LIKE '[DEMO]%';

  SELECT count(*) INTO non_demo_pj
    FROM "PessoasJuridicas"
   WHERE "RazaoSocial" NOT LIKE '[DEMO]%';

  IF (non_demo_pf + non_demo_pj) > 0 AND override_set IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'raise_exception',
      MESSAGE = format(
        'Aborting demo seed: %s non-demo PF and %s non-demo PJ row(s) detected. '
        'Refusing to mix demo data with rows that do not carry the [DEMO] marker. '
        'If this is intentional (e.g. fresh demo DB that has unrelated rows you '
        'accept to coexist with), run BEFORE this script:  '
        'SET demo.allow_non_empty TO ''true'';',
        non_demo_pf, non_demo_pj);
  END IF;
END;
$safety$;

-- ----------------------------------------------------------------------------
-- 1. Helper functions (session-local, auto-dropped at session end)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.cpf_format(d9 text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $f$
DECLARE
  s int := 0; m int; d1 int; d2 int;
BEGIN
  IF length(d9) <> 9 OR d9 !~ '^\d{9}$' THEN
    RAISE EXCEPTION 'cpf_format expects 9 digits, got %', d9;
  END IF;
  FOR i IN 1..9 LOOP
    s := s + substring(d9 from i for 1)::int * (11 - i);
  END LOOP;
  m  := s % 11;
  d1 := CASE WHEN m < 2 THEN 0 ELSE 11 - m END;

  s := 0;
  FOR i IN 1..10 LOOP
    s := s + substring(d9 || d1::text from i for 1)::int * (12 - i);
  END LOOP;
  m  := s % 11;
  d2 := CASE WHEN m < 2 THEN 0 ELSE 11 - m END;

  RETURN substring(d9 from 1 for 3) || '.' ||
         substring(d9 from 4 for 3) || '.' ||
         substring(d9 from 7 for 3) || '-' ||
         d1::text || d2::text;
END;
$f$;

CREATE OR REPLACE FUNCTION pg_temp.cnpj_format(d12 text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $f$
DECLARE
  w1 int[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 int[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s  int   := 0; m int; d1 int; d2 int;
BEGIN
  IF length(d12) <> 12 OR d12 !~ '^\d{12}$' THEN
    RAISE EXCEPTION 'cnpj_format expects 12 digits, got %', d12;
  END IF;
  FOR i IN 1..12 LOOP
    s := s + substring(d12 from i for 1)::int * w1[i];
  END LOOP;
  m  := s % 11;
  d1 := CASE WHEN m < 2 THEN 0 ELSE 11 - m END;

  s := 0;
  FOR i IN 1..13 LOOP
    s := s + substring(d12 || d1::text from i for 1)::int * w2[i];
  END LOOP;
  m  := s % 11;
  d2 := CASE WHEN m < 2 THEN 0 ELSE 11 - m END;

  RETURN substring(d12 from 1 for  2) || '.' ||
         substring(d12 from 3 for  3) || '.' ||
         substring(d12 from 6 for  3) || '/' ||
         substring(d12 from 9 for  4) || '-' ||
         d1::text || d2::text;
END;
$f$;

-- ----------------------------------------------------------------------------
-- 2. Filiais (3)
-- ----------------------------------------------------------------------------

INSERT INTO "Filiais" ("Id","Nome","DataInclusao","UsuarioImportacao") VALUES
  (10000001, '[DEMO] Filial Norte',  now() - interval '180 days', 'demo-seed'),
  (10000002, '[DEMO] Filial Sul',    now() - interval '180 days', 'demo-seed'),
  (10000003, '[DEMO] Filial Centro', now() - interval '180 days', 'demo-seed')
ON CONFLICT ("Nome") DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Enderecos (55: 40 PF + 15 PJ; ids 10100001..10100055)
-- ----------------------------------------------------------------------------

INSERT INTO "Enderecos"
  ("Id","Cidade","Bairro","Logradouro","Cep","Numero","Complemento")
SELECT
  10100000 + n,
  CASE (n % 4)
    WHEN 0 THEN 'Cidade Demo Norte'
    WHEN 1 THEN 'Cidade Demo Sul'
    WHEN 2 THEN 'Cidade Demo Leste'
    ELSE        'Cidade Demo Oeste'
  END,
  '[DEMO] Bairro ' || lpad((n % 10)::text, 2, '0'),
  '[DEMO] Rua Exemplo ' || lpad(n::text, 3, '0'),
  '9' || lpad(((n * 137) % 10000)::text, 4, '0') || '-'
       || lpad(((n *  41) %  1000)::text, 3, '0'),
  lpad((n * 7)::text, 4, '0'),
  CASE (n % 3) WHEN 0 THEN '[DEMO] Sala ' || n::text ELSE NULL END
FROM generate_series(1, 55) AS n
WHERE NOT EXISTS (SELECT 1 FROM "Enderecos" WHERE "Id" = 10100000 + n);

-- ----------------------------------------------------------------------------
-- 4. PessoasFisicas (40; ids 10200001..10200040)
--    PF  1.. 5  used by Consultores
--    PF  6.. 8  used by Parceiros
--    PF  9..14  used by Usuarios
--    PF 15..40  available for Clientes / extras
-- ----------------------------------------------------------------------------

INSERT INTO "PessoasFisicas"
  ("Id","Nome","Email","Codinome","Sexo","DataNascimento","EstadoCivil",
   "Cpf","Rg","Cnh","Telefone1","Telefone2","EnderecoId",
   "DataCadastro","DataAtualizacao")
SELECT
  10200000 + n,
  '[DEMO] Pessoa Demo '   || lpad(n::text, 3, '0'),
  'demo.pf+'              || lpad(n::text, 3, '0') || '@example.com',
  '[DEMO] Codinome '      || lpad(n::text, 3, '0'),
  CASE (n % 2) WHEN 0 THEN 'F' ELSE 'M' END,
  (date '1980-01-01' + ((n * 73) % 10000))::timestamp,
  CASE (n % 4)
    WHEN 0 THEN 'Solteiro(a)'
    WHEN 1 THEN 'Casado(a)'
    WHEN 2 THEN 'Divorciado(a)'
    ELSE        'Viúvo(a)'
  END,
  pg_temp.cpf_format('999000' || lpad(n::text, 3, '0')),
  '[DEMO] RG '            || lpad(n::text, 6, '0'),
  '[DEMO] CNH '           || lpad(n::text, 6, '0'),
  '(11) 90000-'           || lpad(((n * 13) % 10000)::text, 4, '0'),
  '(11) 90000-'           || lpad(((n * 17) % 10000)::text, 4, '0'),
  10100000 + n,
  now() - interval '180 days' + ((n || ' days')::interval),
  now() - interval  '30 days' + ((n || ' days')::interval)
FROM generate_series(1, 40) AS n
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. PessoasJuridicas (15; ids 10300001..10300015)
--    Endereco PJ N -> 10100040 + N    (addresses 41..55)
--    ResponsavelTecnicoId -> PF N     (PF 1..15 must exist; they do)
-- ----------------------------------------------------------------------------

INSERT INTO "PessoasJuridicas"
  ("Id","RazaoSocial","NomeFantasia","Cnpj","ResponsavelTecnicoId","Email",
   "Telefone1","Telefone2","Telefone3","Telefone4","EnderecoId",
   "DataCadastro","DataAtualizacao")
SELECT
  10300000 + n,
  '[DEMO] Empresa Exemplo ' || lpad(n::text, 2, '0') || ' Ltda',
  '[DEMO] Marca '           || lpad(n::text, 2, '0'),
  pg_temp.cnpj_format('99' || lpad(n::text, 6, '0') || '0001'),
  10200000 + n,
  'contato.pj+' || lpad(n::text, 2, '0') || '@example.org',
  '(11) 3000-'  || lpad(((n * 31) % 10000)::text, 4, '0'),
  CASE (n % 2)
    WHEN 0 THEN '(11) 3000-' || lpad(((n * 53) % 10000)::text, 4, '0')
    ELSE NULL
  END,
  NULL,
  NULL,
  10100040 + n,
  now() - interval '180 days' + ((n || ' days')::interval),
  now() - interval  '30 days' + ((n || ' days')::interval)
FROM generate_series(1, 15) AS n
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Consultores (5; ids 10400001..10400005)  [UNIQUE on PessoaFisicaId]
-- ----------------------------------------------------------------------------

INSERT INTO "Consultores"
  ("Id","PessoaFisicaId","FilialId","OAB","DataCadastro","DataAtualizacao","Ativo")
SELECT
  10400000 + n,
  10200000 + n,
  10000000 + ((n - 1) % 3) + 1,
  '[DEMO] OAB/SP-' || lpad(n::text, 4, '0'),
  now() - interval '120 days',
  NULL,
  true
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Parceiros (3; ids 10500001..10500003)  [UNIQUE on PessoaFisicaId]
-- ----------------------------------------------------------------------------

INSERT INTO "Parceiros"
  ("Id","PessoaFisicaId","FilialId","OAB","Email","Telefone",
   "DataCadastro","DataAtualizacao","Ativo")
SELECT
  10500000 + n,
  10200000 + (5 + n),
  10000000 + ((n - 1) % 3) + 1,
  '[DEMO] OAB/RJ-'  || lpad(n::text, 4, '0'),
  'demo.parceiro+'  || lpad(n::text, 2, '0') || '@example.net',
  '(11) 90000-'     || lpad(((n * 19) % 10000)::text, 4, '0'),
  now() - interval '150 days',
  NULL,
  true
FROM generate_series(1, 3) AS n
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. Usuarios (6; ids 10600001..10600006)
--    Senha is a NON-FUNCTIONAL placeholder. The app's auth flow must reset
--    it via password-reset before anyone can log in. Do NOT commit real hashes.
-- ----------------------------------------------------------------------------

INSERT INTO "Usuarios"
  ("Id","Login","Email","Senha","GrupoAcesso","TipoPessoa",
   "PessoaFisicaId","PessoaJuridicaId","Ativo",
   "DataCadastro","DataAtualizacao","UltimoAcesso")
VALUES
  (10600001,'demo-admin',      'demo-admin@example.com',
   '__DEMO_PLACEHOLDER_RESET_BEFORE_USE__','Administrador',           'PF',
   10200009, NULL, true, now() - interval '120 days', NULL, NULL),
  (10600002,'demo-gestor',     'demo-gestor@example.com',
   '__DEMO_PLACEHOLDER_RESET_BEFORE_USE__','Gestor de Filial',        'PF',
   10200010, NULL, true, now() - interval '120 days', NULL, NULL),
  (10600003,'demo-consultor',  'demo-consultor@example.com',
   '__DEMO_PLACEHOLDER_RESET_BEFORE_USE__','Consultores',             'PF',
   10200011, NULL, true, now() - interval '120 days', NULL, NULL),
  (10600004,'demo-financeiro', 'demo-financeiro@example.com',
   '__DEMO_PLACEHOLDER_RESET_BEFORE_USE__','Cobrança/Financeiro',     'PF',
   10200012, NULL, true, now() - interval '120 days', NULL, NULL),
  (10600005,'demo-faturamento','demo-faturamento@example.com',
   '__DEMO_PLACEHOLDER_RESET_BEFORE_USE__','Faturamento',             'PF',
   10200013, NULL, true, now() - interval '120 days', NULL, NULL),
  (10600006,'demo-leitura',    'demo-leitura@example.com',
   '__DEMO_PLACEHOLDER_RESET_BEFORE_USE__','Administrativo de Filial','PF',
   10200014, NULL, true, now() - interval '120 days', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. Clientes (30; ids 10700001..10700030)
--    Distribution: ~70 % PF (PF ids 10200015..10200035), ~30 % PJ (PJ ids 10300001..10300009)
-- ----------------------------------------------------------------------------

INSERT INTO "Clientes"
  ("Id","TipoPessoa","PessoaFisicaId","PessoaJuridicaId","ConsultorAtualId","FilialId",
   "Status","Observacoes","ValorContrato",
   "DataCadastro","DataAtualizacao","Ativo")
SELECT
  10700000 + n,
  CASE WHEN (n % 10) < 7 THEN 'PF' ELSE 'PJ' END,
  CASE WHEN (n % 10) < 7
       THEN 10200000 + 14 + (((n - 1) % 21) + 1)
       ELSE NULL END,
  CASE WHEN (n % 10) < 7
       THEN NULL
       ELSE 10300000 + (((n - 1) % 9) + 1) END,
  10400000 + ((n - 1) % 5) + 1,
  10000000 + ((n - 1) % 3) + 1,
  CASE (n % 4)
    WHEN 0 THEN 'Ativo'
    WHEN 1 THEN 'Em negociação'
    WHEN 2 THEN 'Inadimplente'
    ELSE        'Encerrado'
  END,
  '[DEMO] Cliente sintético ' || lpad(n::text, 3, '0')
    || ' — observação fictícia para portfolio',
  round((100 + (n * 437) % 49900)::numeric, 2),
  now() - interval '180 days' + ((n * 4 || ' days')::interval),
  now() - interval  '15 days' + ((n     || ' days')::interval),
  CASE WHEN (n % 13) = 0 THEN false ELSE true END
FROM generate_series(1, 30) AS n
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. HistoricoConsultores (1 per cliente; ids 10800001..10800030)
-- ----------------------------------------------------------------------------

INSERT INTO "HistoricoConsultores"
  ("Id","ClienteId","ConsultorId","DataInicio","DataFim",
   "MotivoTransferencia","DataCadastro")
SELECT
  10800000 + n,
  10700000 + n,
  10400000 + ((n - 1) % 5) + 1,
  now() - interval '180 days' + ((n * 4 || ' days')::interval),
  NULL,
  '[DEMO] Atribuição inicial sintética',
  now() - interval '180 days' + ((n * 4 || ' days')::interval)
FROM generate_series(1, 30) AS n
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. Contratos (60; ids 10900001..10900060 — 2 per cliente)
-- ----------------------------------------------------------------------------

INSERT INTO "Contratos"
  ("Id","ClienteId","ConsultorId","ParceiroId","Situacao",
   "DataUltimoContato","DataProximoContato","ValorDevido","ValorNegociado",
   "Observacoes","NumeroPasta","DataFechamentoContrato","TipoServico","ObjetoContrato",
   "Comissao","ValorEntrada","ValorParcela","NumeroParcelas","PrimeiroVencimento",
   "AnexoDocumento","Pendencias",
   "DataCadastro","DataAtualizacao","Ativo")
SELECT
  10900000 + ((c - 1) * 2 + k),
  10700000 + c,
  10400000 + ((c - 1) % 5) + 1,
  CASE WHEN ((c + k) % 4) = 0
       THEN 10500000 + (((c + k - 1) % 3) + 1)
       ELSE NULL END,
  CASE ((c + k) % 4)
    WHEN 0 THEN 'Leed'
    WHEN 1 THEN 'Cliente'
    WHEN 2 THEN 'Inadimplente'
    ELSE        'Encerrado'
  END,
  now() - interval '60 days' + ((c || ' days')::interval),
  now() + interval '30 days' + ((c || ' days')::interval),
  round((250 + ((c * 731 + k * 113) % 49750))::numeric, 2),
  round((200 + ((c * 631 + k *  97) % 39800))::numeric, 2),
  '[DEMO] Observações fictícias do contrato ' || c::text || '/' || k::text,
  '[DEMO]-2026-' || lpad((c * 10 + k)::text, 4, '0'),
  CASE WHEN ((c + k) % 5) = 0 THEN now() - interval '15 days' ELSE NULL END,
  '[DEMO] Serviço Genérico ' || ((c + k) % 5 + 1)::text,
  '[DEMO] Objeto contratual fictício para demonstração de UI; não representa contrato real.',
  round((5  + ((c * 17 + k *  7) %   16))::numeric, 2),
  round((100 + ((c * 41 + k * 13) % 1900))::numeric, 2),
  round((50  + ((c * 23 + k * 11) % 1450))::numeric, 2),
  ((c + k) % 24) + 1,
  now() + interval '30 days' + ((c * 2 || ' days')::interval),
  'demo://placeholder.pdf',
  CASE WHEN ((c + k) % 7) = 0
       THEN '[DEMO] Pendência fictícia para teste de UI'
       ELSE NULL END,
  now() - interval '180 days' + ((c * 4 || ' days')::interval),
  now() - interval  '15 days',
  CASE WHEN ((c + k) % 11) = 0 THEN false ELSE true END
FROM generate_series(1, 30) AS c
CROSS JOIN generate_series(1, 2)  AS k
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. HistoricoSituacaoContratos (60; ids 11000001..11000060 — 1 per contrato)
-- ----------------------------------------------------------------------------

INSERT INTO "HistoricoSituacaoContratos"
  ("Id","ContratoId","SituacaoAnterior","NovaSituacao","MotivoMudanca",
   "DataMudanca","DataCadastro")
SELECT
  11000000 + n,
  10900000 + n,
  CASE (n % 4)
    WHEN 0 THEN 'Leed'
    WHEN 1 THEN 'Cliente'
    WHEN 2 THEN 'Inadimplente'
    ELSE        'Cliente'
  END,
  CASE (n % 4)
    WHEN 0 THEN 'Cliente'
    WHEN 1 THEN 'Inadimplente'
    WHEN 2 THEN 'Cliente'
    ELSE        'Encerrado'
  END,
  '[DEMO] Mudança fictícia de situação para fins de UI',
  now() - interval '60 days' + ((n || ' days')::interval),
  now() - interval '60 days' + ((n || ' days')::interval)
FROM generate_series(1, 60) AS n
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- Done. Volume summary (per ON CONFLICT-free run on an empty schema):
--   Filiais                       3
--   Enderecos                    55
--   PessoasFisicas               40
--   PessoasJuridicas             15
--   Consultores                   5
--   Parceiros                     3
--   Usuarios                      6
--   Clientes                     30
--   HistoricoConsultores         30
--   Contratos                    60
--   HistoricoSituacaoContratos   60
--   ----------------------------- ---
--   TOTAL                       307
--
-- All inserted rows can be located with the [DEMO] markers and the reserved
-- domains/numbers documented above. See seed/README.md and docs/data-policy.md
-- for the full policy and the purge procedure.
-- ============================================================================
