using Microsoft.AspNetCore.HttpOverrides;
using System.Net;

namespace CrmArrighi.Middleware
{
    public class ReverseProxyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public ReverseProxyMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Log proxy information for debugging
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var forwardedProto = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
            var forwardedHost = context.Request.Headers["X-Forwarded-Host"].FirstOrDefault();

            if (!string.IsNullOrEmpty(forwardedFor))
            {
                context.Connection.RemoteIpAddress = IPAddress.Parse(forwardedFor.Split(',')[0].Trim());
            }

            if (!string.IsNullOrEmpty(forwardedProto))
            {
                context.Request.Scheme = forwardedProto;
            }

            if (!string.IsNullOrEmpty(forwardedHost))
            {
                context.Request.Host = new HostString(forwardedHost);
            }

            await _next(context);
        }
    }

    public static class ReverseProxyMiddlewareExtensions
    {
        public static IApplicationBuilder UseReverseProxy(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ReverseProxyMiddleware>();
        }
    }
} 