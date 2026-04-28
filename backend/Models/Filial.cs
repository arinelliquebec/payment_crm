using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class Filial
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome da filial é obrigatório")]
        [StringLength(100, ErrorMessage = "O nome da filial deve ter no máximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        public DateTime DataInclusao { get; set; } = DateTime.Now;

        [StringLength(100, ErrorMessage = "O usuário deve ter no máximo 100 caracteres")]
        public string? UsuarioImportacao { get; set; }
    }
}
