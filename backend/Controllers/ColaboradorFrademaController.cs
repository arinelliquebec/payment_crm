using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.DTOs;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ColaboradorFrademaController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public ColaboradorFrademaController(CrmArrighiContext context)
        {
            _context = context;
        }

        // ── GET /api/ColaboradorFradema ─────────────────────────────────────
        // Lista paginada de colaboradores (PessoasFisicasFradema + ColaboradoresFradema)
        [HttpGet]
        public async Task<ActionResult<ColaboradorFrademaPagedResponse>> List(
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

                IQueryable<PessoaFisicaFradema> query = _context.PessoasFisicasFradema;

                // Aplicar filtro de busca
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var termo = search.Trim().ToLower();
                    var termoLimpo = search.Replace(".", "").Replace("-", "").Replace(" ", "");

                    query = query.Where(pf =>
                        (pf.Nome != null && pf.Nome.ToLower().Contains(termo)) ||
                        (pf.Cpf != null && pf.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "").Contains(termoLimpo)) ||
                        (pf.EmailEmpresarial != null && pf.EmailEmpresarial.ToLower().Contains(termo)));
                }

                // Filtro por filial (via ColaboradoresFradema)
                if (!string.IsNullOrWhiteSpace(filial))
                {
                    var pfIdsComFilial = _context.ColaboradoresFradema
                        .Where(c => c.Filial == filial)
                        .Select(c => c.PessoaFisicaId);
                    query = query.Where(pf => pfIdsComFilial.Contains(pf.Id));
                }

                // Filtro por empresa (via ColaboradoresFradema)
                if (!string.IsNullOrWhiteSpace(empresa))
                {
                    var pfIdsComEmpresa = _context.ColaboradoresFradema
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

                // Buscar dados de ColaboradoresFradema para essas pessoas
                var colaboradores = await _context.ColaboradoresFradema
                    .Where(c => pfIds.Contains(c.PessoaFisicaId))
                    .ToListAsync();

                // Buscar CPFs das pessoas para verificar has_system_user
                var cpfsLimpos = pessoas
                    .Where(p => p.Cpf != null)
                    .Select(p => p.Cpf!.Replace(".", "").Replace("-", "").Replace(" ", ""))
                    .ToList();

                // Buscar users (tabela do frappyou) que batem por CPF
                var systemUsers = await _context.Database
                    .SqlQueryRaw<SystemUserMatch>(@"
                        SELECT 
                            REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') AS CpfLimpo,
                            id AS UserId,
                            role AS Role
                        FROM users 
                        WHERE deleted_at IS NULL 
                        AND cpf IS NOT NULL 
                        AND cpf <> ''")
                    .ToListAsync();

                var systemUsersByCpf = systemUsers
                    .GroupBy(u => u.CpfLimpo)
                    .ToDictionary(g => g.Key, g => g.First());

                // Montar DTOs
                var users = pessoas.Select(pf =>
                {
                    var col = colaboradores.FirstOrDefault(c => c.PessoaFisicaId == pf.Id);
                    var cpfLimpo = pf.Cpf?.Replace(".", "").Replace("-", "").Replace(" ", "") ?? "";
                    systemUsersByCpf.TryGetValue(cpfLimpo, out var sysUser);

                    return MapToDTO(pf, col, sysUser);
                }).ToList();

                var totalPages = (int)Math.Ceiling((double)total / limit);

                return Ok(new ColaboradorFrademaPagedResponse
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
                Console.WriteLine($"[ColaboradorFradema] List error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao listar colaboradores: {ex.Message}" });
            }
        }

        // ── GET /api/ColaboradorFradema/search?search=... ───────────────────
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? search)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(search))
                {
                    return Ok(new { success = true, colaboradores = Array.Empty<object>() });
                }

                var termo = search.Trim().ToLower();
                var termoLimpo = search.Replace(".", "").Replace("-", "").Replace(" ", "");

                var pessoas = await _context.PessoasFisicasFradema
                    .Where(pf =>
                        (pf.Nome != null && pf.Nome.ToLower().Contains(termo)) ||
                        (pf.Cpf != null && pf.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "").Contains(termoLimpo)) ||
                        (pf.EmailEmpresarial != null && pf.EmailEmpresarial.ToLower().Contains(termo)))
                    .OrderBy(pf => pf.Nome)
                    .Take(50)
                    .ToListAsync();

                var pfIds = pessoas.Select(p => p.Id).ToList();

                var colaboradores = await _context.ColaboradoresFradema
                    .Where(c => pfIds.Contains(c.PessoaFisicaId))
                    .ToListAsync();

                var cpfsLimpos = pessoas
                    .Where(p => p.Cpf != null)
                    .Select(p => p.Cpf!.Replace(".", "").Replace("-", "").Replace(" ", ""))
                    .ToList();

                var systemUsers = await _context.Database
                    .SqlQueryRaw<SystemUserMatch>(@"
                        SELECT 
                            REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') AS CpfLimpo,
                            id AS UserId,
                            role AS Role
                        FROM users 
                        WHERE deleted_at IS NULL 
                        AND cpf IS NOT NULL 
                        AND cpf <> ''")
                    .ToListAsync();

                var systemUsersByCpf = systemUsers
                    .GroupBy(u => u.CpfLimpo)
                    .ToDictionary(g => g.Key, g => g.First());

                var result = pessoas.Select(pf =>
                {
                    var col = colaboradores.FirstOrDefault(c => c.PessoaFisicaId == pf.Id);
                    var cpfLimpo = pf.Cpf?.Replace(".", "").Replace("-", "").Replace(" ", "") ?? "";
                    systemUsersByCpf.TryGetValue(cpfLimpo, out var sysUser);
                    return MapToDTO(pf, col, sysUser);
                }).ToList();

                return Ok(new { success = true, colaboradores = result });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ColaboradorFradema] Search error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar colaboradores: {ex.Message}" });
            }
        }

        // ── GET /api/ColaboradorFradema/filiais ─────────────────────────────
        [HttpGet("filiais")]
        public async Task<IActionResult> GetFiliais()
        {
            try
            {
                var filiais = await _context.ColaboradoresFradema
                    .Where(c => c.Filial != null && c.Filial != "")
                    .Select(c => c.Filial!)
                    .Distinct()
                    .OrderBy(f => f)
                    .ToListAsync();

                return Ok(new { success = true, filiais });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ColaboradorFradema] GetFiliais error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar filiais: {ex.Message}" });
            }
        }

        // ── GET /api/ColaboradorFradema/empresas ────────────────────────────
        [HttpGet("empresas")]
        public async Task<IActionResult> GetEmpresas()
        {
            try
            {
                var empresas = await _context.ColaboradoresFradema
                    .Where(c => c.Empresa != null && c.Empresa != "")
                    .Select(c => c.Empresa!)
                    .Distinct()
                    .OrderBy(e => e)
                    .ToListAsync();

                return Ok(new { success = true, empresas });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ColaboradorFradema] GetEmpresas error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar empresas: {ex.Message}" });
            }
        }

        // ── GET /api/ColaboradorFradema/stats ───────────────────────────────
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalPessoas = await _context.PessoasFisicasFradema.CountAsync();
                var totalColaboradores = await _context.ColaboradoresFradema.CountAsync();
                var colaboradoresAtivos = await _context.ColaboradoresFradema.CountAsync(c => c.Ativo == true);

                // Contar system users e admins da tabela users (frappyou)
                var totalSystemUsers = await _context.Database
                    .SqlQueryRaw<int>("SELECT COUNT(1) AS Value FROM users WHERE deleted_at IS NULL")
                    .FirstOrDefaultAsync();

                var totalAdmins = await _context.Database
                    .SqlQueryRaw<int>("SELECT COUNT(1) AS Value FROM users WHERE deleted_at IS NULL AND role = 'admin'")
                    .FirstOrDefaultAsync();

                return Ok(new
                {
                    success = true,
                    stats = new ColaboradorFrademaStatsDTO
                    {
                        TotalPessoas = totalPessoas,
                        TotalColaboradores = totalColaboradores,
                        ColaboradoresAtivos = colaboradoresAtivos,
                        TotalSystemUsers = totalSystemUsers,
                        TotalAdmins = totalAdmins
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ColaboradorFradema] GetStats error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar estatísticas: {ex.Message}" });
            }
        }

        // ── GET /api/ColaboradorFradema/{id} ────────────────────────────────
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var pf = await _context.PessoasFisicasFradema.FindAsync(id);
                if (pf == null)
                {
                    return NotFound(new { success = false, message = "Colaborador não encontrado" });
                }

                var col = await _context.ColaboradoresFradema
                    .FirstOrDefaultAsync(c => c.PessoaFisicaId == id);

                SystemUserMatch? sysUser = null;
                if (pf.Cpf != null)
                {
                    var cpfLimpo = pf.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "");
                    sysUser = await _context.Database
                        .SqlQueryRaw<SystemUserMatch>(@"
                            SELECT TOP 1
                                REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') AS CpfLimpo,
                                id AS UserId,
                                role AS Role
                            FROM users 
                            WHERE deleted_at IS NULL 
                            AND REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = {0}", cpfLimpo)
                        .FirstOrDefaultAsync();
                }

                var profile = MapToDTO(pf, col, sysUser);

                return Ok(new { success = true, profile });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ColaboradorFradema] GetById error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao buscar colaborador: {ex.Message}" });
            }
        }

        // ── PUT /api/ColaboradorFradema/{id} ────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateColaboradorFrademaDTO dto)
        {
            try
            {
                var pf = await _context.PessoasFisicasFradema.FindAsync(id);
                if (pf == null)
                {
                    return NotFound(new { success = false, message = "Colaborador não encontrado" });
                }

                // Atualizar campos de PessoaFisicaFradema
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

                // Atualizar campos de ColaboradorFradema
                if (dto.Cargo != null || dto.Empresa != null || dto.Filial != null || dto.Ativo != null)
                {
                    var col = await _context.ColaboradoresFradema
                        .FirstOrDefaultAsync(c => c.PessoaFisicaId == id);

                    if (col != null)
                    {
                        if (dto.Cargo != null) col.Cargo = dto.Cargo;
                        if (dto.Empresa != null) col.Empresa = dto.Empresa;
                        if (dto.Filial != null) col.Filial = dto.Filial;
                        if (dto.Ativo != null) col.Ativo = dto.Ativo;
                        col.DataAtualizacao = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Colaborador atualizado com sucesso" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ColaboradorFradema] Update error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Erro ao atualizar colaborador: {ex.Message}" });
            }
        }

        // ── Helpers ─────────────────────────────────────────────────────────

        private static ColaboradorFrademaListDTO MapToDTO(
            PessoaFisicaFradema pf,
            ColaboradorFradema? col,
            SystemUserMatch? sysUser)
        {
            var dataNasc = pf.DataNascimento?.ToString("yyyy-MM-dd");
            var dataAdm = col?.DataAdmissao?.ToString("yyyy-MM-dd");

            return new ColaboradorFrademaListDTO
            {
                Id = $"pf-{pf.Id}",
                ColaboradorId = pf.Id,
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
                Cargo = col?.Cargo,
                Position = col?.Cargo,
                Empresa = col?.Empresa,
                Company = col?.Empresa,
                Filial = col?.Filial,
                Ativo = col?.Ativo,
                DataAdmissao = dataAdm,
                HireDate = dataAdm,
                HasSystemUser = sysUser != null,
                SystemUserId = sysUser?.UserId,
                Role = sysUser?.Role ?? "colaborador",
                CreatedAt = pf.DataCadastro
            };
        }
    }

    /// <summary>
    /// Helper class for raw SQL query results matching users table CPF.
    /// </summary>
    public class SystemUserMatch
    {
        public string CpfLimpo { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
