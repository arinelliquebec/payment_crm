using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public class UsuarioFilialService : IUsuarioFilialService
    {
        private readonly CrmArrighiContext _context;

        public UsuarioFilialService(CrmArrighiContext context)
        {
            _context = context;
        }

        public async Task<UsuarioFilialInfo?> GetFilialInfoForPessoaFisicaAsync(int pessoaFisicaId)
        {
            // Verificar se é consultor
            var consultor = await _context.Consultores
                .Include(c => c.Filial)
                .FirstOrDefaultAsync(c => c.PessoaFisicaId == pessoaFisicaId && c.Ativo);

            if (consultor != null)
            {
                return new UsuarioFilialInfo
                {
                    FilialId = consultor.FilialId,
                    FilialNome = consultor.Filial.Nome,
                    ConsultorId = consultor.Id,
                    IsConsultor = true,
                    IsParceiro = false,
                    OAB = consultor.OAB
                };
            }

            // Verificar se é parceiro
            var parceiro = await _context.Parceiros
                .Include(p => p.Filial)
                .FirstOrDefaultAsync(p => p.PessoaFisicaId == pessoaFisicaId && p.Ativo);

            if (parceiro != null)
            {
                return new UsuarioFilialInfo
                {
                    FilialId = parceiro.FilialId,
                    FilialNome = parceiro.Filial.Nome,
                    ParceiroId = parceiro.Id,
                    IsConsultor = false,
                    IsParceiro = true,
                    OAB = parceiro.OAB
                };
            }

            return null; // Não é nem consultor nem parceiro
        }

        public async Task<UsuarioFilialInfo?> GetFilialInfoForPessoaJuridicaAsync(int pessoaJuridicaId)
        {
            // Para pessoas jurídicas, não há consultores ou parceiros diretamente
            // Retornar null para indicar que não há filial associada
            return null;
        }

        public async Task<UsuarioFilialInfo?> GetFilialInfoForUsuarioAsync(int pessoaFisicaId, int? pessoaJuridicaId)
        {
            if (pessoaFisicaId > 0)
            {
                return await GetFilialInfoForPessoaFisicaAsync(pessoaFisicaId);
            }

            if (pessoaJuridicaId.HasValue && pessoaJuridicaId.Value > 0)
            {
                return await GetFilialInfoForPessoaJuridicaAsync(pessoaJuridicaId.Value);
            }

            return null;
        }

        public async Task<bool> IsPessoaFisicaConsultorAsync(int pessoaFisicaId)
        {
            return await _context.Consultores
                .AnyAsync(c => c.PessoaFisicaId == pessoaFisicaId && c.Ativo);
        }

        public async Task<bool> IsPessoaFisicaParceiroAsync(int pessoaFisicaId)
        {
            return await _context.Parceiros
                .AnyAsync(p => p.PessoaFisicaId == pessoaFisicaId && p.Ativo);
        }

        public async Task<int?> GetConsultorIdForPessoaFisicaAsync(int pessoaFisicaId)
        {
            var consultor = await _context.Consultores
                .FirstOrDefaultAsync(c => c.PessoaFisicaId == pessoaFisicaId && c.Ativo);

            return consultor?.Id;
        }

        public async Task<int?> GetParceiroIdForPessoaFisicaAsync(int pessoaFisicaId)
        {
            var parceiro = await _context.Parceiros
                .FirstOrDefaultAsync(p => p.PessoaFisicaId == pessoaFisicaId && p.Ativo);

            return parceiro?.Id;
        }
    }
}
