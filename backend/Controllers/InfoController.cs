using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InfoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public InfoController(CrmArrighiContext context)
        {
            _context = context;
        }

        [HttpGet("filiais")]
        public async Task<ActionResult<IEnumerable<FilialInfoDTO>>> GetFiliais()
        {
            try
            {
                var filiais = await _context.Filiais
                    .Where(f => f.DataInclusao != default(DateTime)) // Filiais ativas
                    .Select(f => new FilialInfoDTO
                    {
                        Id = f.Id,
                        Nome = f.Nome,
                        DataInclusao = f.DataInclusao,
                        UsuarioImportacao = f.UsuarioImportacao
                    })
                    .OrderBy(f => f.Nome)
                    .ToListAsync();

                return Ok(filiais);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("consultores")]
        public async Task<ActionResult<IEnumerable<ConsultorInfoDTO>>> GetConsultores()
        {
            try
            {
                var consultores = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.Filial)
                    .Where(c => c.Ativo)
                    .Select(c => new ConsultorInfoDTO
                    {
                        Id = c.Id,
                        Nome = c.PessoaFisica.Nome,
                        Cpf = c.PessoaFisica.Cpf,
                        OAB = c.OAB,
                        FilialId = c.FilialId,
                        FilialNome = c.Filial.Nome,
                        DataCadastro = c.DataCadastro,
                        PessoaFisicaId = c.PessoaFisicaId
                    })
                    .OrderBy(c => c.Nome)
                    .ToListAsync();

                return Ok(consultores);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("consultores/filial/{filialId}")]
        public async Task<ActionResult<IEnumerable<ConsultorInfoDTO>>> GetConsultoresPorFilial(int filialId)
        {
            try
            {
                var consultores = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.Filial)
                    .Where(c => c.Ativo && c.FilialId == filialId)
                    .Select(c => new ConsultorInfoDTO
                    {
                        Id = c.Id,
                        Nome = c.PessoaFisica.Nome,
                        Cpf = c.PessoaFisica.Cpf,
                        OAB = c.OAB,
                        FilialId = c.FilialId,
                        FilialNome = c.Filial.Nome,
                        DataCadastro = c.DataCadastro
                    })
                    .OrderBy(c => c.Nome)
                    .ToListAsync();

                return Ok(consultores);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("grupos-acesso")]
        public async Task<ActionResult<IEnumerable<GrupoAcessoInfoDTO>>> GetGruposAcesso()
        {
            try
            {
                var grupos = await _context.GruposAcesso
                    .Where(g => g.Ativo)
                    .Select(g => new GrupoAcessoInfoDTO
                    {
                        Id = g.Id,
                        Nome = g.Nome,
                        Descricao = g.Descricao,
                        DataCadastro = g.DataCadastro
                    })
                    .OrderBy(g => g.Nome)
                    .ToListAsync();

                return Ok(grupos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("permissoes")]
        public async Task<ActionResult<Dictionary<string, List<PermissaoInfoDTO>>>> GetPermissoes()
        {
            try
            {
                var permissoes = await _context.Permissoes
                    .Where(p => p.Ativo)
                    .Select(p => new PermissaoInfoDTO
                    {
                        Id = p.Id,
                        Nome = p.Nome,
                        Descricao = p.Descricao,
                        Modulo = p.Modulo,
                        Acao = p.Acao
                    })
                    .OrderBy(p => p.Modulo)
                    .ThenBy(p => p.Acao)
                    .ToListAsync();

                var permissoesPorModulo = permissoes
                    .GroupBy(p => p.Modulo)
                    .ToDictionary(g => g.Key, g => g.ToList());

                return Ok(permissoesPorModulo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("situacoes-contrato")]
        public ActionResult<IEnumerable<string>> GetSituacoesContrato()
        {
            var situacoes = new[]
            {
                "Leed",
                "Prospecto", 
                "Contrato Enviado",
                "Contrato Assinado",
                "Retornar",
                "Sem Interesse",
                "Não encontrado"
            };

            return Ok(situacoes);
        }

        [HttpGet("tipos-pessoa")]
        public ActionResult<IEnumerable<string>> GetTiposPessoa()
        {
            var tipos = new[]
            {
                "Fisica",
                "Juridica"
            };

            return Ok(tipos);
        }

        [HttpGet("parceiros")]
        public async Task<ActionResult<IEnumerable<ParceiroInfoDTO>>> GetParceiros()
        {
            try
            {
                var parceiros = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                    .Include(p => p.Filial)
                    .Where(p => p.Ativo)
                    .Select(p => new ParceiroInfoDTO
                    {
                        Id = p.Id,
                        Nome = p.PessoaFisica.Nome,
                        Cpf = p.PessoaFisica.Cpf,
                        OAB = p.OAB,
                        Email = p.Email,
                        Telefone = p.Telefone,
                        FilialId = p.FilialId,
                        FilialNome = p.Filial.Nome,
                        DataCadastro = p.DataCadastro,
                        PessoaFisicaId = p.PessoaFisicaId
                    })
                    .OrderBy(p => p.Nome)
                    .ToListAsync();

                return Ok(parceiros);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("parceiros/filial/{filialId}")]
        public async Task<ActionResult<IEnumerable<ParceiroInfoDTO>>> GetParceirosPorFilial(int filialId)
        {
            try
            {
                var parceiros = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                    .Include(p => p.Filial)
                    .Where(p => p.Ativo && p.FilialId == filialId)
                    .Select(p => new ParceiroInfoDTO
                    {
                        Id = p.Id,
                        Nome = p.PessoaFisica.Nome,
                        Cpf = p.PessoaFisica.Cpf,
                        OAB = p.OAB,
                        Email = p.Email,
                        Telefone = p.Telefone,
                        FilialId = p.FilialId,
                        FilialNome = p.Filial.Nome,
                        DataCadastro = p.DataCadastro,
                        PessoaFisicaId = p.PessoaFisicaId
                    })
                    .OrderBy(p => p.Nome)
                    .ToListAsync();

                return Ok(parceiros);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }
    }

    public class FilialInfoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public DateTime DataInclusao { get; set; }
        public string? UsuarioImportacao { get; set; }
    }

    public class ConsultorInfoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Cpf { get; set; } = string.Empty;
        public string? OAB { get; set; }
        public int FilialId { get; set; }
        public string FilialNome { get; set; } = string.Empty;
        public DateTime DataCadastro { get; set; }
        public int PessoaFisicaId { get; set; }
    }

    public class GrupoAcessoInfoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime DataCadastro { get; set; }
    }

    public class PermissaoInfoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Modulo { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
    }

    public class ParceiroInfoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Cpf { get; set; } = string.Empty;
        public string? OAB { get; set; }
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public int FilialId { get; set; }
        public string FilialNome { get; set; } = string.Empty;
        public DateTime DataCadastro { get; set; }
        public int PessoaFisicaId { get; set; }
    }
}
