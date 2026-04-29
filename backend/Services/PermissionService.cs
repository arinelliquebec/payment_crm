using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using System.Text.Json;

namespace CrmArrighi.Services
{
    public interface IPermissionService
    {
        Task<bool> HasPermissionAsync(int usuarioId, string modulo, string acao);
        Task<bool> CanAccessRecordAsync(int usuarioId, string modulo, int recordId);
        Task<List<string>> GetUserPermissionsAsync(int usuarioId);
        Task<bool> IsUserInGroupAsync(int usuarioId, string grupoNome);
        Task<string> GetUserGroupNameAsync(int usuarioId);
    }

    public class PermissionService : IPermissionService
    {
        private readonly CrmArrighiContext _context;

        public PermissionService(CrmArrighiContext context)
        {
            _context = context;
        }

        public async Task<bool> HasPermissionAsync(int usuarioId, string modulo, string acao)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario?.GrupoAcesso == null)
                return false;

            // Usuário sem grupo não tem permissões
            if (usuario.GrupoAcesso.Nome == "Usuario")
                return false;

            var permissao = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .Include(pg => pg.GrupoAcesso)
                .FirstOrDefaultAsync(pg => 
                    pg.GrupoAcessoId == usuario.GrupoAcessoId &&
                    pg.Permissao.Modulo == modulo &&
                    pg.Permissao.Acao == acao);

            return permissao != null;
        }

        public async Task<bool> CanAccessRecordAsync(int usuarioId, string modulo, int recordId)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .Include(u => u.Filial)
                .Include(u => u.Consultor)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario?.GrupoAcesso == null)
                return false;

            // Usuário sem grupo não tem acesso
            if (usuario.GrupoAcesso.Nome == "Usuario")
                return false;

            var permissao = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .FirstOrDefaultAsync(pg => 
                    pg.GrupoAcessoId == usuario.GrupoAcessoId &&
                    pg.Permissao.Modulo == modulo &&
                    pg.Permissao.Acao == "Visualizar");

            if (permissao == null)
                return false;

            // Verificar regras específicas por módulo
            switch (modulo.ToLower())
            {
                case "cliente":
                    return await CanAccessClienteAsync(usuario, recordId, permissao);
                case "contrato":
                    return await CanAccessContratoAsync(usuario, recordId, permissao);
                case "consultor":
                    return await CanAccessConsultorAsync(usuario, recordId, permissao);
                case "parceiro":
                    return await CanAccessParceiroAsync(usuario, recordId, permissao);
                case "boleto":
                    return await CanAccessBoletoAsync(usuario, recordId, permissao);
                default:
                    // Para outros módulos, verificar apenas se tem permissão
                    return true;
            }
        }

        private async Task<bool> CanAccessClienteAsync(Usuario usuario, int clienteId, PermissaoGrupo permissao)
        {
            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Id == clienteId);

            if (cliente == null)
                return false;

            // Se não tem restrição de filial, pode acessar
            if (!permissao.ApenasFilial)
                return true;

            // Verificar se é da mesma filial
            if (usuario.FilialId != cliente.FilialId)
                return false;

            // Se é consultor, verificar regras específicas
            if (usuario.GrupoAcesso?.Nome == "Consultores")
            {
                // Verificar se o cliente tem contratos
                var contratos = await _context.Contratos
                    .Where(c => c.ClienteId == clienteId)
                    .ToListAsync();

                // Pode ver clientes sem contrato
                if (!contratos.Any())
                    return true;

                // Pode ver clientes com situações específicas
                if (permissao.IncluirSituacoesEspecificas && !string.IsNullOrEmpty(permissao.SituacoesEspecificas))
                {
                    var situacoesPermitidas = JsonSerializer.Deserialize<string[]>(permissao.SituacoesEspecificas);
                    var temSituacaoPermitida = contratos.Any(c => 
                        situacoesPermitidas.Contains(c.Situacao));
                    
                    if (temSituacaoPermitida)
                        return true;
                }

                return false;
            }

            return true;
        }

        private async Task<bool> CanAccessContratoAsync(Usuario usuario, int contratoId, PermissaoGrupo permissao)
        {
            var contrato = await _context.Contratos
                .Include(c => c.Cliente)
                .FirstOrDefaultAsync(c => c.Id == contratoId);

            if (contrato == null)
                return false;

            // Se não tem restrição de filial, pode acessar
            if (!permissao.ApenasFilial)
                return true;

            // Verificar se o cliente do contrato é da mesma filial
            return usuario.FilialId == contrato.Cliente.FilialId;
        }

        private async Task<bool> CanAccessConsultorAsync(Usuario usuario, int consultorId, PermissaoGrupo permissao)
        {
            var consultor = await _context.Consultores
                .FirstOrDefaultAsync(c => c.Id == consultorId);

            if (consultor == null)
                return false;

            // Se não tem restrição de filial, pode acessar
            if (!permissao.ApenasFilial)
                return true;

            // Verificar se é da mesma filial
            return usuario.FilialId == consultor.FilialId;
        }

        private async Task<bool> CanAccessParceiroAsync(Usuario usuario, int parceiroId, PermissaoGrupo permissao)
        {
            var parceiro = await _context.Parceiros
                .FirstOrDefaultAsync(p => p.Id == parceiroId);

            if (parceiro == null)
                return false;

            // Se não tem restrição de filial, pode acessar
            if (!permissao.ApenasFilial)
                return true;

            // Verificar se é da mesma filial
            return usuario.FilialId == parceiro.FilialId;
        }

        private async Task<bool> CanAccessBoletoAsync(Usuario usuario, int boletoId, PermissaoGrupo permissao)
        {
            var boleto = await _context.Boletos
                .Include(b => b.Contrato)
                    .ThenInclude(c => c.Cliente)
                .FirstOrDefaultAsync(b => b.Id == boletoId);

            if (boleto == null)
                return false;

            // Se não tem restrição de filial, pode acessar
            if (!permissao.ApenasFilial)
                return true;

            // Verificar se o cliente do contrato do boleto é da mesma filial
            return usuario.FilialId == boleto.Contrato.Cliente.FilialId;
        }

        public async Task<List<string>> GetUserPermissionsAsync(int usuarioId)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario?.GrupoAcesso == null)
                return new List<string>();

            var permissoes = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .Where(pg => pg.GrupoAcessoId == usuario.GrupoAcessoId)
                .Select(pg => $"{pg.Permissao.Modulo}_{pg.Permissao.Acao}")
                .ToListAsync();

            return permissoes;
        }

        public async Task<bool> IsUserInGroupAsync(int usuarioId, string grupoNome)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            return usuario?.GrupoAcesso?.Nome == grupoNome;
        }

        public async Task<string> GetUserGroupNameAsync(int usuarioId)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            return usuario?.GrupoAcesso?.Nome ?? "Usuario";
        }
    }
}
