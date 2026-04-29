using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;

namespace CrmArrighi.Services
{
    /// <summary>
    /// Serviço para criar e gerenciar índices de performance do banco de dados
    /// </summary>
    public class DatabaseIndexService
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<DatabaseIndexService> _logger;

        public DatabaseIndexService(CrmArrighiContext context, ILogger<DatabaseIndexService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Cria todos os índices de performance do sistema
        /// </summary>
        public async Task<bool> CriarTodosIndicesAsync()
        {
            try
            {
                _logger.LogInformation("🚀 Iniciando criação de índices de performance...");

                var sucesso = true;

                // Pessoas Físicas
                sucesso &= await CriarIndicesPessoaFisicaAsync();

                // Pessoas Jurídicas
                sucesso &= await CriarIndicesPessoaJuridicaAsync();

                // Clientes
                sucesso &= await CriarIndicesClientesAsync();

                // Contratos
                sucesso &= await CriarIndicesContratosAsync();

                // Boletos
                sucesso &= await CriarIndicesBoletosAsync();

                // Usuários
                sucesso &= await CriarIndicesUsuariosAsync();

                // Sessões Ativas
                sucesso &= await CriarIndicesSessoesAtivasAsync();

                if (sucesso)
                {
                    _logger.LogInformation("✅ Todos os índices foram criados com sucesso!");
                }
                else
                {
                    _logger.LogWarning("⚠️ Alguns índices falharam ou já existiam");
                }

                return sucesso;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de performance");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela PessoasFisicas
        /// </summary>
        private async Task<bool> CriarIndicesPessoaFisicaAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para PessoasFisicas...");

                // Índice para busca por CPF
                await CriarIndiceSeNaoExistirAsync(
                    "IX_PessoasFisicas_Cpf",
                    @"CREATE NONCLUSTERED INDEX IX_PessoasFisicas_Cpf
                      ON PessoasFisicas(Cpf)
                      INCLUDE (Nome, EmailEmpresarial, Telefone1)"
                );

                // Índice para busca por email empresarial
                await CriarIndiceSeNaoExistirAsync(
                    "IX_PessoasFisicas_EmailEmpresarial",
                    @"CREATE NONCLUSTERED INDEX IX_PessoasFisicas_EmailEmpresarial
                      ON PessoasFisicas(EmailEmpresarial)
                      WHERE EmailEmpresarial IS NOT NULL"
                );

                // Índice para busca por nome
                await CriarIndiceSeNaoExistirAsync(
                    "IX_PessoasFisicas_Nome",
                    @"CREATE NONCLUSTERED INDEX IX_PessoasFisicas_Nome
                      ON PessoasFisicas(Nome)"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de PessoasFisicas");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela PessoaJuridica
        /// </summary>
        private async Task<bool> CriarIndicesPessoaJuridicaAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para PessoaJuridica...");

                await CriarIndiceSeNaoExistirAsync(
                    "IX_PessoaJuridica_Cnpj",
                    @"CREATE NONCLUSTERED INDEX IX_PessoaJuridica_Cnpj
                      ON PessoaJuridica(Cnpj)
                      INCLUDE (RazaoSocial, Email, Telefone1)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_PessoaJuridica_RazaoSocial",
                    @"CREATE NONCLUSTERED INDEX IX_PessoaJuridica_RazaoSocial
                      ON PessoaJuridica(RazaoSocial)"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de PessoaJuridica");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela Clientes
        /// </summary>
        private async Task<bool> CriarIndicesClientesAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para Clientes...");

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Clientes_Ativo_TipoPessoa",
                    @"CREATE NONCLUSTERED INDEX IX_Clientes_Ativo_TipoPessoa
                      ON Clientes(Ativo, TipoPessoa)
                      INCLUDE (PessoaFisicaId, PessoaJuridicaId, FilialId)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Clientes_PessoaFisicaId",
                    @"CREATE NONCLUSTERED INDEX IX_Clientes_PessoaFisicaId
                      ON Clientes(PessoaFisicaId)
                      WHERE PessoaFisicaId IS NOT NULL"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Clientes_PessoaJuridicaId",
                    @"CREATE NONCLUSTERED INDEX IX_Clientes_PessoaJuridicaId
                      ON Clientes(PessoaJuridicaId)
                      WHERE PessoaJuridicaId IS NOT NULL"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de Clientes");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela Contratos
        /// </summary>
        private async Task<bool> CriarIndicesContratosAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para Contratos...");

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Contratos_ClienteId_Ativo",
                    @"CREATE NONCLUSTERED INDEX IX_Contratos_ClienteId_Ativo
                      ON Contratos(ClienteId, Ativo)
                      INCLUDE (Situacao, ValorNegociado, DataCadastro)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Contratos_ConsultorId_Ativo",
                    @"CREATE NONCLUSTERED INDEX IX_Contratos_ConsultorId_Ativo
                      ON Contratos(ConsultorId, Ativo)
                      INCLUDE (ClienteId, Situacao, ValorNegociado)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Contratos_Situacao_Ativo",
                    @"CREATE NONCLUSTERED INDEX IX_Contratos_Situacao_Ativo
                      ON Contratos(Situacao, Ativo)
                      INCLUDE (ClienteId, ConsultorId, ValorNegociado, DataCadastro)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Contratos_DataCadastro",
                    @"CREATE NONCLUSTERED INDEX IX_Contratos_DataCadastro
                      ON Contratos(DataCadastro DESC)
                      WHERE Ativo = 1"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de Contratos");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela Boletos
        /// </summary>
        private async Task<bool> CriarIndicesBoletosAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para Boletos...");

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Boletos_ContratoId_Status",
                    @"CREATE NONCLUSTERED INDEX IX_Boletos_ContratoId_Status
                      ON Boletos(ContratoId, Status)
                      INCLUDE (NominalValue, DueDate, IssueDate)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Boletos_DueDate_Status",
                    @"CREATE NONCLUSTERED INDEX IX_Boletos_DueDate_Status
                      ON Boletos(DueDate, Status)
                      WHERE Ativo = 1"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de Boletos");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela Usuarios
        /// </summary>
        private async Task<bool> CriarIndicesUsuariosAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para Usuarios...");

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Usuarios_Login",
                    @"CREATE NONCLUSTERED INDEX IX_Usuarios_Login
                      ON Usuarios(Login)
                      WHERE Ativo = 1"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_Usuarios_Email",
                    @"CREATE NONCLUSTERED INDEX IX_Usuarios_Email
                      ON Usuarios(Email)
                      WHERE Ativo = 1"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de Usuarios");
                return false;
            }
        }

        /// <summary>
        /// Cria índices para a tabela SessoesAtivas
        /// </summary>
        private async Task<bool> CriarIndicesSessoesAtivasAsync()
        {
            try
            {
                _logger.LogInformation("  📋 Criando índices para SessoesAtivas...");

                await CriarIndiceSeNaoExistirAsync(
                    "IX_SessoesAtivas_UsuarioId_Ativa",
                    @"CREATE NONCLUSTERED INDEX IX_SessoesAtivas_UsuarioId_Ativa
                      ON SessoesAtivas(UsuarioId, Ativa)
                      INCLUDE (UltimaAtividade, InicioSessao)"
                );

                await CriarIndiceSeNaoExistirAsync(
                    "IX_SessoesAtivas_UltimaAtividade",
                    @"CREATE NONCLUSTERED INDEX IX_SessoesAtivas_UltimaAtividade
                      ON SessoesAtivas(UltimaAtividade)
                      WHERE Ativa = 1"
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices de SessoesAtivas");
                return false;
            }
        }

        /// <summary>
        /// Cria um índice se ele não existir
        /// </summary>
        private async Task<bool> CriarIndiceSeNaoExistirAsync(string nomeIndice, string sqlCreate)
        {
            try
            {
                // Verificar se o índice já existe
                var existe = await VerificarIndiceExisteAsync(nomeIndice);

                if (existe)
                {
                    _logger.LogInformation($"    ℹ️  Índice {nomeIndice} já existe");
                    return true;
                }

                // Criar o índice
                await _context.Database.ExecuteSqlRawAsync(sqlCreate);
                _logger.LogInformation($"    ✅ Índice {nomeIndice} criado com sucesso");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"    ❌ Erro ao criar índice {nomeIndice}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Verifica se um índice existe no banco
        /// </summary>
        private async Task<bool> VerificarIndiceExisteAsync(string nomeIndice)
        {
            try
            {
                var sql = @"
                    SELECT COUNT(*)
                    FROM sys.indexes
                    WHERE name = {0}";

                var count = await _context.Database
                    .SqlQueryRaw<int>(sql, nomeIndice)
                    .FirstOrDefaultAsync();

                return count > 0;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Remove todos os índices criados (útil para testes)
        /// </summary>
        public async Task<bool> RemoverTodosIndicesAsync()
        {
            try
            {
                _logger.LogWarning("⚠️ Removendo todos os índices de performance...");

                var indices = new[]
                {
                    // Pessoas Físicas
                    "DROP INDEX IF EXISTS IX_PessoasFisicas_Cpf ON PessoasFisicas",
                    "DROP INDEX IF EXISTS IX_PessoasFisicas_EmailEmpresarial ON PessoasFisicas",
                    "DROP INDEX IF EXISTS IX_PessoasFisicas_Nome ON PessoasFisicas",

                    // Pessoas Jurídicas
                    "DROP INDEX IF EXISTS IX_PessoaJuridica_Cnpj ON PessoaJuridica",
                    "DROP INDEX IF EXISTS IX_PessoaJuridica_RazaoSocial ON PessoaJuridica",

                    // Clientes
                    "DROP INDEX IF EXISTS IX_Clientes_Ativo_TipoPessoa ON Clientes",
                    "DROP INDEX IF EXISTS IX_Clientes_PessoaFisicaId ON Clientes",
                    "DROP INDEX IF EXISTS IX_Clientes_PessoaJuridicaId ON Clientes",

                    // Contratos
                    "DROP INDEX IF EXISTS IX_Contratos_ClienteId_Ativo ON Contratos",
                    "DROP INDEX IF EXISTS IX_Contratos_ConsultorId_Ativo ON Contratos",
                    "DROP INDEX IF EXISTS IX_Contratos_Situacao_Ativo ON Contratos",
                    "DROP INDEX IF EXISTS IX_Contratos_DataCadastro ON Contratos",

                    // Boletos
                    "DROP INDEX IF EXISTS IX_Boletos_ContratoId_Status ON Boletos",
                    "DROP INDEX IF EXISTS IX_Boletos_DueDate_Status ON Boletos",

                    // Usuários
                    "DROP INDEX IF EXISTS IX_Usuarios_Login ON Usuarios",
                    "DROP INDEX IF EXISTS IX_Usuarios_Email ON Usuarios",

                    // Sessões Ativas
                    "DROP INDEX IF EXISTS IX_SessoesAtivas_UsuarioId_Ativa ON SessoesAtivas",
                    "DROP INDEX IF EXISTS IX_SessoesAtivas_UltimaAtividade ON SessoesAtivas"
                };

                foreach (var sql in indices)
                {
                    try
                    {
                        await _context.Database.ExecuteSqlRawAsync(sql);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Erro ao remover índice: {ex.Message}");
                    }
                }

                _logger.LogInformation("✅ Índices removidos");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao remover índices");
                return false;
            }
        }

        /// <summary>
        /// Lista todos os índices customizados do sistema
        /// </summary>
        public async Task<List<IndiceInfo>> ListarIndicesAsync()
        {
            try
            {
                var sql = @"
                    SELECT
                        OBJECT_NAME(i.object_id) AS Tabela,
                        i.name AS Indice,
                        i.type_desc AS Tipo,
                        CAST(ROUND(((SUM(ps.reserved_page_count) * 8.0) / 1024), 2) AS DECIMAL(10,2)) AS TamanhoMB
                    FROM
                        sys.indexes AS i
                        INNER JOIN sys.dm_db_partition_stats AS ps
                            ON i.object_id = ps.object_id AND i.index_id = ps.index_id
                    WHERE
                        i.name LIKE 'IX_%'
                        AND i.name NOT LIKE 'PK_%'
                    GROUP BY
                        i.object_id, i.name, i.type_desc
                    ORDER BY
                        OBJECT_NAME(i.object_id), i.name";

                // Como ExecuteSqlRaw não suporta objetos complexos, vamos fazer manualmente
                using var command = _context.Database.GetDbConnection().CreateCommand();
                command.CommandText = sql;
                await _context.Database.OpenConnectionAsync();

                var indices = new List<IndiceInfo>();
                using var result = await command.ExecuteReaderAsync();

                while (await result.ReadAsync())
                {
                    indices.Add(new IndiceInfo
                    {
                        Tabela = result.GetString(0),
                        Indice = result.GetString(1),
                        Tipo = result.GetString(2),
                        TamanhoMB = result.GetDecimal(3)
                    });
                }

                return indices;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao listar índices");
                return new List<IndiceInfo>();
            }
        }
    }

    /// <summary>
    /// Informações sobre um índice
    /// </summary>
    public class IndiceInfo
    {
        public string Tabela { get; set; } = string.Empty;
        public string Indice { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public decimal TamanhoMB { get; set; }
    }
}
