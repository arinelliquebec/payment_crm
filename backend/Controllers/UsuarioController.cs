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

        // GET: api/Usuario
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
        {
            return await _context.Usuarios
                .Include(u => u.PessoaFisica)
                .Include(u => u.PessoaJuridica)
                .ToListAsync();
        }

        // GET: api/Usuario/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Usuario>> GetUsuario(int id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.PessoaFisica)
                .Include(u => u.PessoaJuridica)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null)
            {
                return NotFound();
            }

            return usuario;
        }

        // GET: api/Usuario/pessoas-fisicas
        [HttpGet("pessoas-fisicas")]
        public async Task<ActionResult<IEnumerable<object>>> GetPessoasFisicasParaUsuario()
        {
            var pessoasFisicas = await _context.PessoasFisicas
                .Select(p => new { p.Id, p.Nome, p.Cpf, p.Email })
                .ToListAsync();

            return pessoasFisicas;
        }

        // GET: api/Usuario/pessoas-juridicas
        [HttpGet("pessoas-juridicas")]
        public async Task<ActionResult<IEnumerable<object>>> GetPessoasJuridicasParaUsuario()
        {
            var pessoasJuridicas = await _context.PessoasJuridicas
                .Select(p => new { p.Id, p.RazaoSocial, p.NomeFantasia, p.Cnpj, p.Email })
                .ToListAsync();

            return pessoasJuridicas;
        }

        // POST: api/Usuario
        [HttpPost]
        public async Task<ActionResult<Usuario>> PostUsuario(Usuario usuario)
        {
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
                    return BadRequest("Pessoa Física é obrigatória quando o tipo é 'Fisica'.");
                }

                var pessoaFisica = await _context.PessoasFisicas
                    .FindAsync(usuario.PessoaFisicaId.Value);
                if (pessoaFisica == null)
                {
                    return BadRequest("Pessoa Física não encontrada.");
                }

                usuario.PessoaJuridicaId = null;
            }
            else if (usuario.TipoPessoa == "Juridica")
            {
                if (!usuario.PessoaJuridicaId.HasValue)
                {
                    return BadRequest("Pessoa Jurídica é obrigatória quando o tipo é 'Juridica'.");
                }

                var pessoaJuridica = await _context.PessoasJuridicas
                    .FindAsync(usuario.PessoaJuridicaId.Value);
                if (pessoaJuridica == null)
                {
                    return BadRequest("Pessoa Jurídica não encontrada.");
                }

                usuario.PessoaFisicaId = null;
            }
            else
            {
                return BadRequest("Tipo de pessoa deve ser 'Fisica' ou 'Juridica'.");
            }

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
        public async Task<IActionResult> PutUsuario(int id, Usuario usuario)
        {
            if (id != usuario.Id)
            {
                return BadRequest();
            }

            // Verificar se o login já existe (exceto para o próprio usuário)
            var loginExistente = await _context.Usuarios
                .AnyAsync(u => u.Login == usuario.Login && u.Id != id);
            if (loginExistente)
            {
                return BadRequest("Login já existe no sistema.");
            }

            // Verificar se o e-mail já existe (exceto para o próprio usuário)
            var emailExistente = await _context.Usuarios
                .AnyAsync(u => u.Email == usuario.Email && u.Id != id);
            if (emailExistente)
            {
                return BadRequest("E-mail já existe no sistema.");
            }

            // Validar relacionamento com pessoa
            if (usuario.TipoPessoa == "Fisica")
            {
                if (!usuario.PessoaFisicaId.HasValue)
                {
                    return BadRequest("Pessoa Física é obrigatória quando o tipo é 'Fisica'.");
                }

                var pessoaFisica = await _context.PessoasFisicas
                    .FindAsync(usuario.PessoaFisicaId.Value);
                if (pessoaFisica == null)
                {
                    return BadRequest("Pessoa Física não encontrada.");
                }

                usuario.PessoaJuridicaId = null;
            }
            else if (usuario.TipoPessoa == "Juridica")
            {
                if (!usuario.PessoaJuridicaId.HasValue)
                {
                    return BadRequest("Pessoa Jurídica é obrigatória quando o tipo é 'Juridica'.");
                }

                var pessoaJuridica = await _context.PessoasJuridicas
                    .FindAsync(usuario.PessoaJuridicaId.Value);
                if (pessoaJuridica == null)
                {
                    return BadRequest("Pessoa Jurídica não encontrada.");
                }

                usuario.PessoaFisicaId = null;
            }
            else
            {
                return BadRequest("Tipo de pessoa deve ser 'Fisica' ou 'Juridica'.");
            }

            if (ModelState.IsValid)
            {
                try
                {
                    usuario.DataAtualizacao = DateTime.Now;
                    _context.Update(usuario);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!UsuarioExists(usuario.Id))
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

        // DELETE: api/Usuario/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
            {
                return NotFound();
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Usuario/login
        [HttpPost("login")]
        public async Task<ActionResult> LoginUsuario(LoginUsuarioDTO loginDTO)
        {
            try
            {
                // Validar dados de entrada
                if (string.IsNullOrWhiteSpace(loginDTO.Login) || string.IsNullOrWhiteSpace(loginDTO.Senha))
                {
                    return BadRequest("CPF e senha são obrigatórios");
                }

                // Validar se é um CPF (APENAS números, 11 dígitos)
                if (!loginDTO.Login.All(char.IsDigit) || loginDTO.Login.Length != 11)
                {
                    return BadRequest("Apenas CPF é permitido para login (11 dígitos, apenas números)");
                }

                // Buscar usuário APENAS por CPF (removendo formatação para comparação)
                var usuario = await _context.Usuarios
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .FirstOrDefaultAsync(u => u.Ativo &&
                                       u.PessoaFisica != null &&
                                       u.PessoaFisica.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == loginDTO.Login);

                if (usuario == null)
                {
                    return BadRequest("CPF não encontrado ou senha incorreta");
                }

                // Verificar senha (em produção, usar hash)
                if (usuario.Senha != loginDTO.Senha)
                {
                    return BadRequest("CPF não encontrado ou senha incorreta");
                }

                // Atualizar último acesso
                usuario.UltimoAcesso = DateTime.Now;
                usuario.DataAtualizacao = DateTime.Now;
                await _context.SaveChangesAsync();

                // Retornar dados do usuário (sem a senha)
                var usuarioResponse = new
                {
                    id = usuario.Id,
                    login = usuario.Login,
                    email = usuario.Email,
                    grupoAcesso = usuario.GrupoAcesso,
                    tipoPessoa = usuario.TipoPessoa,
                    nome = usuario.TipoPessoa == "Fisica"
                        ? usuario.PessoaFisica?.Nome
                        : usuario.PessoaJuridica?.RazaoSocial,
                    ativo = usuario.Ativo,
                    ultimoAcesso = usuario.UltimoAcesso
                };

                return Ok(new
                {
                    message = "Login realizado com sucesso",
                    usuario = usuarioResponse
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/Usuario/cadastro
        [HttpPost("cadastro")]
        public async Task<ActionResult> CadastroUsuario(CadastroUsuarioDTO cadastroDTO)
        {
            try
            {
                // Validar CPF
                if (string.IsNullOrWhiteSpace(cadastroDTO.Cpf))
                {
                    return BadRequest("CPF é obrigatório");
                }

                // Remover caracteres especiais do CPF
                var cpfLimpo = cadastroDTO.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "");

                // Verificar se CPF existe na base de pessoas físicas
                var pessoaFisica = await _context.PessoasFisicas
                    .FirstOrDefaultAsync(pf => pf.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);

                if (pessoaFisica == null)
                {
                    return BadRequest("CPF não encontrado no sistema. Entre em contato com o administrador.");
                }

                // Verificar se já existe usuário para esta pessoa física
                var usuarioExistente = await _context.Usuarios
                    .AnyAsync(u => u.PessoaFisicaId == pessoaFisica.Id);

                if (usuarioExistente)
                {
                    return BadRequest("Já existe um usuário cadastrado para este CPF.");
                }

                // Validar senha
                if (string.IsNullOrWhiteSpace(cadastroDTO.Senha) || cadastroDTO.Senha.Length < 6)
                {
                    return BadRequest("Senha deve ter pelo menos 6 caracteres");
                }

                // Verificar se senha tem letra e número
                if (!cadastroDTO.Senha.Any(char.IsLetter) || !cadastroDTO.Senha.Any(char.IsDigit))
                {
                    return BadRequest("Senha deve conter pelo menos uma letra e um número");
                }

                // Gerar login baseado no nome e CPF
                var nomePartes = pessoaFisica.Nome.Split(' ');
                var primeiroNome = nomePartes[0].ToLower();
                var ultimoNome = nomePartes.Length > 1 ? nomePartes[^1].ToLower() : "";
                var ultimosDigitosCpf = cpfLimpo.Substring(cpfLimpo.Length - 4);

                var loginBase = ultimoNome.Length > 0 ? $"{primeiroNome}.{ultimoNome}" : primeiroNome;
                var login = $"{loginBase}{ultimosDigitosCpf}";

                // Garantir que o login seja único
                var contador = 1;
                var loginFinal = login;
                while (await _context.Usuarios.AnyAsync(u => u.Login == loginFinal))
                {
                    loginFinal = $"{login}{contador}";
                    contador++;
                }

                // Criar novo usuário
                var novoUsuario = new Usuario
                {
                    Login = loginFinal,
                    Email = pessoaFisica.Email,
                    Senha = cadastroDTO.Senha, // Em produção, usar hash da senha
                    GrupoAcesso = "Usuario", // Grupo padrão
                    TipoPessoa = "Fisica",
                    PessoaFisicaId = pessoaFisica.Id,
                    PessoaJuridicaId = null,
                    Ativo = true,
                    DataCadastro = DateTime.Now
                };

                _context.Usuarios.Add(novoUsuario);
                await _context.SaveChangesAsync();

                // Retornar dados do usuário (sem a senha)
                return Ok(new
                {
                    message = "Usuário criado com sucesso",
                    usuario = new
                    {
                        id = novoUsuario.Id,
                        login = novoUsuario.Login,
                        email = novoUsuario.Email,
                        nome = pessoaFisica.Nome
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        private bool UsuarioExists(int id)
        {
            return _context.Usuarios.Any(e => e.Id == id);
        }
    }
}