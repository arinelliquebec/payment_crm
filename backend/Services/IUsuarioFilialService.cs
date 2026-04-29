using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public interface IUsuarioFilialService
    {
        Task<UsuarioFilialInfo?> GetFilialInfoForPessoaFisicaAsync(int pessoaFisicaId);
        Task<UsuarioFilialInfo?> GetFilialInfoForPessoaJuridicaAsync(int pessoaJuridicaId);
        Task<UsuarioFilialInfo?> GetFilialInfoForUsuarioAsync(int pessoaFisicaId, int? pessoaJuridicaId);
        Task<bool> IsPessoaFisicaConsultorAsync(int pessoaFisicaId);
        Task<bool> IsPessoaFisicaParceiroAsync(int pessoaFisicaId);
        Task<int?> GetConsultorIdForPessoaFisicaAsync(int pessoaFisicaId);
        Task<int?> GetParceiroIdForPessoaFisicaAsync(int pessoaFisicaId);
    }

    public class UsuarioFilialInfo
    {
        public int? FilialId { get; set; }
        public string? FilialNome { get; set; }
        public int? ConsultorId { get; set; }
        public int? ParceiroId { get; set; }
        public bool IsConsultor { get; set; }
        public bool IsParceiro { get; set; }
        public string? OAB { get; set; }
    }
}
