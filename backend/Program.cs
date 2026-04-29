using Azure.Core;
using Azure.Identity;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using CrmArrighi.Middleware;
using Npgsql;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

const string PostgreSqlAadScope = "https://ossrdbms-aad.database.windows.net/.default";

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configure Forwarded Headers for Reverse Proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    // Allow all IPs for development - in production, specify your proxy IPs
    options.RequireHeaderSymmetry = false;
    options.ForwardLimit = null;
});

// Add Entity Framework
var databaseConnectionString = GetDatabaseConnectionString(builder.Configuration);
var databaseDataSource = CreateNpgsqlDataSource(databaseConnectionString);
builder.Services.AddSingleton(databaseDataSource);
builder.Services.AddDbContext<CrmArrighiContext>((serviceProvider, options) =>
    options.UseNpgsql(serviceProvider.GetRequiredService<NpgsqlDataSource>()));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });

    options.AddPolicy("AllowVercel",
        builder =>
        {
            builder.WithOrigins(
                    "https://payment-crm-frontend.vercel.app/",
                    "http://localhost:3000",
                    "http://localhost:3001"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

var app = builder.Build();

// Database will be created when needed

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Use Forwarded Headers for Reverse Proxy
app.UseForwardedHeaders();

// Use custom Reverse Proxy middleware
app.UseReverseProxy();

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

// Criar tabela Parceiros se não existir
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CrmArrighiContext>();
    await CreateTableHelper.CreateParceirosTableIfNotExists(context);
}

app.Run();

static string GetDatabaseConnectionString(IConfiguration configuration)
{
    var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(configuredConnectionString))
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
            "Configure ConnectionStrings__DefaultConnection or PGHOST, PGUSER and PGDATABASE.");
    }

    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = host,
        Port = int.TryParse(configuration["PGPORT"], out var port) ? port : 5432,
        Database = database,
        Username = user,
        SslMode = SslMode.Require,
        Pooling = true
    };

    if (!string.IsNullOrWhiteSpace(password))
    {
        builder.Password = password;
    }

    return builder.ConnectionString;
}

static NpgsqlDataSource CreateNpgsqlDataSource(string connectionString)
{
    var connectionStringBuilder = new NpgsqlConnectionStringBuilder(connectionString);
    var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionStringBuilder.ConnectionString);

    if (string.IsNullOrWhiteSpace(connectionStringBuilder.Password))
    {
        var credential = new DefaultAzureCredential();
        var tokenRequestContext = new TokenRequestContext([PostgreSqlAadScope]);

        dataSourceBuilder.UsePeriodicPasswordProvider(
            async (_, cancellationToken) =>
            {
                var token = await credential.GetTokenAsync(tokenRequestContext, cancellationToken);
                return token.Token;
            },
            TimeSpan.FromMinutes(55),
            TimeSpan.FromSeconds(5));
    }

    return dataSourceBuilder.Build();
}
