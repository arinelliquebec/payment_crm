namespace CrmArrighi.DTOs
{
    public class LeadDTO
    {
        public int Id { get; set; }
        public string NomeEmpresa { get; set; } = string.Empty;
        public string Status { get; set; } = "Novo";
        public decimal ValorEstimado { get; set; }
        public int? Probabilidade { get; set; }
        public string? Origem { get; set; }
        public string? ContatoNome { get; set; }
        public string? ContatoTelefone { get; set; }
        public string? ContatoEmail { get; set; }
        public string? ContatoCargo { get; set; }
        public string? Necessidade { get; set; }
        public string? Observacoes { get; set; }
        public int? ResponsavelId { get; set; }
        public string? ResponsavelNome { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataUltimaInteracao { get; set; }
        public DateTime? DataProximaAcao { get; set; }
        public string? ProximaAcao { get; set; }
        public DateTime? DataQualificacao { get; set; }
        public DateTime? DataProposta { get; set; }
        public DateTime? DataNegociacao { get; set; }
        public DateTime? DataFechamento { get; set; }
        public string? MotivoPerda { get; set; }
        public int? ClienteId { get; set; }
        public int? ContratoId { get; set; }
        public int TotalInteracoes { get; set; }
        public string? CriadoPorNome { get; set; }
    }

    public class CreateLeadDTO
    {
        public string NomeEmpresa { get; set; } = string.Empty;
        public decimal ValorEstimado { get; set; }
        public string? Origem { get; set; }
        public string? ContatoNome { get; set; }
        public string? ContatoTelefone { get; set; }
        public string? ContatoEmail { get; set; }
        public string? ContatoCargo { get; set; }
        public string? Necessidade { get; set; }
        public string? Observacoes { get; set; }
        public int? ResponsavelId { get; set; }
        public int? Probabilidade { get; set; }
    }

    public class UpdateLeadDTO
    {
        public string? NomeEmpresa { get; set; }
        public decimal? ValorEstimado { get; set; }
        public string? Origem { get; set; }
        public string? ContatoNome { get; set; }
        public string? ContatoTelefone { get; set; }
        public string? ContatoEmail { get; set; }
        public string? ContatoCargo { get; set; }
        public string? Necessidade { get; set; }
        public string? Observacoes { get; set; }
        public int? ResponsavelId { get; set; }
        public int? Probabilidade { get; set; }
        public DateTime? DataProximaAcao { get; set; }
        public string? ProximaAcao { get; set; }
    }

    public class UpdateLeadStatusDTO
    {
        public string Status { get; set; } = string.Empty;
        public string? MotivoPerda { get; set; }
    }

    public class LeadInteracaoDTO
    {
        public int Id { get; set; }
        public int LeadId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public DateTime DataInteracao { get; set; }
        public string? UsuarioNome { get; set; }
        public int? DuracaoMinutos { get; set; }
    }

    public class CreateLeadInteracaoDTO
    {
        public string Tipo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int? DuracaoMinutos { get; set; }
    }

    public class PipelineStatsDTO
    {
        public int TotalLeads { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal ValorPrevisto { get; set; }
        public double TaxaConversao { get; set; }
        public double TempoMedioCiclo { get; set; }
        public Dictionary<string, int> LeadsPorStatus { get; set; } = new();
        public Dictionary<string, decimal> ValorPorStatus { get; set; } = new();
        public Dictionary<string, int> LeadsPorOrigem { get; set; } = new();
        public Dictionary<string, double> TaxaConversaoPorOrigem { get; set; } = new();
        public List<LeadDTO> LeadsUrgentes { get; set; } = new();
    }
}
