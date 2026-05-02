using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using CrmArrighi.Middleware;
using CrmArrighi.Services;
using CrmArrighi.Utils;
using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.Extensibility;
using CrmArrighi.HealthChecks;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// ✅ Em desenvolvimento, carregue também o appsettings.Production.json para usar as
// mesmas credenciais reais configuradas para produção (exigência do cliente).
// ⚠️ NUNCA carregar appsettings.Production.json em Development
// Isso expõe credenciais de produção no ambiente de desenvolvimento
// Use User Secrets (dotnet user-secrets) ou variáveis de ambiente para configurações sensíveis
#if false
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.Production.json", optional: true, reloadOnChange: true);
    Console.WriteLine("⚠️ Ambiente Development: appsettings.Production.json carregado para usar Santander real.");
}
#endif

// ============================================================================
// 📊 Azure Application Insights - Monitoramento e Telemetria
// ============================================================================
var appInsightsConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
if (!string.IsNullOrEmpty(appInsightsConnectionString))
{
    builder.Services.AddApplicationInsightsTelemetry(options =>
    {
        options.ConnectionString = appInsightsConnectionString;
        options.EnableAdaptiveSampling = true; // Amostragem adaptativa para reduzir custos
        options.EnableQuickPulseMetricStream = true; // Live Metrics Stream
        options.EnableDependencyTrackingTelemetryModule = true; // Rastrear chamadas a APIs externas (Santander, etc.)
        options.EnableRequestTrackingTelemetryModule = true; // Rastrear requisições HTTP
        options.EnableEventCounterCollectionModule = true; // Coletar métricas do .NET
    });

    // Configurações adicionais de telemetria
    builder.Services.Configure<TelemetryConfiguration>(config =>
    {
        config.DefaultTelemetrySink.TelemetryProcessorChainBuilder
            .UseAdaptiveSampling(maxTelemetryItemsPerSecond: 5) // Limitar a 5 itens/segundo
            .Build();
    });

    Console.WriteLine("📊 Application Insights configurado com sucesso!");
}
else
{
    Console.WriteLine("⚠️ Application Insights não configurado. Adicione 'ApplicationInsights:ConnectionString' no appsettings.json");
    builder.Services.AddSingleton<TelemetryClient>(_ => new TelemetryClient(new TelemetryConfiguration()));
}

// Configure timezone for Brazil
TimeZoneInfo brasiliaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");

// ✅ Configure Kestrel to accept large file uploads (remove size limits)
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = null; // Remove limit (default is 30MB)
    Console.WriteLine("✅ Kestrel: Limite de tamanho de requisição removido (aceita qualquer tamanho)");
});

// ✅ Configure FormOptions to accept large multipart bodies (for form uploads)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = long.MaxValue; // Remove limit (default is ~28.6MB)
    options.ValueLengthLimit = int.MaxValue; // Remove limit for individual form values
    options.MultipartHeadersLengthLimit = int.MaxValue; // Remove limit for headers
    Console.WriteLine("✅ FormOptions: Limites de tamanho removidos para uploads de formulários");
});

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never;
    });

// Rate Limiting - DESABILITADO (causava bloqueio excessivo)
// builder.Services.AddRateLimiter(options =>
// {
//     options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
//         RateLimitPartition.GetFixedWindowLimiter(
//             partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
//             factory: partition => new FixedWindowRateLimiterOptions
//             {
//                 AutoReplenishment = true,
//                 PermitLimit = 100, // 100 requisições
//                 Window = TimeSpan.FromMinutes(1) // por minuto
//             }));
// 
//     options.OnRejected = async (context, token) =>
//     {
//         context.HttpContext.Response.StatusCode = 429;
//         await context.HttpContext.Response.WriteAsync(
//             "Muitas requisições. Tente novamente em alguns segundos.",
//             token
//         );
//     };
// });

// Swagger/OpenAPI - Documentação da API (.NET 10)
// TEMPORARIAMENTE COMENTADO - Conflito de versão do Microsoft.OpenApi
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddOpenApi("v1", options =>
// {
//     options.AddDocumentTransformer((document, context, cancellationToken) =>
//     {
//         document.Info = new()
//         {
//             Title = "CRM Arrighi API",
//             Version = "v1",
//             Description = "API do Sistema de CRM Arrighi Advogados"
//         };
//         return Task.CompletedTask;
//     });
// });

// Configure Forwarded Headers for Reverse Proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
    // Allow all IPs for development - in production, specify your proxy IPs
    options.RequireHeaderSymmetry = false;
    options.ForwardLimit = null;
});

// Add Entity Framework
var databaseConnectionString = GetPostgreSqlConnectionString(builder.Configuration);
builder.Services.AddDbContext<CrmArrighiContext>(options =>
    options.UseNpgsql(databaseConnectionString));

// Register HttpClient
builder.Services.AddHttpClient();

// ============================================================================
// 💾 In-Memory Cache - Cache de dados em memória
// ============================================================================
builder.Services.AddMemoryCache();
Console.WriteLine("💾 Memory Cache configurado");

