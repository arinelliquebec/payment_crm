namespace CrmArrighi.Models
{
    public class UpdateUsuarioDTO
    {
        public string? Login { get; set; }
        public string? Email { get; set; }
        public string? Senha { get; set; }
        public int? GrupoAcessoId { get; set; }
        public string? TipoPessoa { get; set; }
        public int? PessoaFisicaId { get; set; }
        public int? PessoaJuridicaId { get; set; }
        public int? FilialId { get; set; }
        public int? ConsultorId { get; set; }
        public bool? Ativo { get; set; }
    }
}
