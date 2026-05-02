using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.DTOs;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FuncionarioController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public FuncionarioController(CrmArrighiContext context)
        {
            _context = context;
        }

        // ── GET /api/Funcionario ────────────────────────────────────────────
        // Lista paginada de funcionários (PessoasFuncionarios + Funcionarios)
        [HttpGet]
        public async Task<ActionResult<FuncionarioPagedResponse>> List(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? filial = null,
            [FromQuery] string? empresa = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (limit < 1) limit = 20;

                IQueryable<PessoaFuncionario> query = _context.PessoasFuncionarios;

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var termo = search.Trim().ToLower();
                    var termoLimpo = search.Replace(".", "").Replace("-", "").Replace(" ", "");

                    query = query.Where(pf =>
                        (pf.Nome != null && pf.Nome.ToLower().Contains(termo)) ||
                        (pf.Cpf != null && pf.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "").Contains(termoLimpo)) ||
                        (pf.EmailEmpresarial != null && pf.EmailEmpresarial.ToLower().Contains(termo)));
                }

                if (!string.IsNullOrWhiteSpace(filial))
                {
                    var pfIdsComFilial = _context.Funcionarios
                        .Where(c => c.Filial == filial)
                        .Select(c => c.PessoaFisicaId);
                    query = query.Where(pf => pfIdsComFilial.Contains(pf.Id));
                }

                if (!string.IsNullOrWhiteSpace(empresa))
                {
                    var pfIdsComEmpresa = _context.Funcionarios
                        .Where(c => c.Empresa == empresa)
                        .Select(c => c.PessoaFisicaId);
                    query = query.Where(pf => pfIdsComEmpresa.Contains(pf.Id));
                }

                var total = await query.CountAsync();
                var offset = (page - 1) * limit;

                var pessoas = await query
                    .OrderBy(pf => pf.Nome)
                    .Skip(offset)
                    .Take(limit)
                    .ToListAsync();

                var pfIds = pessoas.Select(p => p.Id).ToList();

                var funcionarios = await _context.Funcionarios
                    .Where(c => pfIds.Contains(c.PessoaFisicaId))
                    .ToListAsync();

                var users = pessoas.Select(pf =>
                {
                    var fun = funcionarios.FirstOrDefault(c => c.PessoaFisicaId == pf.Id);
                    return MapToDTO(pf, fun, null);
                }).ToList();

                var totalPages = (int)Math.Ceiling((double)total / limit);

                return Ok(new FuncionarioPagedResponse
                {
                    Success = true,
                    Users = users,
                    Pagination = new PaginationInfo
                    {
                        Page = page,
                        Limit = limit,
                        Total = total,
                        TotalPages = totalPages
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] List error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao listar funcionários: {ex.Message}" });
            }
        }

        // ── GET /api/Funcionario/search?search=... ──────────────────────────
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? search)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(search))
                {
                    return Ok(new { success = true, funcionarios = Array.Empty<object>() });
                }

                var termo = search.Trim().ToLower();
                var termoLimpo = search.Replace(".", "").Replace("-", "").Replace(" ", "");

                var pessoas = await _context.PessoasFuncionarios
                    .Where(pf =>
                        (pf.Nome != null && pf.Nome.ToLower().Contains(termo)) ||
                        (pf.Cpf != null && pf.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "").Contains(termoLimpo)) ||
                        (pf.EmailEmpresarial != null && pf.EmailEmpresarial.ToLower().Contains(termo)))
                    .OrderBy(pf => pf.Nome)
                    .Take(50)
                    .ToListAsync();

                var pfIds = pessoas.Select(p => p.Id).ToList();

                var funcionarios = await _context.Funcionarios
                    .Where(c => pfIds.Contains(c.PessoaFisicaId))
                    .ToListAsync();

                var result = pessoas.Select(pf =>
                {
                    var fun = funcionarios.FirstOrDefault(c => c.PessoaFisicaId == pf.Id);
                    return MapToDTO(pf, fun, null);
                }).ToList();

                return Ok(new { success = true, funcionarios = result });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] Search error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar funcionários: {ex.Message}" });
            }
        }

        // ── GET /api/Funcionario/filiais ────────────────────────────────────
        [HttpGet("filiais")]
        public async Task<IActionResult> GetFiliais()
        {
            try
            {
                var filiais = await _context.Funcionarios
                    .Where(c => c.Filial != null && c.Filial != "")
                    .Select(c => c.Filial!)
                    .Distinct()
                    .OrderBy(f => f)
                    .ToListAsync();

                return Ok(new { success = true, filiais });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] GetFiliais error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar filiais: {ex.Message}" });
            }
        }

        // ── GET /api/Funcionario/empresas ───────────────────────────────────
        [HttpGet("empresas")]
        public async Task<IActionResult> GetEmpresas()
        {
            try
            {
                var empresas = await _context.Funcionarios
                    .Where(c => c.Empresa != null && c.Empresa != "")
                    .Select(c => c.Empresa!)
                    .Distinct()
                    .OrderBy(e => e)
                    .ToListAsync();

                return Ok(new { success = true, empresas });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] GetEmpresas error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar empresas: {ex.Message}" });
            }
        }

        // ── GET /api/Funcionario/stats ──────────────────────────────────────
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalPessoas = await _context.PessoasFuncionarios.CountAsync();
                var totalFuncionarios = await _context.Funcionarios.CountAsync();
                var funcionariosAtivos = await _context.Funcionarios.CountAsync(c => c.Ativo == true);

                return Ok(new
                {
                    success = true,
                    stats = new FuncionarioStatsDTO
                    {
                        TotalPessoas = totalPessoas,
                        TotalFuncionarios = totalFuncionarios,
                        FuncionariosAtivos = funcionariosAtivos,
                        TotalSystemUsers = 0,
                        TotalAdmins = 0
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] GetStats error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar estatísticas: {ex.Message}" });
            }
        }

        // ── GET /api/Funcionario/{id} ───────────────────────────────────────
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var pf = await _context.PessoasFuncionarios.FindAsync(id);
                if (pf == null)
                {
                    return NotFound(new { success = false, message = "Funcionário não encontrado" });
                }

                var fun = await _context.Funcionarios
                    .FirstOrDefaultAsync(c => c.PessoaFisicaId == id);

                var profile = MapToDTO(pf, fun, null);

                return Ok(new { success = true, profile });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] GetById error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar funcionário: {ex.Message}" });
            }
        }

        // ── PUT /api/Funcionario/{id} ───────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFuncionarioDTO dto)
        {
            try
            {
                var pf = await _context.PessoasFuncionarios.FindAsync(id);
                if (pf == null)
                {
                    return NotFound(new { success = false, message = "Funcionário não encontrado" });
                }

                bool pfChanged = false;
                if (dto.Nome != null) { pf.Nome = dto.Nome; pfChanged = true; }
                if (dto.EmailEmpresarial != null) { pf.EmailEmpresarial = dto.EmailEmpresarial; pfChanged = true; }
                if (dto.EmailPessoal != null) { pf.EmailPessoal = dto.EmailPessoal; pfChanged = true; }
                if (dto.Codinome != null) { pf.Codinome = dto.Codinome; pfChanged = true; }
                if (dto.Sexo != null) { pf.Sexo = dto.Sexo; pfChanged = true; }
                if (dto.EstadoCivil != null) { pf.EstadoCivil = dto.EstadoCivil; pfChanged = true; }
                if (dto.Cpf != null) { pf.Cpf = dto.Cpf; pfChanged = true; }
                if (dto.Rg != null) { pf.Rg = dto.Rg; pfChanged = true; }
                if (dto.Cnh != null) { pf.Cnh = dto.Cnh; pfChanged = true; }
                if (dto.Telefone1 != null) { pf.Telefone1 = dto.Telefone1; pfChanged = true; }
                if (dto.Telefone2 != null) { pf.Telefone2 = dto.Telefone2; pfChanged = true; }
                if (dto.DataNascimento != null && DateTime.TryParse(dto.DataNascimento, out var nascimento))
                {
                    pf.DataNascimento = nascimento;
                    pfChanged = true;
                }

                if (pfChanged)
                {
                    pf.DataAtualizacao = DateTime.UtcNow;
                }

                if (dto.Cargo != null || dto.Empresa != null || dto.Filial != null || dto.Ativo != null)
                {
                    var fun = await _context.Funcionarios
                        .FirstOrDefaultAsync(c => c.PessoaFisicaId == id);

                    if (fun != null)
                    {
                        if (dto.Cargo != null) fun.Cargo = dto.Cargo;
                        if (dto.Empresa != null) fun.Empresa = dto.Empresa;
                        if (dto.Filial != null) fun.Filial = dto.Filial;
                        if (dto.Ativo != null) fun.Ativo = dto.Ativo;
                        fun.DataAtualizacao = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Funcionário atualizado com sucesso" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Funcionario] Update error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao atualizar funcionário: {ex.Message}" });
            }
        }

        // ── Helpers ─────────────────────────────────────────────────────────

        private static FuncionarioListDTO MapToDTO(
            PessoaFuncionario pf,
            Funcionario? fun,
            SystemUserMatch? sysUser)
        {
            var dataNasc = pf.DataNascimento?.ToString("yyyy-MM-dd");
            var dataAdm = fun?.DataAdmissao?.ToString("yyyy-MM-dd");

            return new FuncionarioListDTO
            {
                Id = $"pf-{pf.Id}",
                FuncionarioId = pf.Id,
                Name = pf.Nome ?? "",
                Nome = pf.Nome ?? "",
                Email = pf.EmailEmpresarial ?? "",
                EmailEmpresarial = pf.EmailEmpresarial,
                EmailPessoal = pf.EmailPessoal,
                Cpf = pf.Cpf ?? "",
                Codinome = pf.Codinome,
                Sexo = pf.Sexo,
                EstadoCivil = pf.EstadoCivil,
                Rg = pf.Rg,
                Cnh = pf.Cnh,
                Telefone1 = pf.Telefone1,
                Telefone2 = pf.Telefone2,
                Phone = pf.Telefone1,
                DataNascimento = dataNasc,
                BirthDate = dataNasc,
                Cargo = fun?.Cargo,
                Position = fun?.Cargo,
                Empresa = fun?.Empresa,
                Company = fun?.Empresa,
                Filial = fun?.Filial,
                Ativo = fun?.Ativo,
                DataAdmissao = dataAdm,
                HireDate = dataAdm,
                HasSystemUser = sysUser != null,
                SystemUserId = sysUser?.UserId,
                Role = sysUser?.Role ?? "funcionario",
                CreatedAt = pf.DataCadastro
            };
        }
    }

    /// <summary>
    /// Placeholder for cross-system user match. External integration removed for portfolio.
    /// </summary>
    public class SystemUserMatch
    {
        public string CpfLimpo { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
