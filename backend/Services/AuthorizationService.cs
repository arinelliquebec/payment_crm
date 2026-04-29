using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using System.Text.Json;

namespace CrmArrighi.Services
{
    public class AuthorizationService : IAuthorizationService
    {
        private readonly CrmArrighiContext _context;

        public AuthorizationService(CrmArrighiContext context)
        {
            _context = context;
        }

        public async Task<bool> HasPermissionAsync(int usuarioId, string modulo, string acao)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var permissao = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .FirstOrDefaultAsync(pg => pg.GrupoAcessoId == usuario.GrupoAcessoId &&
                                         pg.Permissao.Modulo == modulo &&
                                         pg.Permissao.Acao == acao);

            return permissao != null;
        }

        public async Task<bool> CanAccessAsync(int usuarioId, string modulo, string acao, int? filialId = null, int? consultorId = null)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var permissao = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .FirstOrDefaultAsync(pg => pg.GrupoAcessoId == usuario.GrupoAcessoId &&
                                         pg.Permissao.Modulo == modulo &&
                                         pg.Permissao.Acao == acao);

            if (permissao == null) return false;

            // Verificar regras específicas por grupo
            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                    return true; // Acesso total

                case "Faturamento":
                    return modulo != "Usuario" || acao == "Visualizar"; // Não pode editar usuários

                case "Cobrança/Financeiro":
                    return acao == "Visualizar"; // Apenas visualização

                case "Gestor de Filial":
                    if (usuario.FilialId == null) return false;
                    return filialId == null || filialId == usuario.FilialId;

                case "Administrativo de Filial":
                    if (usuario.FilialId == null) return false;
                    return (acao == "Visualizar") && (filialId == null || filialId == usuario.FilialId);

                case "Consultores":
                    if (usuario.ConsultorId == null) return false;
                    return consultorId == null || consultorId == usuario.ConsultorId;

                case "Usuário":
                    return false; // Sem acesso até ser alocado

