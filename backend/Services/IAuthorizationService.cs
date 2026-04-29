using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public interface IAuthorizationService
    {
        // Verificações básicas de permissão
        Task<bool> HasPermissionAsync(int usuarioId, string modulo, string acao);
        Task<bool> CanAccessAsync(int usuarioId, string modulo, string acao, int? filialId = null, int? consultorId = null);

        // Verificações específicas para clientes
        Task<bool> CanViewClienteAsync(int usuarioId, int clienteId);
        Task<bool> CanEditClienteAsync(int usuarioId, int clienteId);
        Task<bool> CanDeleteClienteAsync(int usuarioId, int clienteId);
        Task<IQueryable<Cliente>> FilterClientesByUserAsync(int usuarioId, IQueryable<Cliente> clientes);

        // Verificações específicas para contratos
        Task<bool> CanViewContratoAsync(int usuarioId, int contratoId);
        Task<bool> CanEditContratoAsync(int usuarioId, int contratoId);
        Task<bool> CanDeleteContratoAsync(int usuarioId, int contratoId);
        Task<IQueryable<Contrato>> FilterContratosByUserAsync(int usuarioId, IQueryable<Contrato> contratos);

        // Verificações específicas para consultores
        Task<bool> CanViewConsultorAsync(int usuarioId, int consultorId);
        Task<bool> CanEditConsultorAsync(int usuarioId, int consultorId);
        Task<IQueryable<Consultor>> FilterConsultoresByUserAsync(int usuarioId, IQueryable<Consultor> consultores);

        // Verificações específicas para parceiros
        Task<bool> CanViewParceiroAsync(int usuarioId, int parceiroId);
        Task<bool> CanEditParceiroAsync(int usuarioId, int parceiroId);
        Task<IQueryable<Parceiro>> FilterParceirosByUserAsync(int usuarioId, IQueryable<Parceiro> parceiros);

        // Verificações específicas para usuários
        Task<bool> CanViewUsuarioAsync(int usuarioId, int targetUsuarioId);
        Task<bool> CanEditUsuarioAsync(int usuarioId, int targetUsuarioId);
        Task<bool> CanDeleteUsuarioAsync(int usuarioId, int targetUsuarioId);
        Task<IQueryable<Usuario>> FilterUsuariosByUserAsync(int usuarioId, IQueryable<Usuario> usuarios);

        // Verificações para pessoas físicas e jurídicas
        Task<bool> CanViewPessoaFisicaAsync(int usuarioId, int pessoaFisicaId);
        Task<bool> CanEditPessoaFisicaAsync(int usuarioId, int pessoaFisicaId);
        Task<IQueryable<PessoaFisica>> FilterPessoasFisicasByUserAsync(int usuarioId, IQueryable<PessoaFisica> pessoasFisicas);

        Task<bool> CanViewPessoaJuridicaAsync(int usuarioId, int pessoaJuridicaId);
        Task<bool> CanEditPessoaJuridicaAsync(int usuarioId, int pessoaJuridicaId);
        Task<IQueryable<PessoaJuridica>> FilterPessoasJuridicasByUserAsync(int usuarioId, IQueryable<PessoaJuridica> pessoasJuridicas);

        // Verificações para boletos
        Task<IQueryable<Boleto>> FilterBoletosByUserAsync(int usuarioId, IQueryable<Boleto> boletos);

        // Obter informações do usuário
        Task<Usuario?> GetUsuarioAsync(int usuarioId);
        Task<string?> GetUsuarioGrupoAsync(int usuarioId);
        Task<int?> GetUsuarioFilialIdAsync(int usuarioId);
        Task<int?> GetUsuarioConsultorIdAsync(int usuarioId);
    }
}
