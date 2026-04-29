using CrmArrighi.Data;
using CrmArrighi.DTOs;
using CrmArrighi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmArrighi.Services
{
    public class LeadService
    {
        private readonly CrmArrighiContext _context;

        public LeadService(CrmArrighiContext context)
        {
            _context = context;
        }

        public async Task<List<LeadDTO>> GetAllLeadsAsync(int? responsavelId = null, string? status = null, string? origem = null)
        {
            var query = _context.Leads
                .Include(l => l.Responsavel)
                .Include(l => l.CriadoPor)
                .Include(l => l.Interacoes)
                .AsQueryable();

            if (responsavelId.HasValue)
                query = query.Where(l => l.ResponsavelId == responsavelId.Value);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(l => l.Status == status);

            if (!string.IsNullOrEmpty(origem))
                query = query.Where(l => l.Origem == origem);

            var leads = await query
                .OrderByDescending(l => l.DataCriacao)
                .ToListAsync();

            return leads.Select(l => MapToDTO(l)).ToList();
        }

        public async Task<LeadDTO?> GetLeadByIdAsync(int id)
        {
            var lead = await _context.Leads
                .Include(l => l.Responsavel)
                .Include(l => l.CriadoPor)
                .Include(l => l.Interacoes)
                .ThenInclude(i => i.Usuario)
                .FirstOrDefaultAsync(l => l.Id == id);

            return lead != null ? MapToDTO(lead) : null;
        }

        public async Task<LeadDTO> CreateLeadAsync(CreateLeadDTO dto, int criadoPorId)
        {
            var lead = new Lead
            {
                NomeEmpresa = dto.NomeEmpresa,
                ValorEstimado = dto.ValorEstimado,
                Origem = dto.Origem,
                ContatoNome = dto.ContatoNome,
                ContatoTelefone = dto.ContatoTelefone,
                ContatoEmail = dto.ContatoEmail,
                ContatoCargo = dto.ContatoCargo,
                Necessidade = dto.Necessidade,
                Observacoes = dto.Observacoes,
                ResponsavelId = dto.ResponsavelId > 0 ? dto.ResponsavelId : null,
                Probabilidade = dto.Probabilidade ?? 10,
                Status = "Novo",
                DataCriacao = DateTime.UtcNow,
                CriadoPorId = criadoPorId > 0 ? criadoPorId : null
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            return (await GetLeadByIdAsync(lead.Id))!;
        }

        public async Task<LeadDTO?> UpdateLeadAsync(int id, UpdateLeadDTO dto, int atualizadoPorId)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return null;

            if (!string.IsNullOrEmpty(dto.NomeEmpresa))
                lead.NomeEmpresa = dto.NomeEmpresa;

            if (dto.ValorEstimado.HasValue)
                lead.ValorEstimado = dto.ValorEstimado.Value;

            if (dto.Origem != null)
                lead.Origem = dto.Origem;

            if (dto.ContatoNome != null)
                lead.ContatoNome = dto.ContatoNome;

            if (dto.ContatoTelefone != null)
                lead.ContatoTelefone = dto.ContatoTelefone;

            if (dto.ContatoEmail != null)
                lead.ContatoEmail = dto.ContatoEmail;

            if (dto.ContatoCargo != null)
                lead.ContatoCargo = dto.ContatoCargo;

            if (dto.Necessidade != null)
                lead.Necessidade = dto.Necessidade;

            if (dto.Observacoes != null)
                lead.Observacoes = dto.Observacoes;

            if (dto.ResponsavelId.HasValue)
                lead.ResponsavelId = dto.ResponsavelId;

            if (dto.Probabilidade.HasValue)
                lead.Probabilidade = dto.Probabilidade;

            if (dto.DataProximaAcao.HasValue)
                lead.DataProximaAcao = dto.DataProximaAcao;

            if (dto.ProximaAcao != null)
                lead.ProximaAcao = dto.ProximaAcao;

            lead.DataAtualizacao = DateTime.UtcNow;
            lead.AtualizadoPorId = atualizadoPorId > 0 ? atualizadoPorId : null;

            await _context.SaveChangesAsync();

            return await GetLeadByIdAsync(id);
        }

        public async Task<LeadDTO?> UpdateLeadStatusAsync(int id, UpdateLeadStatusDTO dto, int atualizadoPorId)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return null;

            var statusAnterior = lead.Status;
            lead.Status = dto.Status;
            lead.DataAtualizacao = DateTime.UtcNow;
            lead.AtualizadoPorId = atualizadoPorId > 0 ? atualizadoPorId : null;

            // Atualizar datas conforme status
            switch (dto.Status)
            {
                case "Qualificado":
                    if (lead.DataQualificacao == null)
                        lead.DataQualificacao = DateTime.UtcNow;
                    lead.Probabilidade = 30;
                    break;
                case "Proposta":
                    if (lead.DataProposta == null)
                        lead.DataProposta = DateTime.UtcNow;
                    lead.Probabilidade = 50;
                    break;
                case "Negociacao":
                    if (lead.DataNegociacao == null)
                        lead.DataNegociacao = DateTime.UtcNow;
                    lead.Probabilidade = 80;
                    break;
                case "Fechado":
                    if (lead.DataFechamento == null)
                        lead.DataFechamento = DateTime.UtcNow;
                    lead.Probabilidade = 100;
                    break;
                case "Perdido":
                    lead.MotivoPerda = dto.MotivoPerda;
                    lead.Probabilidade = 0;
                    break;
            }

            await _context.SaveChangesAsync();

            return await GetLeadByIdAsync(id);
        }

        public async Task<bool> DeleteLeadAsync(int id)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return false;

            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<LeadInteracaoDTO>> GetLeadInteracoesAsync(int leadId)
        {
            var interacoes = await _context.Set<LeadInteracao>()
                .Include(i => i.Usuario)
                .Where(i => i.LeadId == leadId)
                .OrderByDescending(i => i.DataInteracao)
                .ToListAsync();

            return interacoes.Select(i => new LeadInteracaoDTO
            {
                Id = i.Id,
                LeadId = i.LeadId,
                Tipo = i.Tipo,
                Descricao = i.Descricao,
                DataInteracao = i.DataInteracao,
                UsuarioNome = i.Usuario?.Login,
                DuracaoMinutos = i.DuracaoMinutos
            }).ToList();
        }

        public async Task<LeadInteracaoDTO> AddInteracaoAsync(int leadId, CreateLeadInteracaoDTO dto, int usuarioId)
        {
            var interacao = new LeadInteracao
            {
                LeadId = leadId,
                Tipo = dto.Tipo,
                Descricao = dto.Descricao,
                DuracaoMinutos = dto.DuracaoMinutos,
                DataInteracao = DateTime.UtcNow,
                UsuarioId = usuarioId > 0 ? usuarioId : null
            };

            _context.Set<LeadInteracao>().Add(interacao);

            // Atualizar data da última interação no lead
            var lead = await _context.Leads.FindAsync(leadId);
            if (lead != null)
            {
                lead.DataUltimaInteracao = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return (await GetLeadInteracoesAsync(leadId)).First(i => i.Id == interacao.Id);
        }

        public async Task<PipelineStatsDTO> GetPipelineStatsAsync(int? responsavelId = null)
        {
            var query = _context.Leads.AsQueryable();

            if (responsavelId.HasValue)
                query = query.Where(l => l.ResponsavelId == responsavelId.Value);

            var leads = await query.ToListAsync();

            var stats = new PipelineStatsDTO
            {
                TotalLeads = leads.Count,
                ValorTotal = leads.Sum(l => l.ValorEstimado),
                ValorPrevisto = leads
                    .Where(l => l.Status != "Perdido" && l.Status != "Pausado")
                    .Sum(l => l.ValorEstimado * (l.Probabilidade ?? 0) / 100m),
                LeadsPorStatus = leads.GroupBy(l => l.Status)
                    .ToDictionary(g => g.Key, g => g.Count()),
                ValorPorStatus = leads.GroupBy(l => l.Status)
                    .ToDictionary(g => g.Key, g => g.Sum(l => l.ValorEstimado)),
                LeadsPorOrigem = leads.Where(l => l.Origem != null)
                    .GroupBy(l => l.Origem!)
                    .ToDictionary(g => g.Key, g => g.Count())
            };

            // Taxa de conversão
            var totalIniciados = leads.Count(l => l.Status != "Novo");
            var totalFechados = leads.Count(l => l.Status == "Fechado");
            stats.TaxaConversao = totalIniciados > 0 ? (double)totalFechados / totalIniciados * 100 : 0;

            // Tempo médio de ciclo (em dias)
            var leadsFechados = leads.Where(l => l.Status == "Fechado" && l.DataFechamento.HasValue);
            if (leadsFechados.Any())
            {
                stats.TempoMedioCiclo = leadsFechados
                    .Average(l => (l.DataFechamento!.Value - l.DataCriacao).TotalDays);
            }

            // Leads urgentes (sem interação há mais de 7 dias ou próxima ação atrasada)
            var dataLimite = DateTime.UtcNow.AddDays(-7);
            var leadsUrgentes = await query
                .Include(l => l.Responsavel)
                .Where(l => l.Status != "Fechado" && l.Status != "Perdido" &&
                    (l.DataUltimaInteracao == null || l.DataUltimaInteracao < dataLimite ||
                     (l.DataProximaAcao.HasValue && l.DataProximaAcao < DateTime.UtcNow)))
                .Take(5)
                .ToListAsync();

            stats.LeadsUrgentes = leadsUrgentes.Select(l => MapToDTO(l)).ToList();

            return stats;
        }

        private LeadDTO MapToDTO(Lead lead)
        {
            return new LeadDTO
            {
                Id = lead.Id,
                NomeEmpresa = lead.NomeEmpresa,
                Status = lead.Status,
                ValorEstimado = lead.ValorEstimado,
                Probabilidade = lead.Probabilidade,
                Origem = lead.Origem,
                ContatoNome = lead.ContatoNome,
                ContatoTelefone = lead.ContatoTelefone,
                ContatoEmail = lead.ContatoEmail,
                ContatoCargo = lead.ContatoCargo,
                Necessidade = lead.Necessidade,
                Observacoes = lead.Observacoes,
                ResponsavelId = lead.ResponsavelId,
                ResponsavelNome = lead.Responsavel?.Login,
                DataCriacao = lead.DataCriacao,
                DataUltimaInteracao = lead.DataUltimaInteracao,
                DataProximaAcao = lead.DataProximaAcao,
                ProximaAcao = lead.ProximaAcao,
                DataQualificacao = lead.DataQualificacao,
                DataProposta = lead.DataProposta,
                DataNegociacao = lead.DataNegociacao,
                DataFechamento = lead.DataFechamento,
                MotivoPerda = lead.MotivoPerda,
                ClienteId = lead.ClienteId,
                ContratoId = lead.ContratoId,
                TotalInteracoes = lead.Interacoes?.Count ?? 0,
                CriadoPorNome = lead.CriadoPor?.Login
            };
        }
    }
}