                default:
                    return false;
            }
        }

        public async Task<bool> CanViewClienteAsync(int usuarioId, int clienteId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var cliente = await _context.Clientes
                .Include(c => c.Filial)
                .FirstOrDefaultAsync(c => c.Id == clienteId);

            if (cliente == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Cobrança/Financeiro":
                    return true; // Pode visualizar tudo

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    return usuario.FilialId == cliente.FilialId;

                case "Consultores":
                    // Pode ver clientes que cadastrou, importados, ou com situações específicas
                    var contratos = await _context.Contratos
                        .Where(ct => ct.ClienteId == clienteId)
                        .ToListAsync();

                    // Se tem contrato com o consultor atual
                    if (contratos.Any(ct => ct.ConsultorId == usuario.ConsultorId))
                        return true;

                    // Se tem contrato com situações específicas
                    var situacoesEspecificas = new[] { "Sem interesse", "Não encontrado" };
                    if (contratos.Any(ct => situacoesEspecificas.Contains(ct.Situacao)))
                        return true;

                    return false;

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditClienteAsync(int usuarioId, int clienteId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Gestor de Filial":
                    var cliente = await _context.Clientes
                        .FirstOrDefaultAsync(c => c.Id == clienteId);
                    return cliente?.FilialId == usuario.FilialId;

                case "Consultores":
                    // Só pode editar clientes que cadastrou
                    var contratos = await _context.Contratos
                        .Where(ct => ct.ClienteId == clienteId && ct.ConsultorId == usuario.ConsultorId)
                        .AnyAsync();
                    return contratos;

                default:
                    return false;
            }
        }

        public async Task<bool> CanDeleteClienteAsync(int usuarioId, int clienteId)
        {
            // Apenas Administrador e Faturamento podem excluir
            var usuario = await GetUsuarioAsync(usuarioId);
            var grupoNome = usuario?.GrupoAcesso?.Nome;
            return grupoNome == "Administrador" || grupoNome == "Faturamento";
        }

        public async Task<IQueryable<Cliente>> FilterClientesByUserAsync(int usuarioId, IQueryable<Cliente> clientes)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null)
            {
                Console.WriteLine($"🔧 FilterClientesByUserAsync: Usuário {usuarioId} não encontrado ou sem grupo de acesso");
                return clientes.Where(c => false);
            }

            var grupoNome = usuario.GrupoAcesso?.Nome;
            Console.WriteLine($"🔧 FilterClientesByUserAsync: Usuário {usuarioId}, Grupo: {grupoNome}, FilialId: {usuario.FilialId}");

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    Console.WriteLine($"🔧 FilterClientesByUserAsync: {grupoNome} - retornando todos os clientes");
                    return clientes; // Todos os clientes

                case "Cobrança/Financeiro":
                    Console.WriteLine($"🔧 FilterClientesByUserAsync: {grupoNome} - retornando todos os clientes (somente leitura)");
                    return clientes; // Todos os clientes (apenas visualização)

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    Console.WriteLine($"🔧 FilterClientesByUserAsync: {grupoNome} - filtrando por FilialId: {usuario.FilialId}");
                    return clientes.Where(c => c.FilialId == usuario.FilialId);

                case "Consultores":
                    Console.WriteLine($"🔧 FilterClientesByUserAsync: {grupoNome} - filtrando por ConsultorId: {usuario.ConsultorId}");
                    // Clientes que cadastrou, importados, ou com situações específicas
                    var clienteIds = await _context.Contratos
                        .Where(ct => ct.ConsultorId == usuario.ConsultorId ||
                                   new[] { "Sem interesse", "Não encontrado" }.Contains(ct.Situacao))
                        .Select(ct => ct.ClienteId)
                        .Distinct()
                        .ToListAsync();

                    return clientes.Where(c => clienteIds.Contains(c.Id));

                default:
                    Console.WriteLine($"🔧 FilterClientesByUserAsync: Grupo {grupoNome} não reconhecido - sem acesso");
                    return clientes.Where(c => false);
            }
        }

        public async Task<bool> CanViewContratoAsync(int usuarioId, int contratoId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var contrato = await _context.Contratos
                .Include(c => c.Cliente)
                .FirstOrDefaultAsync(c => c.Id == contratoId);

            if (contrato == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Cobrança/Financeiro":
                    return true; // Pode visualizar tudo

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    return contrato.Cliente.FilialId == usuario.FilialId;

                case "Consultores":
                    return contrato.ConsultorId == usuario.ConsultorId ||
                           new[] { "Sem interesse", "Não encontrado" }.Contains(contrato.Situacao);

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditContratoAsync(int usuarioId, int contratoId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Gestor de Filial":
                    var contrato = await _context.Contratos
                        .Include(c => c.Cliente)
                        .FirstOrDefaultAsync(c => c.Id == contratoId);
                    return contrato?.Cliente.FilialId == usuario.FilialId;

                case "Consultores":
                    var contratoConsultor = await _context.Contratos
                        .FirstOrDefaultAsync(c => c.Id == contratoId);
                    return contratoConsultor?.ConsultorId == usuario.ConsultorId;

                default:
                    return false;
            }
        }

        public async Task<bool> CanDeleteContratoAsync(int usuarioId, int contratoId)
        {
            // Apenas Administrador e Faturamento podem excluir
            var usuario = await GetUsuarioAsync(usuarioId);
            var grupoNome = usuario?.GrupoAcesso?.Nome;
            return grupoNome == "Administrador" || grupoNome == "Faturamento";
        }

        public async Task<IQueryable<Contrato>> FilterContratosByUserAsync(int usuarioId, IQueryable<Contrato> contratos)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return contratos.Where(c => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return contratos; // Todos os contratos

                case "Cobrança/Financeiro":
                    return contratos; // Todos os contratos (apenas visualização)

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    return contratos.Include(c => c.Cliente)
                        .Where(c => c.Cliente.FilialId == usuario.FilialId);

                case "Consultores":
                    // Consultores veem apenas seus próprios contratos
                    return contratos.Where(c => c.ConsultorId == usuario.ConsultorId);

                default:
                    return contratos.Where(c => false);
            }
        }

        public async Task<bool> CanViewConsultorAsync(int usuarioId, int consultorId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Cobrança/Financeiro":
                    return true; // Pode visualizar tudo

                case "Gestor de Filial":
                    var consultor = await _context.Consultores
                        .FirstOrDefaultAsync(c => c.Id == consultorId);
                    return consultor?.FilialId == usuario.FilialId;

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditConsultorAsync(int usuarioId, int consultorId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Gestor de Filial":
                    var consultor = await _context.Consultores
                        .FirstOrDefaultAsync(c => c.Id == consultorId);
                    return consultor?.FilialId == usuario.FilialId;

                default:
                    return false;
            }
        }

        public async Task<IQueryable<Consultor>> FilterConsultoresByUserAsync(int usuarioId, IQueryable<Consultor> consultores)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return consultores.Where(c => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return consultores; // Todos os consultores

                case "Cobrança/Financeiro":
                    return consultores; // Todos os consultores (apenas visualização)

                case "Gestor de Filial":
                    return consultores.Where(c => c.FilialId == usuario.FilialId);

                default:
                    return consultores.Where(c => false);
            }
        }

        public async Task<bool> CanViewParceiroAsync(int usuarioId, int parceiroId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Cobrança/Financeiro":
                    return true; // Pode visualizar tudo

                case "Gestor de Filial":
                    var parceiro = await _context.Parceiros
                        .FirstOrDefaultAsync(p => p.Id == parceiroId);
                    return parceiro?.FilialId == usuario.FilialId;

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditParceiroAsync(int usuarioId, int parceiroId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return true;

                case "Gestor de Filial":
                    var parceiro = await _context.Parceiros
                        .FirstOrDefaultAsync(p => p.Id == parceiroId);
                    return parceiro?.FilialId == usuario.FilialId;

                default:
                    return false;
            }
        }

        public async Task<IQueryable<Parceiro>> FilterParceirosByUserAsync(int usuarioId, IQueryable<Parceiro> parceiros)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return parceiros.Where(p => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                    return parceiros; // Todos os parceiros

                case "Cobrança/Financeiro":
                    return parceiros; // Todos os parceiros (apenas visualização)

                case "Gestor de Filial":
                    return parceiros.Where(p => p.FilialId == usuario.FilialId);

                default:
                    return parceiros.Where(p => false);
            }
        }

        public async Task<bool> CanViewUsuarioAsync(int usuarioId, int targetUsuarioId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                    return true;

                case "Cobrança/Financeiro":
                    return true; // Pode visualizar tudo

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditUsuarioAsync(int usuarioId, int targetUsuarioId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            // Faturamento não pode editar usuários
            if (grupoNome == "Faturamento") return false;

            return grupoNome == "Administrador";
        }

        public async Task<bool> CanDeleteUsuarioAsync(int usuarioId, int targetUsuarioId)
        {
            // Apenas Administrador pode excluir usuários
            var usuario = await GetUsuarioAsync(usuarioId);
            return usuario?.GrupoAcesso?.Nome == "Administrador";
        }

        public async Task<IQueryable<Usuario>> FilterUsuariosByUserAsync(int usuarioId, IQueryable<Usuario> usuarios)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return usuarios.Where(u => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                    return usuarios; // Todos os usuários

                case "Cobrança/Financeiro":
                    return usuarios; // Todos os usuários (apenas visualização)

                default:
                    return usuarios.Where(u => false);
            }
        }

        public async Task<bool> CanViewPessoaFisicaAsync(int usuarioId, int pessoaFisicaId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Cobrança/Financeiro":
                case "Gestor de Filial":
                case "Administrativo de Filial":
                case "Consultores":
                    return true; // Todos podem visualizar pessoas físicas

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditPessoaFisicaAsync(int usuarioId, int pessoaFisicaId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Gestor de Filial":
                case "Consultores":
                    return true;

                default:
                    return false;
            }
        }

        public async Task<IQueryable<PessoaFisica>> FilterPessoasFisicasByUserAsync(int usuarioId, IQueryable<PessoaFisica> pessoasFisicas)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return pessoasFisicas.Where(p => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Cobrança/Financeiro":
                    return pessoasFisicas; // Todas as pessoas físicas

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    if (usuario.FilialId == null) return pessoasFisicas.Where(p => false);

                    // Filtra pessoas físicas que são clientes, consultores ou parceiros da filial do usuário
                    var pessoasFisicasIds = await _context.Clientes
                        .Where(c => c.FilialId == usuario.FilialId && c.PessoaFisicaId != null)
                        .Select(c => c.PessoaFisicaId!.Value)
                        .Union(_context.Consultores
                            .Where(co => co.FilialId == usuario.FilialId)
                            .Select(co => co.PessoaFisicaId))
                        .Union(_context.Parceiros
                            .Where(p => p.FilialId == usuario.FilialId)
                            .Select(p => p.PessoaFisicaId))
                        .ToListAsync();

                    return pessoasFisicas.Where(pf => pessoasFisicasIds.Contains(pf.Id));

                case "Consultores":
                    return pessoasFisicas; // Consultores podem ver todas as pessoas físicas

                default:
                    return pessoasFisicas.Where(p => false);
            }
        }

        public async Task<bool> CanViewPessoaJuridicaAsync(int usuarioId, int pessoaJuridicaId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Cobrança/Financeiro":
                case "Gestor de Filial":
                case "Administrativo de Filial":
                case "Consultores":
                    return true; // Todos podem visualizar pessoas jurídicas

                default:
                    return false;
            }
        }

        public async Task<bool> CanEditPessoaJuridicaAsync(int usuarioId, int pessoaJuridicaId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return false;

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Gestor de Filial":
                case "Consultores":
                    return true;

                default:
                    return false;
            }
        }

        public async Task<IQueryable<PessoaJuridica>> FilterPessoasJuridicasByUserAsync(int usuarioId, IQueryable<PessoaJuridica> pessoasJuridicas)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return pessoasJuridicas.Where(p => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Cobrança/Financeiro":
                    return pessoasJuridicas; // Todas as pessoas jurídicas

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    if (usuario.FilialId == null) return pessoasJuridicas.Where(p => false);

                    // Filtra pessoas jurídicas que são clientes da filial do usuário
                    var pessoasJuridicasIds = await _context.Clientes
                        .Where(c => c.FilialId == usuario.FilialId && c.PessoaJuridicaId != null)
                        .Select(c => c.PessoaJuridicaId!.Value)
                        .ToListAsync();

                    return pessoasJuridicas.Where(pj => pessoasJuridicasIds.Contains(pj.Id));

                case "Consultores":
                    return pessoasJuridicas; // Consultores podem ver todas as pessoas jurídicas

                default:
                    return pessoasJuridicas.Where(p => false);
            }
        }

        public async Task<Usuario?> GetUsuarioAsync(int usuarioId)
        {
            return await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .Include(u => u.Filial)
                .Include(u => u.Consultor)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);
        }

        public async Task<string?> GetUsuarioGrupoAsync(int usuarioId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            return usuario?.GrupoAcesso?.Nome;
        }

        public async Task<int?> GetUsuarioFilialIdAsync(int usuarioId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            return usuario?.FilialId;
        }

        public async Task<int?> GetUsuarioConsultorIdAsync(int usuarioId)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            return usuario?.ConsultorId;
        }

        public async Task<IQueryable<Boleto>> FilterBoletosByUserAsync(int usuarioId, IQueryable<Boleto> boletos)
        {
            var usuario = await GetUsuarioAsync(usuarioId);
            if (usuario?.GrupoAcessoId == null) return boletos.Where(b => false);

            var grupoNome = usuario.GrupoAcesso?.Nome;

            switch (grupoNome)
            {
                case "Administrador":
                case "Faturamento":
                case "Cobrança/Financeiro":
                    return boletos; // Todos os boletos

                case "Gestor de Filial":
                case "Administrativo de Filial":
                    if (usuario.FilialId == null) return boletos.Where(b => false);

                    // Filtra boletos de contratos de clientes da filial do usuário
                    return boletos.Where(b => b.Contrato.Cliente.FilialId == usuario.FilialId);

                case "Consultores":
                    if (usuario.ConsultorId == null) return boletos.Where(b => false);

                    // Filtra boletos de contratos do consultor
                    return boletos.Where(b => b.Contrato.ConsultorId == usuario.ConsultorId);

                default:
                    return boletos.Where(b => false);
            }
        }
    }
}
