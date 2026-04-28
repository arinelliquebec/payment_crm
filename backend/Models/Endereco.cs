using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class Endereco
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "A cidade é obrigatória")]
        [StringLength(100, ErrorMessage = "A cidade deve ter no máximo 100 caracteres")]
        public string Cidade { get; set; } = string.Empty;

        [Required(ErrorMessage = "O bairro é obrigatório")]
        [StringLength(100, ErrorMessage = "O bairro deve ter no máximo 100 caracteres")]
        public string Bairro { get; set; } = string.Empty;

        [Required(ErrorMessage = "O logradouro é obrigatório")]
        [StringLength(200, ErrorMessage = "O logradouro deve ter no máximo 200 caracteres")]
        public string Logradouro { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CEP é obrigatório")]
        [StringLength(9, ErrorMessage = "O CEP deve ter 9 caracteres")]
        public string Cep { get; set; } = string.Empty;

        [Required(ErrorMessage = "O número é obrigatório")]
        [StringLength(10, ErrorMessage = "O número deve ter no máximo 10 caracteres")]
        public string Numero { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "O complemento deve ter no máximo 100 caracteres")]
        public string? Complemento { get; set; }
    }
}
