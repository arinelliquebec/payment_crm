namespace CrmArrighi.Models
{
    public class PessoaFisicaListDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string EmailEmpresarial { get; set; } = string.Empty;
        public string? EmailPessoal { get; set; }
        public string? Codinome { get; set; }
        public string? Sexo { get; set; }
        public DateTime? DataNascimento { get; set; }
        public string? EstadoCivil { get; set; }
        public string Cpf { get; set; } = string.Empty;
        public string? Rg { get; set; }
        public string? Cnh { get; set; }
        public string? Telefone1 { get; set; }
        public string? Telefone2 { get; set; }
        public int? EnderecoId { get; set; }
        public Endereco? Endereco { get; set; }
        public DateTime DataCadastro { get; set; }
        public DateTime? DataAtualizacao { get; set; }

        // Tipos de vínculo
        public List<string> Tipos { get; set; } = new List<string>();
    }
}


