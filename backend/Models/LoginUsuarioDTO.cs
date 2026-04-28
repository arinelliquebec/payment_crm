using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class LoginUsuarioDTO
    {
        [Required(ErrorMessage = "Login é obrigatório")]
        [StringLength(50, ErrorMessage = "Login deve ter no máximo 50 caracteres")]
        public string Login { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha é obrigatória")]
        [StringLength(100, ErrorMessage = "Senha deve ter no máximo 100 caracteres")]
        public string Senha { get; set; } = string.Empty;
    }
}
