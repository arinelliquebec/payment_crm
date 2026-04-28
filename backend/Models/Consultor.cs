using System.ComponentModel.DataAnnotations;
using CrmArrighi.Models;

namespace CrmArrighi.Models
{
    public class Consultor
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "A pessoa física é obrigatória")]
        public int PessoaFisicaId { get; set; }
        public PessoaFisica PessoaFisica { get; set; } = null!;

        [Required(ErrorMessage = "A filial é obrigatória")]
        public int FilialId { get; set; }
        public Filial Filial { get; set; } = null!;

        [StringLength(20, ErrorMessage = "OAB deve ter no máximo 20 caracteres")]
        public string? OAB { get; set; }

        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
