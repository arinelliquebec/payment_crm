using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public interface IUsuarioGrupoFilialService
    {
        Task<GrupoFilialValidationResult> ValidateGrupoFilialAsync(int grupoAcessoId, int? filialId, int? pessoaFisicaId, int? pessoaJuridicaId);
        Task<bool> IsFilialRequiredForGrupoAsync(int grupoAcessoId);
        Task<bool> CanUserHaveNoFilialAsync(int grupoAcessoId);
        Task<UsuarioFilialInfo?> GetSuggestedFilialAsync(int pessoaFisicaId, int? pessoaJuridicaId);
        Task<List<FilialOption>> GetAvailableFilialsForGrupoAsync(int grupoAcessoId);
    }

    public class GrupoFilialValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
        public string? WarningMessage { get; set; }
        public bool FilialRequired { get; set; }
        public bool CanBeNull { get; set; }
        public UsuarioFilialInfo? SuggestedFilial { get; set; }
    }

    public class FilialOption
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public bool IsSuggested { get; set; }
        public string? Reason { get; set; }
    }
}
