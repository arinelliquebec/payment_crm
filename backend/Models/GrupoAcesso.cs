using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("GruposAcesso")]
    public class GrupoAcesso
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome do grupo é obrigatório")]
        [StringLength(100, ErrorMessage = "O nome do grupo deve ter no máximo 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "A descrição deve ter no máximo 500 caracteres")]
        public string? Descricao { get; set; }

        public bool Ativo { get; set; } = true;
        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }

        // Navegação
        public virtual ICollection<PermissaoGrupo> Permissoes { get; set; } = new List<PermissaoGrupo>();
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    }
}
