using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CadastroUsuarioDTO
    {
        [Required(ErrorMessage = "CPF é obrigatório")]
        [StringLength(14, ErrorMessage = "CPF deve ter no máximo 14 caracteres")]
        public string Cpf { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha é obrigatória")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Senha deve ter entre 6 e 100 caracteres")]
        public string Senha { get; set; } = string.Empty;
    }
}
