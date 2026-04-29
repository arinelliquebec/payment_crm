using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using System.Text;

namespace CrmArrighi.Middleware
{
    /// <summary>
    /// Middleware para garantir idempotência em requisições POST/PUT/PATCH
    /// Evita processamento duplicado usando Idempotency-Key header
    /// </summary>
    public class IdempotencyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<IdempotencyMiddleware> _logger;

        public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, CrmArrighiContext dbContext)
        {
            // Apenas para métodos que modificam dados
            if (context.Request.Method != "POST" &&
                context.Request.Method != "PUT" &&
                context.Request.Method != "PATCH")
            {
                await _next(context);
                return;
            }

            // Verificar se tem header Idempotency-Key
            if (!context.Request.Headers.TryGetValue("Idempotency-Key", out var idempotencyKeyHeader) ||
                string.IsNullOrWhiteSpace(idempotencyKeyHeader))
            {
                // Sem idempotency key, continuar normalmente
                await _next(context);
                return;
            }

            var key = idempotencyKeyHeader.ToString();
            var requestPath = context.Request.Path.ToString();

            _logger.LogInformation("🔑 Idempotency-Key recebida: {Key} para {Method} {Path}",
                key, context.Request.Method, requestPath);

            // Verificar se já existe uma requisição com esta chave
            var existingRequest = await dbContext.IdempotencyKeys
                .Where(ik => ik.Key == key && ik.ExpiresAt > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            if (existingRequest != null)
            {
                _logger.LogWarning("♻️ REQUISIÇÃO DUPLICADA DETECTADA! Retornando resposta cacheada para key: {Key}", key);
                _logger.LogInformation("📋 Requisição original: {Method} {Path} em {CreatedAt}",
                    context.Request.Method, existingRequest.RequestPath, existingRequest.CreatedAt);

                // Retornar resposta cacheada
                context.Response.StatusCode = existingRequest.ResponseStatus;
                context.Response.ContentType = "application/json";
                context.Response.Headers.Add("X-Idempotency-Replay", "true");
                context.Response.Headers.Add("X-Original-Request-Time", existingRequest.CreatedAt.ToString("o"));

                if (!string.IsNullOrEmpty(existingRequest.ResponseBody))
                {
                    await context.Response.WriteAsync(existingRequest.ResponseBody);
                }

                return;
            }

            // Ler o body da requisição
            context.Request.EnableBuffering();
            string requestBody = string.Empty;

            try
            {
                using (var reader = new StreamReader(
                    context.Request.Body,
                    encoding: Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false,
                    bufferSize: 1024,
                    leaveOpen: true))
                {
                    requestBody = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Erro ao ler body da requisição para idempotency");
            }

            // Capturar a resposta
            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            try
            {
                // Executar a requisição
                await _next(context);

                // Ler a resposta
                responseBody.Seek(0, SeekOrigin.Begin);
                var responseText = await new StreamReader(responseBody).ReadToEndAsync();
                responseBody.Seek(0, SeekOrigin.Begin);

                // Salvar no banco (apenas se sucesso 2xx ou 4xx - não salvar 5xx)
                if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 500)
                {
                    try
                    {
                        var idempotencyRecord = new IdempotencyKey
                        {
                            Key = key,
                            RequestPath = requestPath,
                            RequestBody = requestBody.Length > 10000 ? requestBody.Substring(0, 10000) : requestBody, // Limitar tamanho
                            ResponseStatus = context.Response.StatusCode,
                            ResponseBody = responseText.Length > 50000 ? responseText.Substring(0, 50000) : responseText, // Limitar tamanho
                            CreatedAt = DateTime.UtcNow,
                            ExpiresAt = DateTime.UtcNow.AddHours(24) // Expira em 24 horas
                        };

                        dbContext.IdempotencyKeys.Add(idempotencyRecord);
                        await dbContext.SaveChangesAsync();

                        _logger.LogInformation("✅ Idempotency-Key salva: {Key} (Status: {Status}, Expira: {ExpiresAt})",
                            key, context.Response.StatusCode, idempotencyRecord.ExpiresAt);
                    }
                    catch (Exception ex)
                    {
                        // Não falhar a requisição se não conseguir salvar a idempotency key
                        _logger.LogError(ex, "❌ Erro ao salvar Idempotency-Key: {Key}", key);
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ Não salvando Idempotency-Key para status {Status} (erro de servidor)",
                        context.Response.StatusCode);
                }

                // Copiar resposta para o stream original
                await responseBody.CopyToAsync(originalBodyStream);
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }
    }

    /// <summary>
    /// Extension method para registrar o middleware
    /// </summary>
    public static class IdempotencyMiddlewareExtensions
    {
        public static IApplicationBuilder UseIdempotency(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<IdempotencyMiddleware>();
        }
    }
}
