namespace CrmArrighi.Services
{
    public interface ISeedDataService
    {
        Task SeedGruposAcessoAsync();
        Task SeedPermissoesAsync();
        Task SeedPermissoesGruposAsync();
        Task SeedAllAsync();

        /// <summary>
        /// Cria ou atualiza admin a partir de configuração/ambiente (<c>BootstrapAdmin:*</c>).
        /// Nunca executado em produção salvo flags explícitas.
        /// </summary>
        Task SeedBootstrapAdministratorIfConfiguredAsync();
    }
}
