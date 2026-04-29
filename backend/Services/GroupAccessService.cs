using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public interface IGroupAccessService
    {
        Task<bool> CanAccessModuleAsync(int usuarioId, string modulo);
        Task<bool> CanAccessScreenAsync(int usuarioId, string screenName);
        Task<List<string>> GetAccessibleModulesAsync(int usuarioId);
        Task<List<string>> GetAccessibleScreensAsync(int usuarioId);
        Task<bool> IsModuleHiddenAsync(int usuarioId, string modulo);
        Task<GroupAccessInfo> GetGroupAccessInfoAsync(int usuarioId);
    }

    public class GroupAccessInfo
    {
        public int GrupoId { get; set; }
        public string GrupoNome { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public List<string> ModulosPermitidos { get; set; } = new();
        public List<string> ModulosOcultos { get; set; } = new();
        public List<string> TelasPermitidas { get; set; } = new();
        public List<string> TelasOcultas { get; set; } = new();
        public bool ApenasFilial { get; set; }
        public bool ApenasLeitura { get; set; }
        public bool OcultarAbaUsuarios { get; set; }
    }

    public class GroupAccessService : IGroupAccessService
    {
        private readonly CrmArrighiContext _context;

        public GroupAccessService(CrmArrighiContext context)
        {
            _context = context;
        }

        public async Task<bool> CanAccessModuleAsync(int usuarioId, string modulo)
        {
            var groupInfo = await GetGroupAccessInfoAsync(usuarioId);
            return groupInfo.ModulosPermitidos.Contains(modulo);
        }

        public async Task<bool> CanAccessScreenAsync(int usuarioId, string screenName)
        {
            var groupInfo = await GetGroupAccessInfoAsync(usuarioId);
            return groupInfo.TelasPermitidas.Contains(screenName);
        }

        public async Task<List<string>> GetAccessibleModulesAsync(int usuarioId)
        {
            var groupInfo = await GetGroupAccessInfoAsync(usuarioId);
            return groupInfo.ModulosPermitidos;
        }

        public async Task<List<string>> GetAccessibleScreensAsync(int usuarioId)
        {
            var groupInfo = await GetGroupAccessInfoAsync(usuarioId);
            return groupInfo.TelasPermitidas;
        }

        public async Task<bool> IsModuleHiddenAsync(int usuarioId, string modulo)
        {
            var groupInfo = await GetGroupAccessInfoAsync(usuarioId);
            return groupInfo.ModulosOcultos.Contains(modulo);
        }

        public async Task<GroupAccessInfo> GetGroupAccessInfoAsync(int usuarioId)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .FirstOrDefaultAsync(u => u.Id == usuarioId);

            if (usuario?.GrupoAcesso == null)
            {
                return GetUsuarioGroupInfo(); // Grupo Usuario (sem permissões)
            }

            return usuario.GrupoAcesso.Nome switch
            {
                "Usuario" => GetUsuarioGroupInfo(),
                "Administrador" => GetAdministradorGroupInfo(),
                "Consultores" => GetConsultoresGroupInfo(),
                "Administrativo de Filial" => GetAdministrativoFilialGroupInfo(),
                "Gestor de Filial" => GetGestorFilialGroupInfo(),
                "Cobrança e Financeiro" => GetCobrancaFinanceiroGroupInfo(),
                "Faturamento" => GetFaturamentoGroupInfo(),
                _ => GetUsuarioGroupInfo()
            };
        }

        private GroupAccessInfo GetUsuarioGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 1,
                GrupoNome = "Usuario",
                Descricao = "Usuário sem grupo de acesso",
                ModulosPermitidos = new List<string>(),
                ModulosOcultos = new List<string> { "PessoaFisica", "PessoaJuridica", "Cliente", "Contrato", "Consultor", "Parceiro", "Boleto", "Usuario", "Filial", "GrupoAcesso", "Permissao" },
                TelasPermitidas = new List<string>(),
                TelasOcultas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "clientes", "contratos", "consultores", "parceiros", "boletos", "usuarios", "filiais", "grupos-acesso", "permissoes" },
                ApenasFilial = false,
                ApenasLeitura = true,
                OcultarAbaUsuarios = true
            };
        }

        private GroupAccessInfo GetAdministradorGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 2,
                GrupoNome = "Administrador",
                Descricao = "Acesso total ao sistema",
                ModulosPermitidos = new List<string> { "PessoaFisica", "PessoaJuridica", "Cliente", "Contrato", "Consultor", "Parceiro", "Boleto", "Usuario", "Filial", "GrupoAcesso", "Permissao" },
                ModulosOcultos = new List<string>(),
                TelasPermitidas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "clientes", "contratos", "consultores", "parceiros", "boletos", "usuarios", "filiais", "grupos-acesso", "permissoes" },
                TelasOcultas = new List<string>(),
                ApenasFilial = false,
                ApenasLeitura = false,
                OcultarAbaUsuarios = false
            };
        }

        private GroupAccessInfo GetConsultoresGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 3,
                GrupoNome = "Consultores",
                Descricao = "Acesso a pessoa física/jurídica total, clientes da mesma filial e sem contrato",
                ModulosPermitidos = new List<string> { "PessoaFisica", "PessoaJuridica", "Cliente" },
                ModulosOcultos = new List<string> { "Contrato", "Consultor", "Parceiro", "Boleto", "Usuario", "Filial", "GrupoAcesso", "Permissao" },
                TelasPermitidas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "clientes" },
                TelasOcultas = new List<string> { "contratos", "consultores", "parceiros", "boletos", "usuarios", "filiais", "grupos-acesso", "permissoes" },
                ApenasFilial = true,
                ApenasLeitura = false,
                OcultarAbaUsuarios = true
            };
        }

        private GroupAccessInfo GetAdministrativoFilialGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 4,
                GrupoNome = "Administrativo de Filial",
                Descricao = "Apenas visualização de consultores, clientes e contratos da sua filial",
                ModulosPermitidos = new List<string> { "Consultor", "Cliente", "Contrato" },
                ModulosOcultos = new List<string> { "PessoaFisica", "PessoaJuridica", "Parceiro", "Boleto", "Usuario", "Filial", "GrupoAcesso", "Permissao" },
                TelasPermitidas = new List<string> { "consultores", "clientes", "contratos" },
                TelasOcultas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "parceiros", "boletos", "usuarios", "filiais", "grupos-acesso", "permissoes" },
                ApenasFilial = true,
                ApenasLeitura = true,
                OcultarAbaUsuarios = true
            };
        }

        private GroupAccessInfo GetGestorFilialGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 5,
                GrupoNome = "Gestor de Filial",
                Descricao = "Edita, inclui e exclui em todo o sistema porém somente na sua filial",
                ModulosPermitidos = new List<string> { "PessoaFisica", "PessoaJuridica", "Cliente", "Contrato", "Consultor", "Parceiro", "Boleto", "Filial" },
                ModulosOcultos = new List<string> { "Usuario", "GrupoAcesso", "Permissao" },
                TelasPermitidas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "clientes", "contratos", "consultores", "parceiros", "boletos", "filiais" },
                TelasOcultas = new List<string> { "usuarios", "grupos-acesso", "permissoes" },
                ApenasFilial = true,
                ApenasLeitura = false,
                OcultarAbaUsuarios = true
            };
        }

        private GroupAccessInfo GetCobrancaFinanceiroGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 6,
                GrupoNome = "Cobrança e Financeiro",
                Descricao = "Acesso total para visualizar todo o sistema (aba usuários oculta)",
                ModulosPermitidos = new List<string> { "PessoaFisica", "PessoaJuridica", "Cliente", "Contrato", "Consultor", "Parceiro", "Boleto", "Filial", "GrupoAcesso", "Permissao" },
                ModulosOcultos = new List<string> { "Usuario" },
                TelasPermitidas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "clientes", "contratos", "consultores", "parceiros", "boletos", "filiais", "grupos-acesso", "permissoes" },
                TelasOcultas = new List<string> { "usuarios" },
                ApenasFilial = false,
                ApenasLeitura = true,
                OcultarAbaUsuarios = true
            };
        }

        private GroupAccessInfo GetFaturamentoGroupInfo()
        {
            return new GroupAccessInfo
            {
                GrupoId = 7,
                GrupoNome = "Faturamento",
                Descricao = "Acesso similar ao administrador exceto módulo de usuários",
                ModulosPermitidos = new List<string> { "PessoaFisica", "PessoaJuridica", "Cliente", "Contrato", "Consultor", "Parceiro", "Boleto", "Filial", "GrupoAcesso", "Permissao" },
                ModulosOcultos = new List<string> { "Usuario" },
                TelasPermitidas = new List<string> { "pessoas-fisicas", "pessoas-juridicas", "clientes", "contratos", "consultores", "parceiros", "boletos", "filiais", "grupos-acesso", "permissoes" },
                TelasOcultas = new List<string> { "usuarios" },
                ApenasFilial = false,
                ApenasLeitura = false,
                OcultarAbaUsuarios = true
            };
        }
    }
}
