namespace CrmArrighi.Services
{
    public interface ISeedDataService
    {
        Task SeedGruposAcessoAsync();
        Task SeedPermissoesAsync();
        Task SeedPermissoesGruposAsync();
        Task SeedAllAsync();
    }
}
