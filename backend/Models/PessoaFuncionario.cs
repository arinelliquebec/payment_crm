using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("PessoasFuncionarios")]
    public class PessoaFuncionario
    {
        public int Id { get; set; }

        [StringLength(255)]
        public string? Nome { get; set; }

        [StringLength(150)]
        public string? EmailEmpresarial { get; set; }

        [StringLength(255)]
        public string? EmailPessoal { get; set; }

        [StringLength(100)]
        public string? Codinome { get; set; }

        [StringLength(20)]
        public string? Sexo { get; set; }

        public DateTime? DataNascimento { get; set; }

        [StringLength(30)]
        public string? EstadoCivil { get; set; }

        [StringLength(14)]
        public string? Cpf { get; set; }

        [StringLength(20)]
        public string? Rg { get; set; }

        [StringLength(20)]
        public string? Cnh { get; set; }

        [StringLength(20)]
        public string? Telefone1 { get; set; }

        [StringLength(20)]
        public string? Telefone2 { get; set; }

        public int? EnderecoId { get; set; }

        public DateTime? DataCadastro { get; set; }

        public DateTime? DataAtualizacao { get; set; }

        public int? TipoPessoa { get; set; }

        [StringLength(11)]
        public string? Ssn { get; set; }

        [StringLength(50)]
        public string? Irs { get; set; }
    }
}
