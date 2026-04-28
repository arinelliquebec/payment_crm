using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("Usuarios")]
    public class Usuario
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "O login é obrigatório")]
        [StringLength(50, ErrorMessage = "O login deve ter no máximo 50 caracteres")]
        public string Login { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "O e-mail é obrigatório")]
        [EmailAddress(ErrorMessage = "E-mail inválido")]
        [StringLength(150, ErrorMessage = "O e-mail deve ter no máximo 150 caracteres")]
        public string Email { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "A senha é obrigatória")]
        [StringLength(100, ErrorMessage = "A senha deve ter no máximo 100 caracteres")]
        public string Senha { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "O grupo de acesso é obrigatório")]
        [StringLength(50, ErrorMessage = "O grupo de acesso deve ter no máximo 50 caracteres")]
        public string GrupoAcesso { get; set; } = string.Empty;
        
        // Tipo de pessoa (Física ou Jurídica)
        [Required(ErrorMessage = "O tipo de pessoa é obrigatório")]
        public string TipoPessoa { get; set; } = string.Empty; // "Fisica" ou "Juridica"
        
        // Relacionamento com Pessoa Física (opcional)
        public int? PessoaFisicaId { get; set; }
        public PessoaFisica? PessoaFisica { get; set; }
        
        // Relacionamento com Pessoa Jurídica (opcional)
        public int? PessoaJuridicaId { get; set; }
        public PessoaJuridica? PessoaJuridica { get; set; }
        
        public bool Ativo { get; set; } = true;
        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
        public DateTime? UltimoAcesso { get; set; }
    }
} 