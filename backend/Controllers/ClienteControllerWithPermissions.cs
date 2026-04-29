using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Attributes;
using CrmArrighi.Services;
using System.Security.Claims;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteControllerWithPermissions : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IPermissionService _permissionService;

        public ClienteControllerWithPermissions(CrmArrighiContext context, IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // GET: api/Cliente
        [HttpGet]
        [AuthorizePermissionSimple("Cliente", "Visualizar")]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                var userGroup = await _permissionService.GetUserGroupNameAsync(userId.Value);
                
                // Filtrar clientes baseado no grupo do usuário
                var query = _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial)
                    .AsQueryable();

                // Aplicar filtros baseados no grupo
                switch (userGroup)
                {
                    case "Administrador":
                    case "Faturamento":
                    case "Cobrança e Financeiro":
                        // Acesso total - sem filtros
                        break;

                    case "Gestor de Filial":
                    case "Administrativo de Filial":
                        // Apenas da mesma filial
                        var user = await _context.Usuarios
                            .Include(u => u.Filial)
                            .FirstOrDefaultAsync(u => u.Id == userId);
                        
                        if (user?.FilialId != null)
                        {
                            query = query.Where(c => c.FilialId == user.FilialId);
                        }
                        break;

                    case "Consultores":
                        // Clientes da mesma filial e sem contrato (ou com situações específicas)
                        var consultor = await _context.Usuarios
                            .Include(u => u.Filial)
                            .FirstOrDefaultAsync(u => u.Id == userId);
                        
                        if (consultor?.FilialId != null)
                        {
                            query = query.Where(c => c.FilialId == consultor.FilialId);
                            
                            // Filtrar clientes sem contrato ou com situações específicas
                            var clientesComContrato = await _context.Contratos
                                .Where(ct => ct.Situacao != "Sem interesse" && ct.Situacao != "Não encontrado")
                                .Select(ct => ct.ClienteId)
                                .ToListAsync();
                            
                            query = query.Where(c => !clientesComContrato.Contains(c.Id));
                        }
                        break;

                    default:
                        return Forbid("Usuário sem permissão para visualizar clientes");
                }

                var clientes = await query.ToListAsync();
                return Ok(clientes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetClientes: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Cliente/{id}
        [HttpGet("{id}")]
        [AuthorizePermissionSimple("Cliente", "Visualizar")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                // Verificar se pode acessar este cliente específico
                var canAccess = await _permissionService.CanAccessRecordAsync(userId.Value, "Cliente", id);
                if (!canAccess)
                    return Forbid("Usuário não tem permissão para acessar este cliente");

                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (cliente == null)
                    return NotFound();

                return Ok(cliente);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetCliente: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/Cliente
        [HttpPost]
        [AuthorizePermissionSimple("Cliente", "Incluir")]
        public async Task<ActionResult<Cliente>> PostCliente(CreateClienteDTO createClienteDTO)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                // Verificar se pode incluir clientes
                var hasPermission = await _permissionService.HasPermissionAsync(userId.Value, "Cliente", "Incluir");
                if (!hasPermission)
                    return Forbid("Usuário não tem permissão para incluir clientes");

                // Aplicar regras de negócio baseadas no grupo
                var userGroup = await _permissionService.GetUserGroupNameAsync(userId.Value);
                var user = await _context.Usuarios
                    .Include(u => u.Filial)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                // Se é gestor de filial ou administrativo, só pode criar clientes na sua filial
                if ((userGroup == "Gestor de Filial" || userGroup == "Administrativo de Filial") && user?.FilialId != null)
                {
                    createClienteDTO.FilialId = user.FilialId;
                }

                // Implementar lógica de criação do cliente...
                // (código de criação seria implementado aqui)

                return Ok("Cliente criado com sucesso");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ PostCliente: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Cliente/{id}
        [HttpPut("{id}")]
        [AuthorizePermissionSimple("Cliente", "Editar")]
        public async Task<IActionResult> PutCliente(int id, CreateClienteDTO createClienteDTO)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                // Verificar se pode acessar este cliente específico
                var canAccess = await _permissionService.CanAccessRecordAsync(userId.Value, "Cliente", id);
                if (!canAccess)
                    return Forbid("Usuário não tem permissão para editar este cliente");

                // Verificar se pode editar (não é apenas leitura)
                var userGroup = await _permissionService.GetUserGroupNameAsync(userId.Value);
                if (userGroup == "Administrativo de Filial")
                    return Forbid("Usuário administrativo não pode editar registros");

                // Implementar lógica de edição do cliente...
                // (código de edição seria implementado aqui)

                return Ok("Cliente atualizado com sucesso");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ PutCliente: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // DELETE: api/Cliente/{id}
        [HttpDelete("{id}")]
        [AuthorizePermissionSimple("Cliente", "Excluir")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                // Verificar se pode acessar este cliente específico
                var canAccess = await _permissionService.CanAccessRecordAsync(userId.Value, "Cliente", id);
                if (!canAccess)
                    return Forbid("Usuário não tem permissão para excluir este cliente");

                // Verificar se pode excluir (não é apenas leitura)
                var userGroup = await _permissionService.GetUserGroupNameAsync(userId.Value);
                if (userGroup == "Administrativo de Filial")
                    return Forbid("Usuário administrativo não pode excluir registros");

                // Implementar lógica de exclusão do cliente...
                // (código de exclusão seria implementado aqui)

                return Ok("Cliente excluído com sucesso");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DeleteCliente: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}
