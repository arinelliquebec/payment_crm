namespace CrmArrighi.DTOs
{
    /// <summary>
    /// DTO para listagem de funcionários (PessoaFuncionario + Funcionario).
    /// </summary>
    public class FuncionarioListDTO
    {
        // Identificadores
        public string Id { get; set; } = string.Empty;          // "pf-{PessoaFuncionarioId}"
        public int FuncionarioId { get; set; }                  // PessoaFuncionario.Id

        // Dados pessoais (de PessoasFuncionarios)
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

        // Dados de vínculo (de Funcionarios)
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
        public string Role { get; set; } = "funcionario";
        public DateTime? CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO para estatísticas de funcionários.
    /// </summary>
    public class FuncionarioStatsDTO
    {
        public long TotalPessoas { get; set; }
        public long TotalFuncionarios { get; set; }
        public long FuncionariosAtivos { get; set; }
        public long TotalSystemUsers { get; set; }
        public long TotalAdmins { get; set; }
    }

    /// <summary>
    /// DTO para atualização parcial de funcionário.
    /// </summary>
    public class UpdateFuncionarioDTO
    {
        // Campos de PessoaFuncionario
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

        // Campos de Funcionario
        public string? Cargo { get; set; }
        public string? Empresa { get; set; }
        public string? Filial { get; set; }
        public bool? Ativo { get; set; }
    }

    /// <summary>
    /// Resposta paginada de funcionários.
    /// </summary>
    public class FuncionarioPagedResponse
    {
        public bool Success { get; set; } = true;
        public List<FuncionarioListDTO> Users { get; set; } = new();
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
