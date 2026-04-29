using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Credenciais de acesso ao Portal do Cliente.
    /// Criada no primeiro acesso via magic link; usada para login por senha nos acessos seguintes.
    /// </summary>
    public class CredencialPortalCliente
    {
        public int Id { get; set; }

        [Required]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        [Required]
        [StringLength(14)]
        public string Documento { get; set; } = string.Empty; // CPF (11) ou CNPJ (14), só dígitos

        [Required]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string SenhaHash { get; set; } = string.Empty; // BCrypt hash

        [StringLength(100)]
        public string? NomeExibicao { get; set; }

        [StringLength(50)]
        public string Role { get; set; } = "cliente";

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }
        public DateTime? UltimoAcesso { get; set; }
        public bool Ativo { get; set; } = true;

        // Token para primeiro acesso e recuperação de senha
        [StringLength(500)]
        public string? TokenAcesso { get; set; }
        public DateTime? TokenExpiracao { get; set; }

        public bool PrimeiroAcessoRealizado { get; set; } = false;
    }
}
