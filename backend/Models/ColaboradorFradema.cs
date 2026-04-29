using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("ColaboradoresFradema")]
    public class ColaboradorFradema
    {
        public int Id { get; set; }

        public int PessoaFisicaId { get; set; }

        public int? FilialId { get; set; }

        [StringLength(100)]
        public string? Cargo { get; set; }

        public DateTime? DataAdmissao { get; set; }

        [StringLength(200)]
        public string? Empresa { get; set; }

        public bool? Ativo { get; set; }

        public DateTime? DataCadastro { get; set; }

        public DateTime? DataAtualizacao { get; set; }

        public int? IncluidoPorUsuarioId { get; set; }

        public int? AtualizadoPorUsuarioId { get; set; }

        [StringLength(200)]
        public string? Filial { get; set; }

        // Navigation property
        [ForeignKey("PessoaFisicaId")]
        public PessoaFisicaFradema? PessoaFisica { get; set; }
    }
}
