using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CreateUsuarioDTO
    {
        [Required(ErrorMessage = "O login é obrigatório")]
        [StringLength(50, ErrorMessage = "O login deve ter no máximo 50 caracteres")]
        public string Login { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail é obrigatório")]
        [EmailAddress(ErrorMessage = "E-mail inválido")]
        [StringLength(150, ErrorMessage = "O e-mail deve ter no máximo 150 caracteres")]
        public string Email { get; set; } = string.Empty;

        // Senha é opcional - será obtida da Pessoa Física ao criar usuário em /usuarios
        [StringLength(100, ErrorMessage = "A senha deve ter no máximo 100 caracteres")]
        public string? Senha { get; set; }

        // GrupoAcesso (string) é opcional - o backend usará GrupoAcessoId ou atribuirá grupo padrão "Usuario"
        public string? GrupoAcesso { get; set; }

        public int? GrupoAcessoId { get; set; }

        [Required(ErrorMessage = "O tipo de pessoa é obrigatório")]
        public string TipoPessoa { get; set; } = string.Empty; // "Fisica" ou "Juridica"

        public int? PessoaFisicaId { get; set; }
        public int? PessoaJuridicaId { get; set; }
        public int? FilialId { get; set; }
        public int? ConsultorId { get; set; }
        public bool? Ativo { get; set; } = true;
    }

    public class ValidateGrupoFilialDTO
    {
        public int GrupoAcessoId { get; set; }
        public int? FilialId { get; set; }
        public int? PessoaFisicaId { get; set; }
        public int? PessoaJuridicaId { get; set; }
    }
}
