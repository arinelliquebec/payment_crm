namespace CrmArrighi.Models
{
    public class UsuarioResponseDTO
    {
        public int Id { get; set; }
        public string Login { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TipoPessoa { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public DateTime? UltimoAcesso { get; set; }

        // Informações da Pessoa
        public int? PessoaFisicaId { get; set; }
        public int? PessoaJuridicaId { get; set; }
        public string? NomePessoa { get; set; }

        // Grupo de Acesso
        public int? GrupoAcessoId { get; set; }
        public string? GrupoAcessoNome { get; set; }

        // Filial
        public int? FilialId { get; set; }
        public string? FilialNome { get; set; }

        // Consultor
        public int? ConsultorId { get; set; }
        public string? ConsultorNome { get; set; }
    }
}
