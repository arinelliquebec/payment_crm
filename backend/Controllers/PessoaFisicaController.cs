using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using CrmArrighi.Utils;
using System.Linq;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PessoaFisicaController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;

        public PessoaFisicaController(CrmArrighiContext context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }


        // GET: api/PessoaFisica/cep/{cep} - Consulta CEP
        [HttpGet("cep/{cep}")]
        public async Task<ActionResult<object>> GetCepInfo(string cep)
        {
            try
            {
                var cepInfo = await CepValidator.GetCepInfoAsync(cep);
                if (cepInfo == null)
                {
                    return NotFound(new { message = "CEP não encontrado" });
                }

                return Ok(cepInfo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetCepInfo: Erro: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao consultar CEP" });
            }
        }

        // GET: api/PessoaFisica
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaFisicaListDTO>>> GetPessoasFisicas()
        {
            try
            {
                Console.WriteLine("🔍 GetPessoasFisicas: Buscando pessoas físicas no banco de dados");

                // Buscar todas as pessoas físicas com endereços
                var todasPessoas = await _context.PessoasFisicas
                    .Include(p => p.Endereco)
                    .OrderBy(p => p.Nome)
                    .ToListAsync();

                // Buscar vínculos de cada pessoa
                var pessoasIds = todasPessoas.Select(p => p.Id).ToList();

                // Buscar vínculos de cliente
                var clientesIds = await _context.Clientes
                    .Where(c => c.PessoaFisicaId != null && pessoasIds.Contains(c.PessoaFisicaId.Value))
                    .Select(c => c.PessoaFisicaId.Value)
                    .ToListAsync();

                // Buscar vínculos de consultor
                var consultoresIds = await _context.Consultores
                    .Where(c => pessoasIds.Contains(c.PessoaFisicaId))
                    .Select(c => c.PessoaFisicaId)
                    .ToListAsync();

                // Buscar vínculos de usuário
                var usuariosIds = await _context.Usuarios
                    .Where(u => u.PessoaFisicaId != null && pessoasIds.Contains(u.PessoaFisicaId.Value))
                    .Select(u => u.PessoaFisicaId.Value)
                    .ToListAsync();

                // Buscar vínculos de responsável técnico
                var responsaveisIds = await _context.PessoasJuridicas
                    .Where(pj => pessoasIds.Contains(pj.ResponsavelTecnicoId))
                    .Select(pj => pj.ResponsavelTecnicoId)
                    .ToListAsync();

                // Montar DTOs com tipos
                var pessoasComTipos = todasPessoas.Select(p => {
                    var tipos = new List<string>();

                    if (clientesIds.Contains(p.Id))
                        tipos.Add("Cliente");

                    if (consultoresIds.Contains(p.Id))
                        tipos.Add("Consultor");

                    if (usuariosIds.Contains(p.Id))
                        tipos.Add("Usuário");

                    if (responsaveisIds.Contains(p.Id))
                        tipos.Add("Resp. Técnico");

                    return new PessoaFisicaListDTO
                    {
                        Id = p.Id,
                        Nome = p.Nome,
                        EmailEmpresarial = p.EmailEmpresarial,
                        EmailPessoal = p.EmailPessoal,
                        Codinome = p.Codinome,
                        Sexo = p.Sexo,
                        DataNascimento = p.DataNascimento,
                        EstadoCivil = p.EstadoCivil,
                        Cpf = p.Cpf,
                        Rg = p.Rg,
                        Cnh = p.Cnh,
                        Telefone1 = p.Telefone1,
                        Telefone2 = p.Telefone2,
                        EnderecoId = p.EnderecoId,
                        Endereco = p.Endereco,
                        DataCadastro = p.DataCadastro,
                        DataAtualizacao = p.DataAtualizacao,
                        Tipos = tipos
                    };
                }).ToList();

                Console.WriteLine($"✅ GetPessoasFisicas: Retornando {pessoasComTipos.Count} pessoas físicas com tipos e endereços");
                return Ok(pessoasComTipos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetPessoasFisicas: ERRO ao acessar banco SQL Server Azure: {ex.Message}");
                Console.WriteLine($"❌ GetPessoasFisicas: Connection String: {_context.Database.GetConnectionString()}");
                return StatusCode(500, $"Erro ao conectar com banco SQL Server Azure: {ex.Message}");
            }
        }

        // GET: api/PessoaFisica/buscar?termo=xxx&limit=10
        // GET: api/PessoaFisica/count - Contar total de pessoas físicas
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetPessoasFisicasCount()
        {
            try
            {
                var count = await _context.PessoasFisicas.CountAsync();
                Console.WriteLine($"📊 GetPessoasFisicasCount: Total de {count} pessoas físicas");
                return Ok(count);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetPessoasFisicasCount: Erro: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao contar pessoas físicas" });
            }
        }

        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<PessoaFisicaListDTO>>> BuscarPessoasFisicas([FromQuery] string? termo, [FromQuery] int limit = 50)
        {
            try
            {
                Console.WriteLine($"🔍 BuscarPessoasFisicas: Buscando com termo: {termo}, limit: {limit}");

                IQueryable<PessoaFisica> query = _context.PessoasFisicas;

                // Se houver termo de busca, aplicar filtros
                if (!string.IsNullOrWhiteSpace(termo))
                {
                    var termoLower = termo.ToLower().Trim();
                    var termoLimpo = termo.Replace(".", "").Replace("-", "").Replace(" ", "");

                    query = query.Where(p =>
                        (p.Nome != null && p.Nome.ToLower().Contains(termoLower)) ||
                        (p.EmailEmpresarial != null && p.EmailEmpresarial.ToLower().Contains(termoLower)) ||
                        (p.EmailPessoal != null && p.EmailPessoal.ToLower().Contains(termoLower)) ||
                        (p.Cpf != null && p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "").Contains(termoLimpo))
                    );
                }

                // Ordenar PRIMEIRO (usa índice), depois limitar para performance
                var pessoas = await query
                    .Include(p => p.Endereco)
                    .OrderBy(p => p.Nome)
                    .Take(limit)
                    .ToListAsync();

                // Buscar vínculos de cada pessoa
                var pessoasIds = pessoas.Select(p => p.Id).ToList();

                // Buscar vínculos de cliente
                var clientesIds = await _context.Clientes
                    .Where(c => c.PessoaFisicaId != null && pessoasIds.Contains(c.PessoaFisicaId.Value))
                    .Select(c => c.PessoaFisicaId.Value)
                    .ToListAsync();

                // Buscar vínculos de consultor
                var consultoresIds = await _context.Consultores
                    .Where(c => pessoasIds.Contains(c.PessoaFisicaId))
                    .Select(c => c.PessoaFisicaId)
                    .ToListAsync();

                // Buscar vínculos de usuário
                var usuariosIds = await _context.Usuarios
                    .Where(u => u.PessoaFisicaId != null && pessoasIds.Contains(u.PessoaFisicaId.Value))
                    .Select(u => u.PessoaFisicaId.Value)
                    .ToListAsync();

                // Buscar vínculos de responsável técnico
                var responsaveisIds = await _context.PessoasJuridicas
                    .Where(pj => pessoasIds.Contains(pj.ResponsavelTecnicoId))
                    .Select(pj => pj.ResponsavelTecnicoId)
                    .ToListAsync();

                // Montar DTOs com tipos
                var pessoasComTipos = pessoas.Select(p => {
                    var tipos = new List<string>();

                    if (clientesIds.Contains(p.Id))
                        tipos.Add("Cliente");

                    if (consultoresIds.Contains(p.Id))
                        tipos.Add("Consultor");

                    if (usuariosIds.Contains(p.Id))
                        tipos.Add("Usuário");

                    if (responsaveisIds.Contains(p.Id))
                        tipos.Add("Resp. Técnico");

                    return new PessoaFisicaListDTO
                    {
                        Id = p.Id,
                        Nome = p.Nome,
                        EmailEmpresarial = p.EmailEmpresarial,
                        EmailPessoal = p.EmailPessoal,
                        Codinome = p.Codinome,
                        Sexo = p.Sexo,
                        DataNascimento = p.DataNascimento,
                        EstadoCivil = p.EstadoCivil,
                        Cpf = p.Cpf,
                        Rg = p.Rg,
                        Cnh = p.Cnh,
                        Telefone1 = p.Telefone1,
                        Telefone2 = p.Telefone2,
                        EnderecoId = p.EnderecoId,
                        Endereco = p.Endereco,
                        DataCadastro = p.DataCadastro,
                        DataAtualizacao = p.DataAtualizacao,
                        Tipos = tipos
                    };
                }).ToList();

                Console.WriteLine($"✅ BuscarPessoasFisicas: Encontradas {pessoasComTipos.Count} pessoas com tipos e endereços");
                return Ok(pessoasComTipos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ BuscarPessoasFisicas: Erro: {ex.Message}");
                return StatusCode(500, $"Erro ao buscar pessoas físicas: {ex.Message}");
            }
        }

        // GET: api/PessoaFisica/buscar-por-cpf/{cpf}
        [HttpGet("buscar-por-cpf/{cpf}")]
        public async Task<ActionResult<PessoaFisica>> GetPessoaFisicaPorCpf(string cpf)
        {
            try
            {
                Console.WriteLine($"🔍 GetPessoaFisicaPorCpf: Buscando pessoa física com CPF: {cpf}");

                // Garantir que as colunas EmailEmpresarial e EmailPessoal existem
                await EnsureEmailColumnsExist();

                // Remover caracteres especiais do CPF para busca
                var cpfLimpo = cpf.Replace(".", "").Replace("-", "").Replace(" ", "");
                Console.WriteLine($"🔍 GetPessoaFisicaPorCpf: CPF limpo: {cpfLimpo}");

                var pessoaFisica = await _context.PessoasFisicas
                    .Include(p => p.Endereco)
                    .FirstOrDefaultAsync(p => p.Cpf != null && p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);

                if (pessoaFisica == null)
                {
                    Console.WriteLine($"❌ GetPessoaFisicaPorCpf: Pessoa física com CPF {cpf} não encontrada");
                    return NotFound($"Pessoa física com CPF {cpf} não encontrada");
                }

                Console.WriteLine($"✅ GetPessoaFisicaPorCpf: Pessoa física encontrada: {pessoaFisica.Nome}");
                return pessoaFisica;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetPessoaFisicaPorCpf: Erro: {ex.Message}");
                Console.WriteLine($"❌ GetPessoaFisicaPorCpf: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/PessoaFisica/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<PessoaFisica>> GetPessoaFisica(int id)
        {
            var pessoaFisica = await _context.PessoasFisicas
                .Include(p => p.Endereco)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (pessoaFisica == null)
            {
                return NotFound();
            }

            return pessoaFisica;
        }

        // GET: api/PessoaFisica/responsaveis-tecnicos
        [HttpGet("responsaveis-tecnicos")]
        public async Task<ActionResult<IEnumerable<object>>> GetResponsaveisTecnicos()
        {
            try
            {
                Console.WriteLine("🔍 GetResponsaveisTecnicos: Buscando responsáveis técnicos");

                // Garantir que as colunas EmailEmpresarial e EmailPessoal existem
                await EnsureEmailColumnsExist();

                var responsaveis = await _context.PessoasFisicas
                    .Include(p => p.Endereco)
                    .Select(p => new {
                        p.Id,
                        p.Nome,
                        p.Cpf,
                        p.EmailEmpresarial,
                        p.EmailPessoal,
                        p.Sexo,
                        p.DataNascimento,
                        p.EstadoCivil,
                        p.Telefone1,
                        p.Telefone2,
                        p.EnderecoId,
                        Endereco = p.Endereco != null ? new {
                            p.Endereco.Id,
                            p.Endereco.Cidade,
                            p.Endereco.Bairro,
                            p.Endereco.Logradouro,
                            p.Endereco.Cep,
                            p.Endereco.Numero,
                            p.Endereco.Complemento
                        } : null
                    })
                    .ToListAsync();

                Console.WriteLine($"✅ GetResponsaveisTecnicos: Encontrados {responsaveis.Count} responsáveis técnicos");
                return responsaveis;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetResponsaveisTecnicos: Erro: {ex.Message}");
                Console.WriteLine($"❌ GetResponsaveisTecnicos: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/PessoaFisica
        [HttpPost]
        public async Task<ActionResult<PessoaFisica>> PostPessoaFisica(CreatePessoaFisicaDTO dto)
        {
            try
            {
                Console.WriteLine($"🔍 PostPessoaFisica: Iniciando criação de pessoa física");
                Console.WriteLine($"🔍 PostPessoaFisica: Nome: {dto.Nome}, CPF: {dto.Cpf}");

                // Garantir que as colunas EmailEmpresarial e EmailPessoal existem
                await EnsureEmailColumnsExist();

                // Garantir que colunas opcionais estejam configuradas como NULL no banco (produção legado)
                await EnsurePessoaFisicaOptionalColumnsAreNullable();

                // Sanitizar dados de entrada
                PessoaFisicaValidationService.SanitizeData(dto);

                // Validação robusta dos dados
                var validationResult = PessoaFisicaValidationService.ValidateCreatePessoaFisica(dto);
                if (!validationResult.IsValid)
                {
                    var response = new
                    {
                        message = "Dados inválidos",
                        errors = validationResult.Errors,
                        fieldErrors = validationResult.FieldErrors
                    };
                    return BadRequest(response);
                }

                // Normalizar CPF para comparações (apenas dígitos) - fora do EF
                var cpfLimpo = CpfValidator.Clean(dto.Cpf);

                // Verificações de unicidade amigáveis antes de salvar (evita 500)
                var cpfJaExiste = await _context.PessoasFisicas
                    .AnyAsync(p => p.Cpf != null &&
                        p.Cpf.Replace(".", string.Empty)
                             .Replace("-", string.Empty)
                             .Replace(" ", string.Empty) == cpfLimpo);

                if (cpfJaExiste)
                {
                    return Conflict(new { message = "CPF já cadastrado.", field = "cpf" });
                }

                var emailJaExiste = await _context.PessoasFisicas
                    .AnyAsync(p => p.EmailEmpresarial == EmailValidator.Normalize(dto.EmailEmpresarial));
                if (emailJaExiste)
                {
                    return Conflict(new { message = "E-mail empresarial já cadastrado.", field = "emailEmpresarial" });
                }

                if (ModelState.IsValid)
                {
                    // Criar o endereço primeiro
                    var endereco = new Endereco
                {
                    Cidade = dto.Endereco.Cidade,
                    Estado = dto.Endereco.Estado,
                    Bairro = dto.Endereco.Bairro,
                    Logradouro = dto.Endereco.Logradouro,
                    Cep = dto.Endereco.Cep,
                    Numero = dto.Endereco.Numero,
                    Complemento = dto.Endereco.Complemento
                };

                _context.Enderecos.Add(endereco);
                await _context.SaveChangesAsync();

                // Criar a pessoa física
                var pessoaFisica = new PessoaFisica
                {
                    Nome = dto.Nome,
                    EmailEmpresarial = dto.EmailEmpresarial,
                    EmailPessoal = dto.EmailPessoal,
                    Codinome = dto.Codinome,
                    Sexo = dto.Sexo,
                    DataNascimento = dto.DataNascimento,
                    EstadoCivil = dto.EstadoCivil,
                    // Preserva o formato recebido, mas já validamos/normalizamos para comparação acima
                    Cpf = dto.Cpf,
                    Rg = dto.Rg,
                    Cnh = dto.Cnh,
                    Telefone1 = dto.Telefone1,
                    Telefone2 = dto.Telefone2,
                    EnderecoId = endereco.Id
                };

                    _context.PessoasFisicas.Add(pessoaFisica);
                    await _context.SaveChangesAsync();

                    // Carregar o endereço para retornar
                    pessoaFisica.Endereco = endereco;

                    Console.WriteLine($"✅ PostPessoaFisica: Pessoa física criada com sucesso. ID: {pessoaFisica.Id}");
                    return CreatedAtAction(nameof(GetPessoaFisica), new { id = pessoaFisica.Id }, pessoaFisica);
                }

                Console.WriteLine($"❌ PostPessoaFisica: ModelState inválido");
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ PostPessoaFisica: Erro: {ex.Message}");
                Console.WriteLine($"❌ PostPessoaFisica: StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"❌ PostPessoaFisica: InnerException: {ex.InnerException.Message}");
                }
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/PessoaFisica/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPessoaFisica(int id, PessoaFisica pessoaFisica)
        {
            if (id != pessoaFisica.Id)
            {
                return BadRequest();
            }

            // Garantir que as colunas EmailEmpresarial e EmailPessoal existem
            await EnsureEmailColumnsExist();

            if (ModelState.IsValid)
            {
                try
                {
                    pessoaFisica.DataAtualizacao = DateTime.UtcNow;
                    _context.Update(pessoaFisica);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PessoaFisicaExists(pessoaFisica.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return NoContent();
            }

            return BadRequest(ModelState);
        }

        // GET: api/PessoaFisica/debug-dependencies/5
        [HttpGet("debug-dependencies/{id}")]
        public async Task<IActionResult> DebugDependencies(int id)
        {
            var pessoaFisica = await _context.PessoasFisicas.FindAsync(id);
            if (pessoaFisica == null)
            {
                return NotFound();
            }

            var dependencies = new
            {
                PersonId = id,
                PersonName = pessoaFisica.Nome,
                IsResponsavelTecnico = await _context.PessoasJuridicas
                    .AnyAsync(pj => pj.ResponsavelTecnicoId == id),
                ResponsaveisTecnicosCount = await _context.PessoasJuridicas
                    .CountAsync(pj => pj.ResponsavelTecnicoId == id),
                IsVinculadaACliente = await _context.Clientes
                    .AnyAsync(c => c.PessoaFisicaId == id),
                ClientesCount = await _context.Clientes
                    .CountAsync(c => c.PessoaFisicaId == id),
                IsVinculadaAConsultor = await _context.Consultores
                    .AnyAsync(c => c.PessoaFisicaId == id),
                ConsultoresCount = await _context.Consultores
                    .CountAsync(c => c.PessoaFisicaId == id),
                IsVinculadaAUsuario = await _context.Usuarios
                    .AnyAsync(u => u.PessoaFisicaId == id),
                UsuariosCount = await _context.Usuarios
                    .CountAsync(u => u.PessoaFisicaId == id),
                ConsultoresDetalhes = await _context.Consultores
                    .Where(c => c.PessoaFisicaId == id)
                    .Select(c => new { c.Id, c.OAB, c.FilialId })
                    .ToListAsync()
            };

            return Ok(dependencies);
        }

        // DELETE: api/PessoaFisica/force-delete/5
        [HttpDelete("force-delete/{id}")]
        public async Task<IActionResult> ForceDeletePessoaFisica(int id)
        {
            var pessoaFisica = await _context.PessoasFisicas.FindAsync(id);
            if (pessoaFisica == null)
            {
                return NotFound();
            }

            // Remover todas as dependências antes de excluir
            // Remover consultores vinculados
            var consultores = await _context.Consultores
                .Where(c => c.PessoaFisicaId == id)
                .ToListAsync();
            _context.Consultores.RemoveRange(consultores);

            // Remover usuários vinculados
            var usuarios = await _context.Usuarios
                .Where(u => u.PessoaFisicaId == id)
                .ToListAsync();
            _context.Usuarios.RemoveRange(usuarios);

            // Remover clientes vinculados
            var clientes = await _context.Clientes
                .Where(c => c.PessoaFisicaId == id)
                .ToListAsync();
            _context.Clientes.RemoveRange(clientes);

            // Remover pessoas jurídicas que têm esta pessoa como responsável técnico
            var pessoasJuridicas = await _context.PessoasJuridicas
                .Where(pj => pj.ResponsavelTecnicoId == id)
                .ToListAsync();
            _context.PessoasJuridicas.RemoveRange(pessoasJuridicas);

            // Finalmente excluir a pessoa física
            _context.PessoasFisicas.Remove(pessoaFisica);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pessoa física e todas as dependências foram removidas com sucesso." });
        }

        // DELETE: api/PessoaFisica/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePessoaFisica(int id)
        {
            var pessoaFisica = await _context.PessoasFisicas.FindAsync(id);
            if (pessoaFisica == null)
            {
                return NotFound();
            }

            // Verificar se a pessoa física é responsável técnico de alguma pessoa jurídica
            var isResponsavelTecnico = await _context.PessoasJuridicas
                .AnyAsync(pj => pj.ResponsavelTecnicoId == id);

            if (isResponsavelTecnico)
            {
                return BadRequest("Não é possível excluir esta pessoa física pois ela é responsável técnico de uma ou mais pessoas jurídicas.");
            }

            // Verificar se a pessoa física está vinculada a algum cliente
            var isVinculadaACliente = await _context.Clientes
                .AnyAsync(c => c.PessoaFisicaId == id);

            if (isVinculadaACliente)
            {
                return BadRequest("Não é possível excluir esta pessoa física pois ela está vinculada a um ou mais clientes.");
            }

            // Verificar se a pessoa física está vinculada a algum consultor
            var isVinculadaAConsultor = await _context.Consultores
                .AnyAsync(c => c.PessoaFisicaId == id);

            if (isVinculadaAConsultor)
            {
                return BadRequest("Não é possível excluir esta pessoa física pois ela está vinculada a um ou mais consultores.");
            }

            // Verificar se a pessoa física está vinculada a algum usuário
            var isVinculadaAUsuario = await _context.Usuarios
                .AnyAsync(u => u.PessoaFisicaId == id);

            if (isVinculadaAUsuario)
            {
                return BadRequest("Não é possível excluir esta pessoa física pois ela está vinculada a um ou mais usuários.");
            }

            _context.PessoasFisicas.Remove(pessoaFisica);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/PessoaFisica/admin/migrate-email-columns
        [HttpPost("admin/migrate-email-columns")]
        public async Task<IActionResult> MigrateEmailColumns()
        {
            try
            {
                Console.WriteLine("🔧 MigrateEmailColumns: Iniciando migração de colunas de email para PessoasFisicas");

                // Garantir que as colunas EmailEmpresarial e EmailPessoal existem
                await EnsureEmailColumnsExist();

                return Ok(new { message = "Migração de colunas de email concluída com sucesso" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ MigrateEmailColumns: Erro durante migração: {ex.Message}");
                return StatusCode(500, $"Erro durante migração: {ex.Message}");
            }
        }

        private bool PessoaFisicaExists(int id)
        {
            return _context.PessoasFisicas.Any(e => e.Id == id);
        }

        private async Task EnsureEmailColumnsExist()
        {
            try
            {
                Console.WriteLine("🔧 EnsureEmailColumnsExist: Verificando se colunas EmailEmpresarial e EmailPessoal existem na tabela PessoasFisicas");

                // Verificar estrutura atual da tabela
                var tableStructure = await _context.Database
                    .SqlQueryRaw<string>(@"
                        SELECT COLUMN_NAME
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'PessoasFisicas'
                        ORDER BY ORDINAL_POSITION")
                    .ToListAsync();

                Console.WriteLine($"🔍 EnsureEmailColumnsExist: Colunas atuais na tabela: {string.Join(", ", tableStructure)}");

                bool emailExists = tableStructure.Contains("Email");
                bool emailEmpresarialExists = tableStructure.Contains("EmailEmpresarial");
                bool emailPessoalExists = tableStructure.Contains("EmailPessoal");

                // Cenário 1: Só existe Email (precisa renomear)
                if (emailExists && !emailEmpresarialExists)
                {
                    Console.WriteLine("➕ EnsureEmailColumnsExist: Renomeando coluna Email para EmailEmpresarial");
                    try
                    {
                        await _context.Database.ExecuteSqlRawAsync("EXEC sp_rename 'PessoasFisicas.Email', 'EmailEmpresarial', 'COLUMN'");
                        Console.WriteLine("✅ EnsureEmailColumnsExist: Coluna Email renomeada para EmailEmpresarial com sucesso");
                        emailEmpresarialExists = true;
                    }
                    catch (Exception renameEx)
                    {
                        Console.WriteLine($"⚠️ EnsureEmailColumnsExist: Erro ao renomear coluna Email: {renameEx.Message}");
                        // Se não conseguir renomear, tentar criar EmailEmpresarial
                        if (!emailEmpresarialExists)
                        {
                            await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ADD EmailEmpresarial NVARCHAR(150) NOT NULL DEFAULT ''");
                            Console.WriteLine("✅ EnsureEmailColumnsExist: Coluna EmailEmpresarial criada como alternativa");
                            emailEmpresarialExists = true;
                        }
                    }
                }
                // Cenário 2: EmailEmpresarial não existe (criar)
                else if (!emailEmpresarialExists)
                {
                    Console.WriteLine("➕ EnsureEmailColumnsExist: Criando coluna EmailEmpresarial");
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ADD EmailEmpresarial NVARCHAR(150) NOT NULL DEFAULT ''");
                    Console.WriteLine("✅ EnsureEmailColumnsExist: Coluna EmailEmpresarial criada com sucesso");
                    emailEmpresarialExists = true;
                }
                else
                {
                    Console.WriteLine("ℹ️ EnsureEmailColumnsExist: Coluna EmailEmpresarial já existe");
                }

                // Criar coluna EmailPessoal se não existir
                if (!emailPessoalExists)
                {
                    Console.WriteLine("➕ EnsureEmailColumnsExist: Criando coluna EmailPessoal");
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ADD EmailPessoal NVARCHAR(150) NULL");
                    Console.WriteLine("✅ EnsureEmailColumnsExist: Coluna EmailPessoal criada com sucesso");
                }
                else
                {
                    Console.WriteLine("ℹ️ EnsureEmailColumnsExist: Coluna EmailPessoal já existe");
                }

                Console.WriteLine("✅ EnsureEmailColumnsExist: Verificação de colunas de email concluída");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ EnsureEmailColumnsExist: Erro geral: {ex.Message}");
                Console.WriteLine($"❌ EnsureEmailColumnsExist: StackTrace: {ex.StackTrace}");
                // Não propagar o erro para não quebrar a aplicação
                // O sistema deve funcionar mesmo se as colunas não puderem ser criadas
            }
        }

        // Ajusta colunas legadas que eram NOT NULL para aceitarem NULL conforme o modelo atual
        private async Task EnsurePessoaFisicaOptionalColumnsAreNullable()
        {
            try
            {
                var columns = await _context.Database
                    .SqlQueryRaw<(string ColumnName, string IsNullable, string DataType)>(@"
                        SELECT COLUMN_NAME as ColumnName, IS_NULLABLE as IsNullable, DATA_TYPE as DataType
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'PessoasFisicas' AND COLUMN_NAME IN ('Sexo','DataNascimento','EstadoCivil','Telefone1')")
                    .ToListAsync();

                foreach (var col in columns)
                {
                    if (col.ColumnName == "DataNascimento" && col.IsNullable == "NO")
                    {
                        Console.WriteLine("🔧 Ajustando PessoasFisicas.DataNascimento para permitir NULL");
                        await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ALTER COLUMN DataNascimento datetime2 NULL");
                    }
                    else if (col.ColumnName == "Sexo" && col.IsNullable == "NO")
                    {
                        Console.WriteLine("🔧 Ajustando PessoasFisicas.Sexo para permitir NULL");
                        await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ALTER COLUMN Sexo nvarchar(max) NULL");
                    }
                    else if (col.ColumnName == "EstadoCivil" && col.IsNullable == "NO")
                    {
                        Console.WriteLine("🔧 Ajustando PessoasFisicas.EstadoCivil para permitir NULL");
                        await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ALTER COLUMN EstadoCivil nvarchar(max) NULL");
                    }
                    else if (col.ColumnName == "Telefone1" && col.IsNullable == "NO")
                    {
                        Console.WriteLine("🔧 Ajustando PessoasFisicas.Telefone1 para permitir NULL");
                        await _context.Database.ExecuteSqlRawAsync("ALTER TABLE PessoasFisicas ALTER COLUMN Telefone1 nvarchar(15) NULL");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ EnsurePessoaFisicaOptionalColumnsAreNullable: {ex.Message}");
            }
        }
    }
}
