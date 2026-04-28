using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class Cliente
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O tipo de pessoa é obrigatório")]
        public string TipoPessoa { get; set; } = string.Empty; // "Fisica" ou "Juridica"

        // Relacionamento com PessoaFisica (quando TipoPessoa = "Fisica")
        public int? PessoaFisicaId { get; set; }
        public PessoaFisica? PessoaFisica { get; set; }

        // Relacionamento com PessoaJuridica (quando TipoPessoa = "Juridica")
        public int? PessoaJuridicaId { get; set; }
        public PessoaJuridica? PessoaJuridica { get; set; }

        // Consultor atual (será implementado posteriormente)
        public int? ConsultorAtualId { get; set; }

        public int? FilialId { get; set; }
        public Filial Filial { get; set; } = null!;

        [StringLength(100, ErrorMessage = "O status deve ter no máximo 100 caracteres")]
        public string? Status { get; set; }

        [StringLength(1000, ErrorMessage = "As observações devem ter no máximo 1000 caracteres")]
        public string? Observacoes { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "O valor do contrato deve ser maior ou igual a zero")]
        public decimal ValorContrato { get; set; } = 0;

        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
