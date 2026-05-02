using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public UsuarioController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Usuario/count - Contar total de usuários
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetUsuariosCount()
        {
            try
            {
                var count = await _context.Usuarios.CountAsync();
                Console.WriteLine($"📊 GetUsuariosCount: Total de {count} usuários");
                return Ok(count);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetUsuariosCount: Erro: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao contar usuários" });
            }
        }

        // GET: api/Usuario
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
        {
            return await _context.Usuarios
                .Include(u => u.PessoaFisica)
                .Include(u => u.PessoaJuridica)
                .Include(u => u.GrupoAcesso)
                .Include(u => u.Filial)
                .Include(u => u.Consultor)
                .ToListAsync();
        }

        // GET: api/Usuario/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Usuario>> GetUsuario(int id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.PessoaFisica)
                .Include(u => u.PessoaJuridica)
                .Include(u => u.GrupoAcesso)
                .Include(u => u.Filial)
                .Include(u => u.Consultor)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null)
            {
                return NotFound(new {
                    recurso = "Usuario",
                    id = id,
                    mensagem = $"Usuario #{id} nao foi encontrado"
                });
            }

            return usuario;
        }

        // GET: api/Usuario/pessoas-fisicas
        [HttpGet("pessoas-fisicas")]
        public async Task<ActionResult<IEnumerable<object>>> GetPessoasFisicasParaUsuario()
        {
            var pessoasFisicas = await _context.PessoasFisicas
                .OrderBy(p => p.Nome)
                .Select(p => new { p.Id, p.Nome, p.Cpf, Email = p.EmailPessoal ?? p.EmailEmpresarial })
                .ToListAsync();

            return pessoasFisicas;
        }

        // GET: api/Usuario/pessoas-juridicas
        [HttpGet("pessoas-juridicas")]
        public async Task<ActionResult<IEnumerable<object>>> GetPessoasJuridicasParaUsuario()
        {
            var pessoasJuridicas = await _context.PessoasJuridicas
                .OrderBy(p => p.RazaoSocial)
                .Select(p => new { p.Id, p.RazaoSocial, p.NomeFantasia, p.Cnpj, p.Email })
                .ToListAsync();

            return pessoasJuridicas;
        }

        // GET: api/Usuario/options/filiais
        [HttpGet("options/filiais")]
        public async Task<ActionResult<IEnumerable<object>>> GetFiliaisParaUsuario()
        {
            try
            {
                var filiais = await _context.Filiais
                    .Select(f => new { f.Id, f.Nome, Codigo = f.Nome })
                    .OrderBy(f => f.Nome)
                    .ToListAsync();

                return Ok(filiais);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao buscar filiais: {ex.Message}");
            }
        }

        // POST: api/Usuario/create (usando DTO)
        // NOTA: Este endpoint é usado para AUTO-REGISTRO de usuários
        // Por segurança, SEMPRE atribui o grupo "Usuario" (sem permissões)
        // Apenas administradores podem atribuir outros grupos após o cadastro
        [HttpPost("create")]
        public async Task<ActionResult<Usuario>> CreateUsuario(CreateUsuarioDTO createDto)
        {
            // Verificar se o login já existe
            var loginExistente = await _context.Usuarios
                .AnyAsync(u => u.Login == createDto.Login);
            if (loginExistente)
            {
                return BadRequest("Login já existe no sistema.");
            }

            // Verificar se o e-mail já existe
            var emailExistente = await _context.Usuarios
                .AnyAsync(u => u.Email == createDto.Email);
            if (emailExistente)
            {
                return BadRequest("E-mail já existe no sistema.");
            }

            // ⚠️ SEGURANÇA: SEMPRE usar grupo padrão "Usuario" no auto-registro
            // Mesmo que GrupoAcessoId seja enviado, ignoramos por segurança
            // Apenas administradores podem alterar o grupo após o cadastro
            var grupoUsuario = await _context.GruposAcesso
                .FirstOrDefaultAsync(g => g.Nome == "Usuario" && g.Ativo);

            if (grupoUsuario == null)
            {
                return BadRequest("Grupo padrão 'Usuario' não encontrado no sistema.");
            }

            int grupoAcessoId = grupoUsuario.Id;

            Console.WriteLine($"✅ Auto-registro: Usuário '{createDto.Login}' será criado com grupo 'Usuario' (ID: {grupoAcessoId}) - SEM PERMISSÕES");

            // Validar relacionamento com pessoa e obter senha se não fornecida
            string senhaFinal = createDto.Senha ?? string.Empty;

            if (createDto.TipoPessoa == "Fisica")
            {
                if (!createDto.PessoaFisicaId.HasValue)
                {
                    return BadRequest(new
                    {
                        error = "PESSOA_FISICA_OBRIGATORIA",
                        message = "Pessoa Física é obrigatória quando o tipo é 'Fisica'.",
                        details = "Para criar um usuário do tipo Pessoa Física, é necessário informar o ID da pessoa física no sistema."
                    });
                }

                var pessoaFisica = await _context.PessoasFisicas
                    .FindAsync(createDto.PessoaFisicaId.Value);
                if (pessoaFisica == null)
                {
                    Console.WriteLine($"❌ CreateUsuario: Tentativa de criar usuário com Pessoa Física ID={createDto.PessoaFisicaId.Value} não encontrada");
                    return BadRequest(new
                    {
                        error = "PESSOA_FISICA_NAO_ENCONTRADA",
                        message = "A pessoa física especificada não está cadastrada no sistema.",
                        details = "Antes de criar um usuário, é necessário primeiro cadastrar a pessoa física. Por favor, acesse o módulo de cadastro de Pessoas Físicas e complete o cadastro antes de criar o usuário.",
                        pessoaFisicaId = createDto.PessoaFisicaId.Value
                    });
                }

                // Se senha não foi fornecida, buscar senha do usuário existente da Pessoa Física
                // (Usado quando administrador cria usuário em /usuarios)
                if (string.IsNullOrWhiteSpace(createDto.Senha))
                {
                    var usuarioExistente = await _context.Usuarios
                        .Where(u => u.PessoaFisicaId == createDto.PessoaFisicaId.Value)
                        .FirstOrDefaultAsync();

                    if (usuarioExistente != null && !string.IsNullOrWhiteSpace(usuarioExistente.Senha))
                    {
                        senhaFinal = usuarioExistente.Senha;
                        Console.WriteLine($"✅ Senha reutilizada do usuário existente da Pessoa Física (ID: {pessoaFisica.Id}, CPF: {pessoaFisica.Cpf})");
                    }
                    else
                    {
                        return BadRequest("Esta pessoa física ainda não se cadastrou no sistema. Ela precisa primeiro fazer o auto-registro em /cadastro com CPF e senha.");
                    }
                }
            }
            else if (createDto.TipoPessoa == "Juridica")
            {
                if (!createDto.PessoaJuridicaId.HasValue)
                {
                    return BadRequest(new
                    {
                        error = "PESSOA_JURIDICA_OBRIGATORIA",
                        message = "Pessoa Jurídica é obrigatória quando o tipo é 'Juridica'.",
                        details = "Para criar um usuário do tipo Pessoa Jurídica, é necessário informar o ID da pessoa jurídica no sistema."
                    });
                }

                var pessoaJuridica = await _context.PessoasJuridicas
                    .FindAsync(createDto.PessoaJuridicaId.Value);
                if (pessoaJuridica == null)
                {
                    Console.WriteLine($"❌ CreateUsuario: Tentativa de criar usuário com Pessoa Jurídica ID={createDto.PessoaJuridicaId.Value} não encontrada");
                    return BadRequest(new
                    {
                        error = "PESSOA_JURIDICA_NAO_ENCONTRADA",
                        message = "A pessoa jurídica especificada não está cadastrada no sistema.",
                        details = "Antes de criar um usuário, é necessário primeiro cadastrar a pessoa jurídica. Por favor, acesse o módulo de cadastro de Pessoas Jurídicas e complete o cadastro antes de criar o usuário.",
                        pessoaJuridicaId = createDto.PessoaJuridicaId.Value
                    });
                }

                // Para Pessoa Jurídica, senha é obrigatória no formulário
                if (string.IsNullOrWhiteSpace(createDto.Senha))
                {
                    return BadRequest("Senha é obrigatória para Pessoa Jurídica.");
                }
            }
            else
            {
                return BadRequest("Tipo de pessoa deve ser 'Fisica' ou 'Juridica'.");
            }

            // Garantir que a senha seja hasheada apenas se não for já um hash BCrypt
            // (ex: reutilização de senha de usuário existente que já foi migrada)
            string senhaArmazenar = senhaFinal;
            if (!string.IsNullOrWhiteSpace(senhaFinal) && !senhaFinal.StartsWith("$2"))
            {
                senhaArmazenar = BCrypt.Net.BCrypt.HashPassword(senhaFinal);
            }

            // Criar o usuário (senha sempre hasheada com BCrypt)
            var usuario = new Usuario
            {
                Login = createDto.Login,
                Email = createDto.Email,
                Senha = senhaArmazenar,
                GrupoAcessoId = grupoAcessoId,
                TipoPessoa = createDto.TipoPessoa,
                PessoaFisicaId = createDto.PessoaFisicaId,
                PessoaJuridicaId = createDto.PessoaJuridicaId,
                FilialId = createDto.FilialId,
                ConsultorId = createDto.ConsultorId,
                Ativo = createDto.Ativo ?? true,
                DataCadastro = DateTime.UtcNow
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario);
        }

        // POST: api/Usuario
        [HttpPost]
        public async Task<ActionResult<Usuario>> PostUsuario(Usuario usuario)
        {
            // Validação do ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validações de negócio
            if (string.IsNullOrWhiteSpace(usuario.Login))
            {
                return BadRequest(new { erro = "Login é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(usuario.Email))
            {
                return BadRequest(new { erro = "E-mail é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(usuario.Senha))
            {
                return BadRequest(new { erro = "Senha é obrigatória" });
            }

            // Verificar se o login já existe
            var loginExistente = await _context.Usuarios
                .AnyAsync(u => u.Login == usuario.Login);
            if (loginExistente)
            {
                return BadRequest("Login já existe no sistema.");
            }

            // Verificar se o e-mail já existe
            var emailExistente = await _context.Usuarios
                .AnyAsync(u => u.Email == usuario.Email);
            if (emailExistente)
            {
                return BadRequest("E-mail já existe no sistema.");
            }

            // Validar relacionamento com pessoa
            if (usuario.TipoPessoa == "Fisica")
            {
                if (!usuario.PessoaFisicaId.HasValue)
                {
                    return BadRequest(new
                    {
                        error = "PESSOA_FISICA_OBRIGATORIA",
                        message = "Pessoa Física é obrigatória quando o tipo é 'Fisica'.",
                        details = "Para criar um usuário do tipo Pessoa Física, é necessário informar o ID da pessoa física no sistema."
                    });
                }

                var pessoaFisica = await _context.PessoasFisicas
                    .FindAsync(usuario.PessoaFisicaId.Value);
                if (pessoaFisica == null)
                {
                    Console.WriteLine($"❌ PostUsuario: Tentativa de criar usuário com Pessoa Física ID={usuario.PessoaFisicaId.Value} não encontrada");
                    return BadRequest(new
                    {
                        error = "PESSOA_FISICA_NAO_ENCONTRADA",
                        message = "A pessoa física especificada não está cadastrada no sistema.",
                        details = "Antes de criar um usuário, é necessário primeiro cadastrar a pessoa física. Por favor, acesse o módulo de cadastro de Pessoas Físicas e complete o cadastro antes de criar o usuário.",
                        pessoaFisicaId = usuario.PessoaFisicaId.Value
                    });
                }

                usuario.PessoaJuridicaId = null;
            }
            else if (usuario.TipoPessoa == "Juridica")
            {
                if (!usuario.PessoaJuridicaId.HasValue)
                {
                    return BadRequest(new
                    {
                        error = "PESSOA_JURIDICA_OBRIGATORIA",
                        message = "Pessoa Jurídica é obrigatória quando o tipo é 'Juridica'.",
                        details = "Para criar um usuário do tipo Pessoa Jurídica, é necessário informar o ID da pessoa jurídica no sistema."
                    });
                }

                var pessoaJuridica = await _context.PessoasJuridicas
                    .FindAsync(usuario.PessoaJuridicaId.Value);
                if (pessoaJuridica == null)
                {
                    Console.WriteLine($"❌ PostUsuario: Tentativa de criar usuário com Pessoa Jurídica ID={usuario.PessoaJuridicaId.Value} não encontrada");
                    return BadRequest(new
                    {
                        error = "PESSOA_JURIDICA_NAO_ENCONTRADA",
                        message = "A pessoa jurídica especificada não está cadastrada no sistema.",
                        details = "Antes de criar um usuário, é necessário primeiro cadastrar a pessoa jurídica. Por favor, acesse o módulo de cadastro de Pessoas Jurídicas e complete o cadastro antes de criar o usuário.",
                        pessoaJuridicaId = usuario.PessoaJuridicaId.Value
                    });
                }

                usuario.PessoaFisicaId = null;
            }
            else
            {
                return BadRequest("Tipo de pessoa deve ser 'Fisica' ou 'Juridica'.");
            }

            // Definir grupo padrão "Usuario" para todos os novos usuários se não especificado
            if (!usuario.GrupoAcessoId.HasValue || usuario.GrupoAcessoId == 0)
            {
                var grupoUsuario = await _context.GruposAcesso
                    .FirstOrDefaultAsync(g => g.Nome == "Usuario" && g.Ativo);
                if (grupoUsuario != null)
                {
                    usuario.GrupoAcessoId = grupoUsuario.Id;
                }
                else
                {
                    // Se não encontrar o grupo "Usuario", usar ID 1 como fallback
                    usuario.GrupoAcessoId = 1;
                }
            }

            // Hash da senha antes de salvar
            if (!string.IsNullOrWhiteSpace(usuario.Senha) && !usuario.Senha.StartsWith("$2"))
            {
                usuario.Senha = BCrypt.Net.BCrypt.HashPassword(usuario.Senha);
            }

            // Definir campos de auditoria
            usuario.DataCadastro = DateTime.UtcNow;
            usuario.Ativo = true;

            if (ModelState.IsValid)
            {
                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario);
            }

            return BadRequest(ModelState);
        }

        // PUT: api/Usuario/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUsuario(int id, UpdateUsuarioDTO updateDto)
        {
            // Validação do ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validação de negócio
            if (id <= 0)
            {
                return BadRequest(new { erro = "ID do usuário inválido" });
            }

            Console.WriteLine($"DEBUG - PutUsuario chamado para ID: {id}");
            Console.WriteLine($"DEBUG - UpdateDto recebido: {System.Text.Json.JsonSerializer.Serialize(updateDto)}");

            // Buscar o usuário existente
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
            {
                return NotFound(new {
                    recurso = "Usuario",
                    id = id,
                    mensagem = $"Usuario #{id} nao foi encontrado"
                });
            }

            Console.WriteLine($"DEBUG - Usuário encontrado: ID={usuario.Id}, FilialId atual={usuario.FilialId}");

            // Atualizar apenas os campos fornecidos
            if (!string.IsNullOrWhiteSpace(updateDto.Login))
            {
                // Verificar se o login já existe (exceto para o próprio usuário)
                var loginExistente = await _context.Usuarios
                    .AnyAsync(u => u.Login == updateDto.Login && u.Id != id);
                if (loginExistente)
                {
                    return BadRequest("Login já existe no sistema.");
                }
                usuario.Login = updateDto.Login;
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Email))
            {
                // Verificar se o e-mail já existe (exceto para o próprio usuário)
                var emailExistente = await _context.Usuarios
                    .AnyAsync(u => u.Email == updateDto.Email && u.Id != id);
                if (emailExistente)
                {
                    return BadRequest("E-mail já existe no sistema.");
                }
                usuario.Email = updateDto.Email;
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Senha))
            {
                usuario.Senha = BCrypt.Net.BCrypt.HashPassword(updateDto.Senha);
            }

            // Verificar se o grupo de acesso existe (se fornecido)
            if (updateDto.GrupoAcessoId.HasValue)
            {
                var grupoExiste = await _context.GruposAcesso
                    .AnyAsync(g => g.Id == updateDto.GrupoAcessoId.Value && g.Ativo);
                if (!grupoExiste)
                {
                    return BadRequest("Grupo de acesso não encontrado ou inativo.");
                }
                usuario.GrupoAcessoId = updateDto.GrupoAcessoId;
            }

            // Verificar se a filial existe (se fornecida)
            Console.WriteLine($"DEBUG - UpdateDto.FilialId: {updateDto.FilialId}");
            if (updateDto.FilialId.HasValue)
            {
                var filialExiste = await _context.Filiais
                    .AnyAsync(f => f.Id == updateDto.FilialId.Value);
                Console.WriteLine($"DEBUG - Filial {updateDto.FilialId.Value} existe: {filialExiste}");
                if (!filialExiste)
                {
                    return BadRequest("Filial não encontrada.");
                }
                usuario.FilialId = updateDto.FilialId;
                Console.WriteLine($"DEBUG - FilialId atribuída ao usuário: {usuario.FilialId}");
            }
            else
            {
                // Se FilialId for null explicitamente, limpar a filial
                usuario.FilialId = null;
                Console.WriteLine("DEBUG - FilialId limpa (null)");
            }

            // Atualizar ConsultorId se fornecido
            if (updateDto.ConsultorId.HasValue)
            {
                usuario.ConsultorId = updateDto.ConsultorId;
            }

            // Atualizar TipoPessoa se fornecido
            if (!string.IsNullOrWhiteSpace(updateDto.TipoPessoa))
            {
                usuario.TipoPessoa = updateDto.TipoPessoa;
            }

            // Atualizar PessoaFisicaId se fornecido (com validação)
            if (updateDto.PessoaFisicaId.HasValue)
            {
                // Verificar se a pessoa física existe
                var pessoaFisicaExiste = await _context.PessoasFisicas
                    .AnyAsync(pf => pf.Id == updateDto.PessoaFisicaId.Value);
                if (!pessoaFisicaExiste)
                {
                    Console.WriteLine($"❌ PutUsuario: Tentativa de atualizar usuário {id} com Pessoa Física ID={updateDto.PessoaFisicaId.Value} não encontrada");
                    return BadRequest(new
                    {
                        error = "PESSOA_FISICA_NAO_ENCONTRADA",
                        message = "A pessoa física especificada não está cadastrada no sistema.",
                        details = "Não é possível vincular o usuário a uma pessoa física inexistente. Por favor, cadastre a pessoa física primeiro.",
                        pessoaFisicaId = updateDto.PessoaFisicaId.Value
                    });
                }
                usuario.PessoaFisicaId = updateDto.PessoaFisicaId;
            }

            // Atualizar PessoaJuridicaId se fornecido (com validação)
            if (updateDto.PessoaJuridicaId.HasValue)
            {
                // Verificar se a pessoa jurídica existe
                var pessoaJuridicaExiste = await _context.PessoasJuridicas
                    .AnyAsync(pj => pj.Id == updateDto.PessoaJuridicaId.Value);
                if (!pessoaJuridicaExiste)
                {
                    Console.WriteLine($"❌ PutUsuario: Tentativa de atualizar usuário {id} com Pessoa Jurídica ID={updateDto.PessoaJuridicaId.Value} não encontrada");
                    return BadRequest(new
                    {
                        error = "PESSOA_JURIDICA_NAO_ENCONTRADA",
                        message = "A pessoa jurídica especificada não está cadastrada no sistema.",
                        details = "Não é possível vincular o usuário a uma pessoa jurídica inexistente. Por favor, cadastre a pessoa jurídica primeiro.",
                        pessoaJuridicaId = updateDto.PessoaJuridicaId.Value
                    });
                }
                usuario.PessoaJuridicaId = updateDto.PessoaJuridicaId;
            }

            // Atualizar Ativo se fornecido
            if (updateDto.Ativo.HasValue)
            {
                usuario.Ativo = updateDto.Ativo.Value;
            }

            Console.WriteLine($"DEBUG - ModelState.IsValid: {ModelState.IsValid}");
            if (!ModelState.IsValid)
            {
                foreach (var error in ModelState)
                {
                    Console.WriteLine($"DEBUG - ModelState Error: {error.Key} = {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
                }
            }

            if (ModelState.IsValid)
            {
                try
                {
                    Console.WriteLine($"DEBUG - Antes do save: FilialId={usuario.FilialId}");
                    usuario.DataAtualizacao = DateTime.UtcNow;
                    _context.Entry(usuario).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"DEBUG - Após save: FilialId={usuario.FilialId}");
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    Console.WriteLine($"DEBUG - Erro de concorrência: {ex.Message}");
                    if (!UsuarioExists(usuario.Id))
                    {
                        return NotFound(new {
                            recurso = "Usuario",
                            id = usuario.Id,
                            mensagem = $"Usuario #{usuario.Id} nao foi encontrado"
                        });
                    }
                    else
                    {
                        throw;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"DEBUG - Erro geral: {ex.Message}");
                    throw;
                }
                return NoContent();
            }

            return BadRequest(ModelState);
        }

        // POST: api/Usuario/debug/add-filial-column
        [HttpPost("debug/add-filial-column")]
        public async Task<IActionResult> AddFilialColumn()
        {
            try
            {
                var sql = @"
                    -- Verificar se a coluna FilialId já existe
                    IF NOT EXISTS (
                        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'Usuarios'
                        AND COLUMN_NAME = 'FilialId'
                    )
                    BEGIN
                        ALTER TABLE [Usuarios] ADD [FilialId] int NULL;
                        PRINT 'Coluna FilialId adicionada com sucesso';
                    END
                    ELSE
                    BEGIN
                        PRINT 'Coluna FilialId já existe';
                    END

                    -- Verificar se a coluna ConsultorId já existe
                    IF NOT EXISTS (
                        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'Usuarios'
                        AND COLUMN_NAME = 'ConsultorId'
                    )
                    BEGIN
                        ALTER TABLE [Usuarios] ADD [ConsultorId] int NULL;
                        PRINT 'Coluna ConsultorId adicionada com sucesso';
                    END
                    ELSE
                    BEGIN
                        PRINT 'Coluna ConsultorId já existe';
                    END";

                await _context.Database.ExecuteSqlRawAsync(sql);
                return Ok("Colunas FilialId e ConsultorId verificadas/adicionadas com sucesso");
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao adicionar colunas: {ex.Message}");
            }
        }

        // GET: api/Usuario/debug/verify-columns
        [HttpGet("debug/verify-columns")]
        public async Task<IActionResult> VerifyColumns()
        {
            try
            {
                // Para SQL Server
                var sql = @"
                    SELECT
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'Usuarios'
                    AND COLUMN_NAME IN ('FilialId', 'ConsultorId')
                    ORDER BY COLUMN_NAME";

                var connection = _context.Database.GetDbConnection();
                await connection.OpenAsync();

                using var command = connection.CreateCommand();
                command.CommandText = sql;

                var columns = new List<object>();
                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    columns.Add(new
                    {
                        ColumnName = reader.GetString(0),
                        DataType = reader.GetString(1),
                        IsNullable = reader.GetString(2)
                    });
                }

                if (columns.Count == 0)
                {
                    return Ok(new {
                        status = "ERROR",
                        message = "Colunas FilialId e ConsultorId NÃO existem na tabela Usuarios!",
                        columns = columns
                    });
                }
                else if (columns.Count == 2)
                {
                    return Ok(new {
                        status = "OK",
                        message = "Colunas FilialId e ConsultorId existem na tabela Usuarios",
                        columns = columns
                    });
                }
                else
                {
                    return Ok(new {
                        status = "PARTIAL",
                        message = "Apenas algumas colunas existem",
                        columns = columns
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao verificar colunas: {ex.Message}");
            }
        }

        // PUT: api/Usuario/5/filial
        [HttpPut("{id}/filial")]
        public async Task<IActionResult> UpdateUsuarioFilial(int id, [FromBody] int? filialId)
        {
            try
            {
                var usuario = await _context.Usuarios.FindAsync(id);
                if (usuario == null)
                {
                    return NotFound(new {
                        recurso = "Usuario",
                        id = id,
                        mensagem = $"Usuario #{id} nao foi encontrado"
                    });
                }

                usuario.FilialId = filialId;
                usuario.DataAtualizacao = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok($"Usuário {id} atualizado com FilialId: {filialId}.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao atualizar filial: {ex.Message}");
            }
        }

        // GET: api/Usuario/verificar-cpf-disponivel/{cpf}
        [HttpGet("verificar-cpf-disponivel/{cpf}")]
        public async Task<ActionResult<bool>> VerificarCpfDisponivel(string cpf)
        {
            try
            {
                Console.WriteLine($"🔍 VerificarCpfDisponivel: Verificando CPF: {cpf}");

                // Remover caracteres especiais do CPF para busca
                var cpfLimpo = cpf.Replace(".", "").Replace("-", "").Replace(" ", "");
                Console.WriteLine($"🔍 VerificarCpfDisponivel: CPF limpo: {cpfLimpo}");

                // Verificar se CPF já existe em PessoaFisica
                var pessoaFisicaExiste = await _context.PessoasFisicas
                    .AnyAsync(p => p.Cpf != null &&
                        p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);

                if (!pessoaFisicaExiste)
                {
                    // CPF NÃO existe em PessoaFisica - BLOQUEAR
                    Console.WriteLine($"❌ VerificarCpfDisponivel: CPF não cadastrado como Pessoa Física");
                    return Ok(new {
                        disponivel = false,
                        motivo = "pessoa_nao_cadastrada",
                        mensagem = "CPF não encontrado. É necessário cadastrar a pessoa física primeiro em Cadastros > Pessoa Física."
                    });
                }

                Console.WriteLine($"✅ VerificarCpfDisponivel: CPF existe em PessoaFisica");

                // Verificar se já tem usuário associado
                var usuarioExiste = await _context.Usuarios
                    .Include(u => u.PessoaFisica)
                    .AnyAsync(u => u.PessoaFisica != null &&
                        u.PessoaFisica.Cpf != null &&
                        u.PessoaFisica.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);

                if (usuarioExiste)
                {
                    Console.WriteLine($"❌ VerificarCpfDisponivel: CPF já tem usuário cadastrado");
                    return Ok(new {
                        disponivel = false,
                        motivo = "usuario_existente",
                        mensagem = "CPF já possui usuário cadastrado. Faça login ou recupere sua senha."
                    });
                }

                Console.WriteLine($"✅ VerificarCpfDisponivel: CPF disponível para criar usuário");
                return Ok(new {
                    disponivel = true,
                    motivo = "pessoa_sem_usuario",
                    mensagem = "CPF encontrado. Pode criar usuário para esta pessoa."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ VerificarCpfDisponivel: Erro: {ex.Message}");
                return StatusCode(500, new {
                    disponivel = false,
                    mensagem = "Erro ao verificar CPF"
                });
            }
        }

        // DELETE: api/Usuario/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
            {
                return NotFound(new {
                    recurso = "Usuario",
                    id = id,
                    mensagem = $"Usuario #{id} nao foi encontrado"
                });
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UsuarioExists(int id)
        {
            return _context.Usuarios.Any(e => e.Id == id);
        }
    }
}