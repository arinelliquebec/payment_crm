using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using CrmArrighi.Services;

namespace CrmArrighi.Attributes
{
    public class AuthorizePermissionSimpleAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string _modulo;
        private readonly string _acao;

        public AuthorizePermissionSimpleAttribute(string modulo, string acao)
        {
            _modulo = modulo;
            _acao = acao;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var permissionService = context.HttpContext.RequestServices.GetService<IPermissionService>();
            if (permissionService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            var hasPermission = await permissionService.HasPermissionAsync(userId, _modulo, _acao);
            if (!hasPermission)
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }

    public class AuthorizeGroupAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string[] _gruposPermitidos;

        public AuthorizeGroupAttribute(params string[] gruposPermitidos)
        {
            _gruposPermitidos = gruposPermitidos;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var permissionService = context.HttpContext.RequestServices.GetService<IPermissionService>();
            if (permissionService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            var userGroup = await permissionService.GetUserGroupNameAsync(userId);
            if (!_gruposPermitidos.Contains(userGroup))
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}
