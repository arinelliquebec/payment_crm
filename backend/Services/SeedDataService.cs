using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using Microsoft.Extensions.Hosting;

namespace CrmArrighi.Services
{
    public class SeedDataService : ISeedDataService
    {
        private readonly CrmArrighiContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;

        public SeedDataService(
            CrmArrighiContext context,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
        }

        public async Task SeedGruposAcessoAsync()
        {
            var gruposExistentes = await _context.GruposAcesso.ToListAsync();

            var grupos = new[]
            {
                new GrupoAcesso
                {
                    Nome = "Administrador",
                    Descricao = "Acesso total ao sistema",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                },
                new GrupoAcesso
                {
                    Nome = "Usuário",
                    Descricao = "Usuário sem acesso até ser alocado em um grupo de acesso",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                },
                new GrupoAcesso
                {
                    Nome = "Consultores",
                    Descricao = "Acesso a pessoa física e jurídica, clientes próprios e com situações específicas",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                },
                new GrupoAcesso
                {
                    Nome = "Administrativo de Filial",
                    Descricao = "Visualização de dados da filial (somente leitura)",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                },
                new GrupoAcesso
                {
                    Nome = "Gestor de Filial",
                    Descricao = "Acesso total aos dados da filial",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                },
                new GrupoAcesso
                {
                    Nome = "Cobrança/Financeiro",
                    Descricao = "Visualização de todas as filiais (somente leitura)",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                },
                new GrupoAcesso
                {
                    Nome = "Faturamento",
                    Descricao = "Quase administrador, exceto edição de usuários",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow
                }
            };

            foreach (var grupo in grupos)
            {
                if (!gruposExistentes.Any(g => g.Nome == grupo.Nome))
                {
                    _context.GruposAcesso.Add(grupo);
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task SeedPermissoesAsync()
        {
            var permissoesExistentes = await _context.Permissoes.ToListAsync();

            var permissoes = new[]
            {
                // Pessoa Física
                new Permissao { Nome = "Visualizar Pessoa Física", Descricao = "Visualizar pessoas físicas", Modulo = "PessoaFisica", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Pessoa Física", Descricao = "Incluir pessoas físicas", Modulo = "PessoaFisica", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Pessoa Física", Descricao = "Editar pessoas físicas", Modulo = "PessoaFisica", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Pessoa Física", Descricao = "Excluir pessoas físicas", Modulo = "PessoaFisica", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Pessoa Jurídica
                new Permissao { Nome = "Visualizar Pessoa Jurídica", Descricao = "Visualizar pessoas jurídicas", Modulo = "PessoaJuridica", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Pessoa Jurídica", Descricao = "Incluir pessoas jurídicas", Modulo = "PessoaJuridica", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Pessoa Jurídica", Descricao = "Editar pessoas jurídicas", Modulo = "PessoaJuridica", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Pessoa Jurídica", Descricao = "Excluir pessoas jurídicas", Modulo = "PessoaJuridica", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Cliente
                new Permissao { Nome = "Visualizar Cliente", Descricao = "Visualizar clientes", Modulo = "Cliente", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Cliente", Descricao = "Incluir clientes", Modulo = "Cliente", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Cliente", Descricao = "Editar clientes", Modulo = "Cliente", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Cliente", Descricao = "Excluir clientes", Modulo = "Cliente", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Contrato
                new Permissao { Nome = "Visualizar Contrato", Descricao = "Visualizar contratos", Modulo = "Contrato", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Contrato", Descricao = "Incluir contratos", Modulo = "Contrato", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Contrato", Descricao = "Editar contratos", Modulo = "Contrato", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Contrato", Descricao = "Excluir contratos", Modulo = "Contrato", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Consultor
                new Permissao { Nome = "Visualizar Consultor", Descricao = "Visualizar consultores", Modulo = "Consultor", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Consultor", Descricao = "Incluir consultores", Modulo = "Consultor", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Consultor", Descricao = "Editar consultores", Modulo = "Consultor", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Consultor", Descricao = "Excluir consultores", Modulo = "Consultor", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Parceiro
                new Permissao { Nome = "Visualizar Parceiro", Descricao = "Visualizar parceiros", Modulo = "Parceiro", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Parceiro", Descricao = "Incluir parceiros", Modulo = "Parceiro", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Parceiro", Descricao = "Editar parceiros", Modulo = "Parceiro", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Parceiro", Descricao = "Excluir parceiros", Modulo = "Parceiro", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Usuário
                new Permissao { Nome = "Visualizar Usuário", Descricao = "Visualizar usuários", Modulo = "Usuario", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Usuário", Descricao = "Incluir usuários", Modulo = "Usuario", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Usuário", Descricao = "Editar usuários", Modulo = "Usuario", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Usuário", Descricao = "Excluir usuários", Modulo = "Usuario", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Filial
                new Permissao { Nome = "Visualizar Filial", Descricao = "Visualizar filiais", Modulo = "Filial", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Filial", Descricao = "Incluir filiais", Modulo = "Filial", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Filial", Descricao = "Editar filiais", Modulo = "Filial", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Filial", Descricao = "Excluir filiais", Modulo = "Filial", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Boleto
                new Permissao { Nome = "Visualizar Boleto", Descricao = "Visualizar boletos", Modulo = "Boleto", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Incluir Boleto", Descricao = "Incluir boletos", Modulo = "Boleto", Acao = "Incluir", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Editar Boleto", Descricao = "Editar boletos", Modulo = "Boleto", Acao = "Editar", Ativo = true, DataCadastro = DateTime.UtcNow },
                new Permissao { Nome = "Excluir Boleto", Descricao = "Excluir boletos", Modulo = "Boleto", Acao = "Excluir", Ativo = true, DataCadastro = DateTime.UtcNow },

                // Auditoria
                new Permissao { Nome = "Visualizar Auditoria", Descricao = "Visualizar logs de auditoria do sistema", Modulo = "Auditoria", Acao = "Visualizar", Ativo = true, DataCadastro = DateTime.UtcNow }
            };

            foreach (var permissao in permissoes)
            {
                if (!permissoesExistentes.Any(p => p.Modulo == permissao.Modulo && p.Acao == permissao.Acao))
                {
                    _context.Permissoes.Add(permissao);
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task SeedPermissoesGruposAsync()
        {
            var grupos = await _context.GruposAcesso.ToListAsync();
            var permissoes = await _context.Permissoes.ToListAsync();
            var permissoesGruposExistentes = await _context.PermissoesGrupos.ToListAsync();

            var permissoesGrupos = new List<PermissaoGrupo>();

            foreach (var grupo in grupos)
            {
                switch (grupo.Nome)
                {
                    case "Administrador":
                        // Acesso total a tudo
                        foreach (var permissao in permissoes)
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false,
                                ApenasFilial = false,
                                ApenasLeitura = false,
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }
                        break;

                    case "Faturamento":
                        // Acesso total exceto módulo Usuario e Auditoria
                        var permissoesFaturamento = permissoes.Where(p => p.Modulo != "Usuario" && p.Modulo != "Auditoria").ToList();


                        foreach (var permissao in permissoesFaturamento)
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false, // Acesso total (todas as filiais)
                                ApenasFilial = false,   // Todas as filiais
                                ApenasLeitura = false,  // CRUD completo
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }
                        break;

                    case "Cobrança e Financeiro":
                        // Apenas visualização de tudo, exceto módulo Usuario e Auditoria
                        var permissoesCobrancaFinanceiro = permissoes.Where(p =>
                            p.Acao == "Visualizar" && p.Modulo != "Usuario" && p.Modulo != "Auditoria").ToList();


                        foreach (var permissao in permissoesCobrancaFinanceiro)
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false, // Acesso total (todas as filiais)
                                ApenasFilial = false,   // Todas as filiais
                                ApenasLeitura = true,   // Apenas visualização
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }
                        break;

                    case "Gestor de Filial":
                        // Acesso total aos dados da filial, exceto módulo Usuario e Auditoria
                        var permissoesGestorFilial = permissoes.Where(p => p.Modulo != "Usuario" && p.Modulo != "Auditoria").ToList();


                        foreach (var permissao in permissoesGestorFilial)
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false,
                                ApenasFilial = true,    // Apenas da sua filial
                                ApenasLeitura = false,  // CRUD completo
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }
                        break;

                    case "Administrativo de Filial":
                        // Apenas visualização de consultores, clientes e contratos da filial
                        var modulosAdministrativoFilial = new[] { "Consultor", "Cliente", "Contrato" };
                        var permissoesAdministrativo = permissoes.Where(p =>
                            modulosAdministrativoFilial.Contains(p.Modulo) && p.Acao == "Visualizar").ToList();


                        foreach (var permissao in permissoesAdministrativo)
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false,
                                ApenasFilial = true,    // Apenas da sua filial
                                ApenasLeitura = true,   // Somente leitura
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }
                        break;

                    case "Consultores":
                        // Acesso total a pessoa física e jurídica (todas)
                        var modulosPessoaConsultor = new[] { "PessoaFisica", "PessoaJuridica" };
                        foreach (var permissao in permissoes.Where(p => modulosPessoaConsultor.Contains(p.Modulo)))
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false, // Acesso total (todas as pessoas)
                                ApenasFilial = false,   // Todas as filiais
                                ApenasLeitura = false,  // CRUD completo
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }

                        // Acesso a clientes apenas da sua filial
                        foreach (var permissao in permissoes.Where(p => p.Modulo == "Cliente"))
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false,
                                ApenasFilial = true,    // Apenas da sua filial
                                ApenasLeitura = false,  // CRUD completo
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }

                        // Acesso a contratos apenas da sua filial
                        foreach (var permissao in permissoes.Where(p => p.Modulo == "Contrato"))
                        {
                            permissoesGrupos.Add(new PermissaoGrupo
                            {
                                GrupoAcessoId = grupo.Id,
                                PermissaoId = permissao.Id,
                                ApenasProprios = false,
                                ApenasFilial = true,    // Apenas da sua filial
                                ApenasLeitura = false,  // CRUD completo
                                IncluirSituacoesEspecificas = false,
                                DataCadastro = DateTime.UtcNow
                            });
                        }
                        break;

                    case "Usuário":
                        // Sem permissões até ser alocado
                        break;
                }
            }

            foreach (var permissaoGrupo in permissoesGrupos)
            {
                if (!permissoesGruposExistentes.Any(pg => pg.GrupoAcessoId == permissaoGrupo.GrupoAcessoId && pg.PermissaoId == permissaoGrupo.PermissaoId))
                {
                    _context.PermissoesGrupos.Add(permissaoGrupo);
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task SeedAllAsync()
        {
            await SeedGruposAcessoAsync();
            await SeedPermissoesAsync();
            await SeedPermissoesGruposAsync();
        }

        /// <inheritdoc />
        public async Task SeedBootstrapAdministratorIfConfiguredAsync()
        {
            var login = (_configuration["BootstrapAdmin:Login"] ?? string.Empty).Trim();
            var password = _configuration["BootstrapAdmin:Password"] ?? string.Empty;

            if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(password))
                return;

            var explicitProd = _configuration.GetValue<bool>("BootstrapAdmin:Enabled");
            if (!_environment.IsDevelopment() && !explicitProd)
            {
                Console.WriteLine("⚠️ BootstrapAdmin: omitido (requer Ambiente Development ou BootstrapAdmin:Enabled=true).");
                return;
            }

            var grupoAdmin = await _context.GruposAcesso.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Nome == "Administrador" && g.Ativo);
            if (grupoAdmin == null)
            {
                Console.WriteLine("❌ BootstrapAdmin: grupo 'Administrador' não encontrado.");
                return;
            }

            var emailConfig = (_configuration["BootstrapAdmin:Email"] ?? string.Empty).Trim();
            var email = string.IsNullOrEmpty(emailConfig)
                ? $"{login}@bootstrap.local"
                : emailConfig;

            login = login.Length > 50 ? login[..50] : login;
            email = email.Length > 150 ? email[..150] : email;

            var updatePassword = _configuration.GetValue<bool>("BootstrapAdmin:UpdatePassword");
            var hash = BCrypt.Net.BCrypt.HashPassword(password);

            var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Login == login);

            if (existing != null)
            {
                var changed = false;
                if (existing.GrupoAcessoId != grupoAdmin.Id)
                {
                    existing.GrupoAcessoId = grupoAdmin.Id;
                    changed = true;
                }

                if (!string.Equals(existing.Email, email, StringComparison.Ordinal))
                {
                    existing.Email = email;
                    changed = true;
                }

                if (!existing.Ativo)
                {
                    existing.Ativo = true;
                    changed = true;
                }

                if (updatePassword)
                {
                    existing.Senha = hash;
                    existing.DataAtualizacao = DateTime.UtcNow;
                    changed = true;
                }

                if (changed)
                    await _context.SaveChangesAsync();

                Console.WriteLine(updatePassword
                    ? $"✅ BootstrapAdmin: utilizador '{login}' atualizado (grupo/password conforme flags)."
                    : $"✅ BootstrapAdmin: utilizador '{login}' já existia — grupo garantido como Administrador. Defina BootstrapAdmin__UpdatePassword=true para alterar senha.");

                return;
            }

            if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            {
                Console.WriteLine($"❌ BootstrapAdmin: e-mail '{email}' já está em uso; escolha BootstrapAdmin__Email distinto.");
                return;
            }

            _context.Usuarios.Add(new Usuario
            {
                Login = login,
                Email = email,
                Senha = hash,
                GrupoAcessoId = grupoAdmin.Id,
                FilialId = null,
                ConsultorId = null,
                TipoPessoa = "Fisica",
                PessoaFisicaId = null,
                PessoaJuridicaId = null,
                Ativo = true,
                DataCadastro = DateTime.UtcNow,
                UltimoAcesso = null,
                DataAtualizacao = null
            });

            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ BootstrapAdmin: criado utilizador '{login}' com grupo Administrador.");
        }
    }
}
