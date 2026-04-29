using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("Permissoes")]
    public class Permissao
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome da permissão é obrigatório")]
        [StringLength(100, ErrorMessage = "O nome da permissão deve ter no máximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "A descrição deve ter no máximo 200 caracteres")]
        public string? Descricao { get; set; }

        [Required(ErrorMessage = "O módulo é obrigatório")]
        [StringLength(50, ErrorMessage = "O módulo deve ter no máximo 50 caracteres")]
        public string Modulo { get; set; } = string.Empty; // PessoaFisica, PessoaJuridica, Cliente, Contrato, etc.

        [Required(ErrorMessage = "A ação é obrigatória")]
        [StringLength(50, ErrorMessage = "A ação deve ter no máximo 50 caracteres")]
        public string Acao { get; set; } = string.Empty; // Visualizar, Incluir, Editar, Excluir

        public bool Ativo { get; set; } = true;
        public DateTime DataCadastro { get; set; } = DateTime.Now;

        // Navegação
        public virtual ICollection<PermissaoGrupo> PermissaoGrupos { get; set; } = new List<PermissaoGrupo>();
    }
}
