using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("PermissoesGrupos")]
    public class PermissaoGrupo
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O grupo de acesso é obrigatório")]
        public int GrupoAcessoId { get; set; }
        public GrupoAcesso GrupoAcesso { get; set; } = null!;

        [Required(ErrorMessage = "A permissão é obrigatória")]
        public int PermissaoId { get; set; }
        public Permissao Permissao { get; set; } = null!;

        // Campos específicos para regras de negócio
        public bool ApenasProprios { get; set; } = false; // Se true, só pode ver seus próprios registros
        public bool ApenasFilial { get; set; } = false; // Se true, só pode ver registros da sua filial
        public bool ApenasLeitura { get; set; } = false; // Se true, só pode visualizar (não pode editar/excluir)
        public bool IncluirSituacoesEspecificas { get; set; } = false; // Para consultores verem "Sem interesse" e "Não encontrado"
        
        [StringLength(500, ErrorMessage = "As situações específicas devem ter no máximo 500 caracteres")]
        public string? SituacoesEspecificas { get; set; } // JSON com as situações permitidas

        public DateTime DataCadastro { get; set; } = DateTime.Now;
    }
}
