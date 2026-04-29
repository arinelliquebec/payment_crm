using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using CrmArrighi.Services;

namespace CrmArrighi.Attributes
{
    [AttributeUsage(AttributeTargets.Method)]
    public class AuthorizePermissionAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string _module;
        private readonly string _action; // "create", "edit", "delete"

        public AuthorizePermissionAttribute(string module, string action)
        {
            _module = module;
            _action = action;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var authorizationService = context.HttpContext.RequestServices.GetService<IAuthorizationService>();
            if (authorizationService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Obter ID do usuário do header
            var usuarioIdHeader = context.HttpContext.Request.Headers["X-Usuario-Id"].FirstOrDefault();
            if (!int.TryParse(usuarioIdHeader, out int usuarioId))
            {
                context.Result = new UnauthorizedObjectResult("Usuário não identificado na requisição.");
                return;
            }

            // Obter ID do recurso (se aplicável)
            int? resourceId = null;
            if (context.ActionArguments.ContainsKey("id") && context.ActionArguments["id"] is int id)
            {
                resourceId = id;
            }

            // Verificar permissão baseada no módulo e ação
            bool hasPermission = false;
            switch (_module.ToLower())
            {
                case "cliente":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditClienteAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditClienteAsync(usuarioId, resourceId.Value),
                        "delete" => resourceId.HasValue && await authorizationService.CanDeleteClienteAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;

                case "consultor":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditConsultorAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditConsultorAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;

                case "parceiro":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditParceiroAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditParceiroAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;

                case "contrato":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditContratoAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditContratoAsync(usuarioId, resourceId.Value),
                        "delete" => resourceId.HasValue && await authorizationService.CanDeleteContratoAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;

                case "pessoa-fisica":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditPessoaFisicaAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditPessoaFisicaAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;

                case "pessoa-juridica":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditPessoaJuridicaAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditPessoaJuridicaAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;

                case "usuario":
                    hasPermission = _action.ToLower() switch
                    {
                        "create" => await authorizationService.CanEditUsuarioAsync(usuarioId, 0),
                        "edit" => resourceId.HasValue && await authorizationService.CanEditUsuarioAsync(usuarioId, resourceId.Value),
                        "delete" => resourceId.HasValue && await authorizationService.CanDeleteUsuarioAsync(usuarioId, resourceId.Value),
                        _ => false
                    };
                    break;
            }

            if (!hasPermission)
            {
                Console.WriteLine($"❌ AuthorizePermission: Usuário {usuarioId} não tem permissão para {_action} {_module}");
                context.Result = new ForbidResult($"Você não tem permissão para {_action} {_module}.");
                return;
            }

            // Prosseguir com a execução se tiver permissão
            await next();
        }
    }
}
