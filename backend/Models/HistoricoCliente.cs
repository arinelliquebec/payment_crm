using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class HistoricoCliente
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O ID do cliente é obrigatório")]
        public int ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        [Required(ErrorMessage = "O tipo de ação é obrigatório")]
        [StringLength(50)]
        public string TipoAcao { get; set; } = string.Empty; // "Criacao", "Atualizacao", "Exclusao", "MudancaStatus"

        [Required(ErrorMessage = "A descrição é obrigatória")]
        [StringLength(500)]
        public string Descricao { get; set; } = string.Empty; // Descrição da mudança

        [StringLength(2000)]
        public string? DadosAnteriores { get; set; } // JSON com dados antes da mudança

        [StringLength(2000)]
        public string? DadosNovos { get; set; } // JSON com dados depois da mudança

        [Required(ErrorMessage = "O ID do usuário é obrigatório")]
        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        [StringLength(200)]
        public string? NomeUsuario { get; set; } // Nome do usuário que fez a alteração (denormalizado para performance)

        public DateTime DataHora { get; set; } = DateTime.Now;

        [StringLength(100)]
        public string? EnderecoIP { get; set; } // IP de onde a ação foi executada
    }
}