// Register Santander Boleto Service (sem HttpClient injetado - cria o próprio com certificado)
builder.Services.AddScoped<ISantanderBoletoService, SantanderBoletoService>();

// Register Authorization Service
builder.Services.AddScoped<IAuthorizationService, AuthorizationService>();

// Register Permission Service
builder.Services.AddScoped<IPermissionService, PermissionService>();

// Register Group Access Service
builder.Services.AddScoped<IGroupAccessService, GroupAccessService>();

// Register Database Index Service (para manutenção de índices)
builder.Services.AddScoped<DatabaseIndexService>();

// Register Seed Data Service
builder.Services.AddScoped<ISeedDataService, SeedDataService>();

// Register Inadimplencia Analysis Service (IA de previsão de risco)
builder.Services.AddScoped<IInadimplenciaAnalysisService, InadimplenciaAnalysisService>();

// Register Forecast Service (Previsão de Receita)
builder.Services.AddScoped<IForecastService, ForecastService>();

// Register Dashboard Financeiro Service (Gráficos e KPIs financeiros)
builder.Services.AddScoped<IDashboardFinanceiroService, DashboardFinanceiroService>();

// Register Audit Service (Sistema de Auditoria)
builder.Services.AddScoped<IAuditService, AuditService>();

// Register Notificacao Service (Sistema de Notificações)
builder.Services.AddScoped<INotificacaoService, NotificacaoService>();

// Register Lead Service (Pipeline de Vendas)
builder.Services.AddScoped<LeadService>();

// Register Usuario Filial Service
builder.Services.AddScoped<IUsuarioFilialService, UsuarioFilialService>();

// Register Usuario Grupo Filial Service
builder.Services.AddScoped<IUsuarioGrupoFilialService, UsuarioGrupoFilialService>();

// Register Azure Blob Storage Service
builder.Services.AddScoped<IAzureBlobStorageService, AzureBlobStorageService>();

// Register Email Service
builder.Services.AddScoped<IEmailService, EmailService>();

// Register Telemetry Service (Application Insights)
builder.Services.AddSingleton<ITelemetryService, TelemetryService>();
builder.Services.AddHttpContextAccessor(); // Necessário para o TelemetryInitializer
builder.Services.AddSingleton<Microsoft.ApplicationInsights.Extensibility.ITelemetryInitializer, CrmArrighi.Telemetry.CrmTelemetryInitializer>();

// Register Azure OpenAI Service (Assistente de IA)
builder.Services.AddHttpClient<IAzureOpenAIService, AzureOpenAIService>()
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
#if DEBUG
        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
#endif
    });
Console.WriteLine("🤖 Azure OpenAI Service registrado");

// ============================================================================
// 🧠 RAG Services - Retrieval-Augmented Generation
// ============================================================================
builder.Services.AddScoped<CrmArrighi.Services.RAG.IIntentAnalyzer, CrmArrighi.Services.RAG.IntentAnalyzer>();
builder.Services.AddScoped<CrmArrighi.Services.RAG.IContextRetriever, CrmArrighi.Services.RAG.ContextRetriever>();
builder.Services.AddScoped<CrmArrighi.Services.RAG.IRagService, CrmArrighi.Services.RAG.RagService>();
Console.WriteLine("🧠 RAG Services registrados (IntentAnalyzer, ContextRetriever, RagService)");

// ============================================================================
// 🏥 Health Checks - Monitoramento de Saúde
// ============================================================================
builder.Services.AddHealthChecks()
    .AddCheck<PostgreSqlHealthCheck>("postgresql", tags: new[] { "critical", "database" })
    .AddCheck<SantanderApiHealthCheck>("santander_api", tags: new[] { "external", "payments" })
    .AddCheck<AzureStorageHealthCheck>("azure_storage", tags: new[] { "external", "storage" });

