using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;

namespace CrmArrighi.Controllers;

/// <summary>
/// Controller para endpoints de saúde da aplicação
/// </summary>
[ApiController]
[Route("")]
public class HealthController : ControllerBase
{
    private readonly HealthCheckService _healthCheckService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        HealthCheckService healthCheckService,
        ILogger<HealthController> logger)
    {
        _healthCheckService = healthCheckService;
        _logger = logger;
    }

    /// <summary>
    /// Health check básico (para load balancers)
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetHealth()
    {
        var report = await _healthCheckService.CheckHealthAsync();

        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            duration = report.TotalDuration.TotalMilliseconds
        };

        return report.Status == HealthStatus.Healthy
            ? Ok(response)
            : StatusCode(503, response);
    }

    /// <summary>
    /// Health check detalhado com informações de cada serviço
    /// </summary>
    [HttpGet("health/details")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHealthDetails()
    {
        var report = await _healthCheckService.CheckHealthAsync();

        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            duration = $"{report.TotalDuration.TotalMilliseconds:F0}ms",
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = $"{e.Value.Duration.TotalMilliseconds:F0}ms",
                data = e.Value.Data,
                exception = e.Value.Exception?.Message
            }).ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Dashboard HTML de saúde
    /// </summary>
    [HttpGet("health/dashboard")]
    [Produces("text/html")]
    public async Task<IActionResult> GetHealthDashboard()
    {
        var report = await _healthCheckService.CheckHealthAsync();
        var html = GenerateHealthDashboardHtml(report);
        return Content(html, "text/html");
    }

    /// <summary>
    /// Health check específico para liveness (Kubernetes)
    /// </summary>
    [HttpGet("health/live")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetLiveness()
    {
        return Ok(new { status = "alive", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Health check específico para readiness (Kubernetes)
    /// </summary>
    [HttpGet("health/ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetReadiness()
    {
        // Verificar apenas serviços críticos
        var report = await _healthCheckService.CheckHealthAsync(
            predicate: check => check.Tags.Contains("critical"));

        var allHealthy = report.Status == HealthStatus.Healthy;

        return allHealthy
            ? Ok(new { status = "ready", timestamp = DateTime.UtcNow })
            : StatusCode(503, new { status = "not_ready", timestamp = DateTime.UtcNow });
    }

    private string GenerateHealthDashboardHtml(HealthReport report)
    {
        var statusColor = report.Status switch
        {
            HealthStatus.Healthy => "#22c55e",
            HealthStatus.Degraded => "#f59e0b",
            HealthStatus.Unhealthy => "#ef4444",
            _ => "#6b7280"
        };

        var statusIcon = report.Status switch
        {
            HealthStatus.Healthy => "✅",
            HealthStatus.Degraded => "⚠️",
            HealthStatus.Unhealthy => "❌",
            _ => "❓"
        };

        var checksHtml = string.Join("\n", report.Entries.Select(e =>
        {
            var checkColor = e.Value.Status switch
            {
                HealthStatus.Healthy => "#22c55e",
                HealthStatus.Degraded => "#f59e0b",
                HealthStatus.Unhealthy => "#ef4444",
                _ => "#6b7280"
            };

            var checkIcon = e.Value.Status switch
            {
                HealthStatus.Healthy => "✅",
                HealthStatus.Degraded => "⚠️",
                HealthStatus.Unhealthy => "❌",
                _ => "❓"
            };

            var dataHtml = e.Value.Data.Any()
                ? $@"<div class='data'>
                    {string.Join("", e.Value.Data.Select(d =>
                        $"<div class='data-item'><span class='data-key'>{d.Key}:</span> <span class='data-value'>{d.Value}</span></div>"))}
                    </div>"
                : "";

            var exceptionHtml = e.Value.Exception != null
                ? $"<div class='exception'>⚠️ {System.Web.HttpUtility.HtmlEncode(e.Value.Exception.Message)}</div>"
                : "";

            return $@"
                <div class='check' style='border-left-color: {checkColor}'>
                    <div class='check-header'>
                        <span class='check-icon'>{checkIcon}</span>
                        <span class='check-name'>{e.Key}</span>
                        <span class='check-status' style='background-color: {checkColor}'>{e.Value.Status}</span>
                        <span class='check-duration'>{e.Value.Duration.TotalMilliseconds:F0}ms</span>
                    </div>
                    <div class='check-description'>{e.Value.Description}</div>
                    {dataHtml}
                    {exceptionHtml}
                </div>";
        }));

        return $@"
<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <meta http-equiv='refresh' content='30'>
    <title>🏥 Health Dashboard - CRM Arrighi</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
            padding: 2rem;
            color: #e2e8f0;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
        }}
        .header {{
            text-align: center;
            margin-bottom: 2rem;
        }}
        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(90deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .header .subtitle {{
            color: #94a3b8;
            font-size: 1rem;
        }}
        .overall-status {{
            background: #1e293b;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
            border: 1px solid #334155;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }}
        .status-icon {{
            font-size: 4rem;
            margin-bottom: 1rem;
        }}
        .status-text {{
            font-size: 1.5rem;
            font-weight: 600;
            color: {statusColor};
        }}
        .duration {{
            color: #94a3b8;
            margin-top: 0.5rem;
        }}
        .checks {{
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }}
        .check {{
            background: #1e293b;
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 4px solid;
            border: 1px solid #334155;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .check:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }}
        .check-header {{
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }}
        .check-icon {{
            font-size: 1.25rem;
        }}
        .check-name {{
            font-weight: 600;
            font-size: 1.1rem;
            flex-grow: 1;
        }}
        .check-status {{
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            color: white;
        }}
        .check-duration {{
            color: #94a3b8;
            font-size: 0.875rem;
        }}
        .check-description {{
            color: #cbd5e1;
            margin-bottom: 0.75rem;
        }}
        .data {{
            background: #0f172a;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 0.75rem;
        }}
        .data-item {{
            display: flex;
            gap: 0.5rem;
            padding: 0.25rem 0;
            font-size: 0.875rem;
            font-family: 'Monaco', 'Menlo', monospace;
        }}
        .data-key {{
            color: #60a5fa;
        }}
        .data-value {{
            color: #22c55e;
        }}
        .exception {{
            background: #7f1d1d;
            color: #fca5a5;
            padding: 0.75rem;
            border-radius: 8px;
            margin-top: 0.75rem;
            font-size: 0.875rem;
        }}
        .footer {{
            text-align: center;
            margin-top: 2rem;
            color: #64748b;
            font-size: 0.875rem;
        }}
        .footer a {{
            color: #60a5fa;
            text-decoration: none;
        }}
        .refresh-note {{
            color: #64748b;
            font-size: 0.75rem;
            margin-top: 0.5rem;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🏥 Health Dashboard</h1>
            <p class='subtitle'>CRM Arrighi - Monitoramento de Saúde</p>
        </div>

        <div class='overall-status'>
            <div class='status-icon'>{statusIcon}</div>
            <div class='status-text'>{report.Status}</div>
            <div class='duration'>Tempo total: {report.TotalDuration.TotalMilliseconds:F0}ms</div>
            <div class='refresh-note'>Atualiza automaticamente a cada 30 segundos</div>
        </div>

        <div class='checks'>
            {checksHtml}
        </div>

        <div class='footer'>
            <p>Última verificação: {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
            <p><a href='/health/details'>Ver JSON detalhado</a> | <a href='/health'>Status simples</a></p>
        </div>
    </div>
</body>
</html>";
    }
}

