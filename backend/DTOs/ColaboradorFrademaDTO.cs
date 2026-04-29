namespace CrmArrighi.DTOs
{
    /// <summary>
    /// DTO para listagem de colaboradores (PessoaFisicaFradema + ColaboradorFradema).
    /// Formato compatível com o frontend frappyou.
    /// </summary>
    public class ColaboradorFrademaListDTO
    {
        // Identificadores
        public string Id { get; set; } = string.Empty;          // "pf-{PessoaFisicaId}"
        public int ColaboradorId { get; set; }                    // PessoaFisicaFradema.Id

        // Dados pessoais (de PessoasFisicasFradema)
        public string Name { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? EmailEmpresarial { get; set; }
        public string? EmailPessoal { get; set; }
        public string Cpf { get; set; } = string.Empty;
        public string? Codinome { get; set; }
        public string? Sexo { get; set; }
        public string? EstadoCivil { get; set; }
        public string? Rg { get; set; }
        public string? Cnh { get; set; }
        public string? Telefone1 { get; set; }
        public string? Telefone2 { get; set; }
        public string? Phone { get; set; }
        public string? DataNascimento { get; set; }              // "yyyy-MM-dd"
        public string? BirthDate { get; set; }                   // alias

        // Dados de vínculo (de ColaboradoresFradema)
        public string? Cargo { get; set; }
        public string? Position { get; set; }                    // alias de Cargo
        public string? Empresa { get; set; }
        public string? Company { get; set; }                     // alias de Empresa
        public string? Filial { get; set; }
        public bool? Ativo { get; set; }
        public string? DataAdmissao { get; set; }                // "yyyy-MM-dd"
        public string? HireDate { get; set; }                    // alias

        // Sistema
        public bool HasSystemUser { get; set; }
        public string? SystemUserId { get; set; }
        public string Role { get; set; } = "colaborador";
        public DateTime? CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO para estatísticas de colaboradores.
    /// </summary>
    public class ColaboradorFrademaStatsDTO
    {
        public long TotalPessoas { get; set; }
        public long TotalColaboradores { get; set; }
        public long ColaboradoresAtivos { get; set; }
        public long TotalSystemUsers { get; set; }
        public long TotalAdmins { get; set; }
    }

    /// <summary>
    /// DTO para atualização parcial de colaborador.
    /// </summary>
    public class UpdateColaboradorFrademaDTO
    {
        // Campos de PessoaFisicaFradema
        public string? Nome { get; set; }
        public string? EmailEmpresarial { get; set; }
        public string? EmailPessoal { get; set; }
        public string? Codinome { get; set; }
        public string? Sexo { get; set; }
        public string? DataNascimento { get; set; }
        public string? EstadoCivil { get; set; }
        public string? Cpf { get; set; }
        public string? Rg { get; set; }
        public string? Cnh { get; set; }
        public string? Telefone1 { get; set; }
        public string? Telefone2 { get; set; }

        // Campos de ColaboradorFradema
        public string? Cargo { get; set; }
        public string? Empresa { get; set; }
        public string? Filial { get; set; }
        public bool? Ativo { get; set; }
    }

    /// <summary>
    /// Resposta paginada de colaboradores (compatível com frontend frappyou).
    /// </summary>
    public class ColaboradorFrademaPagedResponse
    {
        public bool Success { get; set; } = true;
        public List<ColaboradorFrademaListDTO> Users { get; set; } = new();
        public PaginationInfo Pagination { get; set; } = new();
    }

    public class PaginationInfo
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public long Total { get; set; }
        public int TotalPages { get; set; }
    }
}