Console.WriteLine("🏥 Health Checks configurados: PostgreSQL, Santander API, Azure Storage");

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .WithExposedHeaders("X-Convert-To-PDF", "X-Document-Title", "Content-Disposition");
        });

    options.AddPolicy("AllowVercel",
        builder =>
        {
            builder.WithOrigins(
                    "https://arrighi-front-v1-copy.vercel.app",
                    "https://arrighi-front-v1-copy.vercel.app/",
                    "https://arrighicrm-front-v1.vercel.app",
                    "https://arrighicrm-front-v1.vercel.app/",
                    "https://arrighicrm.com",
                    "https://www.arrighicrm.com",
                    "https://contratos-bk-gag8afd6degtdca4.brazilsouth-01.azurewebsites.net"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()
                .WithExposedHeaders("X-Convert-To-PDF", "X-Document-Title", "Content-Disposition");
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Use Forwarded Headers for Reverse Proxy
app.UseForwardedHeaders();

// Use custom Reverse Proxy middleware
app.UseReverseProxy();

// OpenAPI/Swagger - Documentação interativa da API (.NET 10)
if (app.Environment.IsDevelopment())
{
    // TEMPORARIAMENTE COMENTADO - Conflito de versão do Microsoft.OpenApi
    // app.MapOpenApi(); // Endpoint: /openapi/v1.json
    // app.UseSwaggerUI(c =>
    // {
    //     c.SwaggerEndpoint("/openapi/v1.json", "CRM Arrighi API v1");
    //     c.RoutePrefix = "swagger"; // Acesse em: http://localhost:5000/swagger
    // });
}

app.UseHttpsRedirection();

// CORS: usar política restrita em produção, permissiva apenas em desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowAll");
}
else
{
    app.UseCors("AllowVercel");
}

// 🔒 Idempotency Middleware - Evita processamento duplicado de requisições
app.UseIdempotency();

app.UseAuthorization();

app.MapControllers();

// Criar tabelas se não existirem e popular dados iniciais
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CrmArrighiContext>();
    var seedDataService = scope.ServiceProvider.GetRequiredService<ISeedDataService>();

    Console.WriteLine("🐘 PostgreSQL ativo: criando tabelas base de grupos/permissões se necessário.");
    await EnsurePostgreSqlAccessTablesAsync(context);

    // Fazer seed dos dados
    await seedDataService.SeedAllAsync();

    // 🔥 Verificar e corrigir grupo Administrador após seed
    Console.WriteLine("🔄 Verificando configuração do grupo Administrador...");
    await AdminGroupHelper.EnsureAdminGroupIsCorrectAsync(context);
    await AdminGroupHelper.ListAdministratorsAsync(context);
    Console.WriteLine("✅ Verificação do grupo Administrador concluída!");
}

// Rate Limiting - DESABILITADO
// app.UseRateLimiter();

app.Run();

static string GetPostgreSqlConnectionString(IConfiguration configuration)
{
    var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(configuredConnectionString) &&
        !configuredConnectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase) &&
        !configuredConnectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
    {
        return configuredConnectionString;
    }

    var host = configuration["PGHOST"];
    var user = configuration["PGUSER"];
    var database = configuration["PGDATABASE"];
    var password = configuration["PGPASSWORD"];

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(user) ||
        string.IsNullOrWhiteSpace(database))
    {
        throw new InvalidOperationException(
            "Configure PGHOST, PGUSER e PGDATABASE para conectar ao PostgreSQL.");
    }

    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = host,
        Port = int.TryParse(configuration["PGPORT"], out var port) ? port : 5432,
        Database = database,
        Username = user,
        Password = password,
        SslMode = SslMode.Require,
        Pooling = true
    };

    return builder.ConnectionString;
}

static async Task EnsurePostgreSqlAccessTablesAsync(CrmArrighiContext context)
{
    await context.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "GruposAcesso" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Nome" character varying(100) NOT NULL,
            "Descricao" character varying(500) NULL,
            "Ativo" boolean NOT NULL DEFAULT true,
            "DataCadastro" timestamp without time zone NOT NULL DEFAULT now(),
            "DataAtualizacao" timestamp without time zone NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_GruposAcesso_Nome"
            ON "GruposAcesso" ("Nome");

        CREATE TABLE IF NOT EXISTS "Permissoes" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Nome" character varying(100) NOT NULL,
            "Descricao" character varying(200) NULL,
            "Modulo" character varying(50) NOT NULL,
            "Acao" character varying(50) NOT NULL,
            "Ativo" boolean NOT NULL DEFAULT true,
            "DataCadastro" timestamp without time zone NOT NULL DEFAULT now()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Permissoes_Modulo_Acao"
            ON "Permissoes" ("Modulo", "Acao");

        CREATE TABLE IF NOT EXISTS "PermissoesGrupos" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "GrupoAcessoId" integer NOT NULL,
            "PermissaoId" integer NOT NULL,
            "ApenasProprios" boolean NOT NULL DEFAULT false,
            "ApenasFilial" boolean NOT NULL DEFAULT false,
            "ApenasLeitura" boolean NOT NULL DEFAULT false,
            "IncluirSituacoesEspecificas" boolean NOT NULL DEFAULT false,
            "SituacoesEspecificas" character varying(500) NULL,
            "DataCadastro" timestamp without time zone NOT NULL DEFAULT now(),
            CONSTRAINT "FK_PermissoesGrupos_GruposAcesso_GrupoAcessoId"
                FOREIGN KEY ("GrupoAcessoId") REFERENCES "GruposAcesso" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_PermissoesGrupos_Permissoes_PermissaoId"
                FOREIGN KEY ("PermissaoId") REFERENCES "Permissoes" ("Id") ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PermissoesGrupos_GrupoAcessoId_PermissaoId"
            ON "PermissoesGrupos" ("GrupoAcessoId", "PermissaoId");

        ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "GrupoAcessoId" integer NULL;
        ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "FilialId" integer NULL;
        ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "ConsultorId" integer NULL;
    """);
}
