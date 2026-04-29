using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public class UsuarioGrupoFilialService : IUsuarioGrupoFilialService
    {
        private readonly CrmArrighiContext _context;
        private readonly IUsuarioFilialService _usuarioFilialService;

        public UsuarioGrupoFilialService(CrmArrighiContext context, IUsuarioFilialService usuarioFilialService)
        {
            _context = context;
            _usuarioFilialService = usuarioFilialService;
        }

        public async Task<GrupoFilialValidationResult> ValidateGrupoFilialAsync(int grupoAcessoId, int? filialId, int? pessoaFisicaId, int? pessoaJuridicaId)
        {
            var grupo = await _context.GruposAcesso.FindAsync(grupoAcessoId);
            if (grupo == null)
            {
                return new GrupoFilialValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Grupo de acesso não encontrado"
                };
            }

            var result = new GrupoFilialValidationResult
            {
                IsValid = true,
                FilialRequired = await IsFilialRequiredForGrupoAsync(grupoAcessoId),
                CanBeNull = await CanUserHaveNoFilialAsync(grupoAcessoId)
            };

            // Obter sugestão de filial baseada na pessoa
            if (pessoaFisicaId.HasValue)
            {
                result.SuggestedFilial = await _usuarioFilialService.GetFilialInfoForPessoaFisicaAsync(pessoaFisicaId.Value);
            }

            // Validar baseado no grupo
            switch (grupo.Nome)
            {
                case "Administrador":
                    // Administrador pode ter ou não filial
                    if (filialId.HasValue)
                    {
                        result.WarningMessage = "Administradores normalmente não têm filial para ter visão geral do sistema";
                    }
                    break;

                case "Faturamento":
                    // Faturamento pode ter ou não filial
                    if (filialId.HasValue)
                    {
                        result.WarningMessage = "Faturamento normalmente não tem filial para ter visão geral do sistema";
                    }
                    break;

                case "Cobrança/Financeiro":
                    // Cobrança/Financeiro pode ter ou não filial
                    if (filialId.HasValue)
                    {
                        result.WarningMessage = "Cobrança/Financeiro normalmente não tem filial para ter visão geral do sistema";
                    }
                    break;

                case "Gestor de Filial":
                    // Gestor DEVE ter filial
                    if (!filialId.HasValue)
                    {
                        result.IsValid = false;
                        result.ErrorMessage = "Gestor de Filial deve ter uma filial atribuída";
                    }
                    break;

                case "Administrativo de Filial":
                    // Administrativo DEVE ter filial
                    if (!filialId.HasValue)
                    {
                        result.IsValid = false;
                        result.ErrorMessage = "Administrativo de Filial deve ter uma filial atribuída";
                    }
                    break;

                case "Consultores":
                    // Consultor DEVE ter filial (preferencialmente da sua consultoria)
                    if (!filialId.HasValue)
                    {
                        result.IsValid = false;
                        result.ErrorMessage = "Consultor deve ter uma filial atribuída";
                    }
                    else if (result.SuggestedFilial != null && result.SuggestedFilial.FilialId != filialId)
                    {
                        result.WarningMessage = $"Este consultor está vinculado à filial '{result.SuggestedFilial.FilialNome}'. Considere usar essa filial.";
                    }
                    break;

                case "Usuário":
                    // Usuário pode ter ou não filial (até ser alocado)
                    break;
            }

            return result;
        }

        public async Task<bool> IsFilialRequiredForGrupoAsync(int grupoAcessoId)
        {
            var grupo = await _context.GruposAcesso.FindAsync(grupoAcessoId);
            if (grupo == null) return false;

            return grupo.Nome switch
            {
                "Gestor de Filial" => true,
                "Administrativo de Filial" => true,
                "Consultores" => true,
                _ => false
            };
        }

        public async Task<bool> CanUserHaveNoFilialAsync(int grupoAcessoId)
        {
            var grupo = await _context.GruposAcesso.FindAsync(grupoAcessoId);
            if (grupo == null) return false;

            return grupo.Nome switch
            {
                "Administrador" => true,
                "Faturamento" => true,
                "Cobrança/Financeiro" => true,
                "Usuário" => true,
                _ => false
            };
        }

        public async Task<UsuarioFilialInfo?> GetSuggestedFilialAsync(int pessoaFisicaId, int? pessoaJuridicaId)
        {
            if (pessoaFisicaId > 0)
            {
                return await _usuarioFilialService.GetFilialInfoForPessoaFisicaAsync(pessoaFisicaId);
            }

            if (pessoaJuridicaId.HasValue && pessoaJuridicaId.Value > 0)
            {
                return await _usuarioFilialService.GetFilialInfoForPessoaJuridicaAsync(pessoaJuridicaId.Value);
            }

            return null;
        }

        public async Task<List<FilialOption>> GetAvailableFilialsForGrupoAsync(int grupoAcessoId)
        {
            var grupo = await _context.GruposAcesso.FindAsync(grupoAcessoId);
            if (grupo == null) return new List<FilialOption>();

            var filiais = await _context.Filiais
                .Where(f => f.DataInclusao != default(DateTime))
                .OrderBy(f => f.Nome)
                .ToListAsync();

            var options = new List<FilialOption>();

            // Adicionar opção "Sem Filial" se permitido
            if (await CanUserHaveNoFilialAsync(grupoAcessoId))
            {
                options.Add(new FilialOption
                {
                    Id = 0,
                    Nome = "Sem Filial (Visão Geral)",
                    IsSuggested = grupo.Nome == "Administrador" || grupo.Nome == "Faturamento" || grupo.Nome == "Cobrança/Financeiro",
                    Reason = grupo.Nome switch
                    {
                        "Administrador" => "Recomendado para visão geral do sistema",
                        "Faturamento" => "Recomendado para visão geral do sistema",
                        "Cobrança/Financeiro" => "Recomendado para visão geral do sistema",
                        _ => "Permitido para este grupo"
                    }
                });
            }

            // Adicionar filiais disponíveis
            foreach (var filial in filiais)
            {
                options.Add(new FilialOption
                {
                    Id = filial.Id,
                    Nome = filial.Nome,
                    IsSuggested = false
                });
            }

            return options;
        }
    }
}
