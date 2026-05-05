workspace "Payment CRM" "Portfolio CRM / fintech: leads, clientes, contratos, boletos, RAG assistant." {

    model {

        // -------- People --------
        vendedor = person "Vendedor / Consultor" "Operates leads, contratos, boletos and follows up with clients."
        admin    = person "Administrador" "Manages users, groups, permissions, audit logs."
        cliente  = person "Cliente Portal" "Reviews own boletos, contratos and documents through the Portal."

        // -------- External systems --------
        santander    = softwareSystem "Santander Cobranca API" "Issues boletos and Pix charges, returns status callbacks."             "External"
        azureBlob    = softwareSystem "Azure Blob Storage"     "Stores contract documents and generated PDFs."                        "External"
        azureOpenAI  = softwareSystem "Azure OpenAI"           "Hosts gpt-4o for RAG-driven assistant queries."                       "External"
        resend       = softwareSystem "Resend"                 "Transactional email delivery (boletos, password reset, notifications)." "External"
        appInsights  = softwareSystem "Azure Application Insights" "Receives backend traces, metrics and structured logs."             "External"
        sentry       = softwareSystem "Sentry"                 "Captures frontend client and server errors."                          "External"

        // -------- Internal system --------
        crm = softwareSystem "Payment CRM" "Lead-to-cash CRM with billing, document management and RAG assistant." {

            frontend = container "Next.js Frontend and BFF" "UI plus Route Handlers, Server Actions and server-only modules. Owns the session cookie and the same-origin /api/backend proxy to the backend." "Next.js 16 / React 19 / TypeScript"

            gateway = container "API Gateway" "Thin Go edge: routing, CORS, auth boundary, rate limiting, correlation IDs, logging, health checks. Skeleton in gateway/; not yet in the browser path." "Go 1.22 / net/http" "Planned"

            backend = container "Backend API" "Domain logic, EF Core persistence, JWT issuance, business workflows and external integrations." ".NET 10 / ASP.NET Core / EF Core 10 / Npgsql"

            db = container "PostgreSQL" "Primary persistence for clientes, contratos, boletos, audit logs, idempotency keys, sessoes ativas and lead pipeline." "PostgreSQL 16" "Database"

            cache = container "Redis Cache" "Planned read-through cache for sessions and frequent reads. Package referenced in csproj, not wired at runtime." "Redis 7" "Planned"
        }

        // -------- People to system --------
        vendedor -> frontend "Operates the CRM in the browser"   "HTTPS"
        admin    -> frontend "Manages users, groups and audit"    "HTTPS"
        cliente  -> frontend "Accesses Portal Cliente"            "HTTPS"

        // -------- Frontend wiring --------
        frontend -> backend "Server-side fetch via /api/backend/[...path] (same-origin proxy)" "HTTPS / JSON"
        frontend -> sentry  "Reports client and server errors"                                  "HTTPS"

        // -------- Gateway (planned future path) --------
        frontend -> gateway "Future: routes through edge instead of calling backend directly"   "HTTPS"
        gateway  -> backend "Reverse-proxies validated requests after JWT verify"               "HTTPS / JSON"

        // -------- Backend wiring --------
        backend -> db    "Reads and writes via Npgsql and EF Core" "TCP 5432"
        backend -> cache "Planned cache reads and writes"          "TCP 6379"

        // -------- Backend to external --------
        backend -> santander    "Issues boletos and Pix charges"                "HTTPS / mTLS"
        backend -> azureBlob    "Uploads contract PDFs and documents"           "HTTPS"
        backend -> azureOpenAI  "Sends RAG-enriched prompts and reads completions" "HTTPS"
        backend -> resend       "Sends transactional email"                     "HTTPS"
        backend -> appInsights  "Streams traces, metrics and logs"              "HTTPS"
    }

    views {

        systemContext crm "SystemContext" "Who uses Payment CRM and what it integrates with." {
            include *
            autolayout lr
        }

        container crm "Containers" "Internal containers of Payment CRM and their connections." {
            include *
            autolayout lr
        }

        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #2e7d32
                color #ffffff
            }
            element "Planned" {
                background #b07b00
                color #ffffff
            }
        }
    }
}
