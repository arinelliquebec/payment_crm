using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoricoSituacaoContratoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public HistoricoSituacaoContratoController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/HistoricoSituacaoContrato
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistoricoSituacaoContrato>>> GetHistoricoSituacaoContratos()
        {
            try
            {
                // Simular operação assíncrona
                await Task.Delay(1);
                
                // Mock data para desenvolvimento
                var mockHistorico = new List<HistoricoSituacaoContrato>
                {
                    new HistoricoSituacaoContrato
                    {
                        Id = 1,
                        ContratoId = 1,
                        Contrato = new Contrato
                        {
                            Id = 1,
                            ClienteId = 1,
                            Cliente = new Cliente
                            {
                                Id = 1,
                                TipoPessoa = "Fisica",
                                PessoaFisicaId = 1,
                                PessoaFisica = new PessoaFisica
                                {
                                    Id = 1,
                                    Nome = "João Silva",
                                    Cpf = "12345678901"
                                }
                            },
                            ConsultorId = 1,
                            Consultor = new Consultor
                            {
                                Id = 1,
                                PessoaFisicaId = 1,
                                PessoaFisica = new PessoaFisica
                                {
                                    Id = 1,
                                    Nome = "Maria Santos",
                                    Cpf = "98765432100"
                                }
                            },
                            Situacao = "Leed"
                        },
                        SituacaoAnterior = "Leed",
                        NovaSituacao = "Prospecto",
                        MotivoMudanca = "Cliente demonstrou interesse após apresentação",
                        DataMudanca = DateTime.UtcNow.AddDays(-5),
                        DataCadastro = DateTime.UtcNow.AddDays(-5)
                    },
                    new HistoricoSituacaoContrato
                    {
                        Id = 2,
                        ContratoId = 1,
                        Contrato = new Contrato
                        {
                            Id = 1,
                            ClienteId = 1,
                            Cliente = new Cliente
                            {
                                Id = 1,
                                TipoPessoa = "Fisica",
                                PessoaFisicaId = 1,
                                PessoaFisica = new PessoaFisica
                                {
                                    Id = 1,
                                    Nome = "João Silva",
                                    Cpf = "12345678901"
                                }
                            },
                            ConsultorId = 1,
                            Consultor = new Consultor
                            {
                                Id = 1,
                                PessoaFisicaId = 1,
                                PessoaFisica = new PessoaFisica
                                {
                                    Id = 1,
                                    Nome = "Maria Santos",
                                    Cpf = "98765432100"
                                }
                            },
                            Situacao = "Prospecto"
                        },
                        SituacaoAnterior = "Prospecto",
                        NovaSituacao = "Contrato Enviado",
                        MotivoMudanca = "Proposta enviada para análise",
                        DataMudanca = DateTime.UtcNow.AddDays(-3),
                        DataCadastro = DateTime.UtcNow.AddDays(-3)
                    },
                    new HistoricoSituacaoContrato
                    {
                        Id = 3,
                        ContratoId = 2,
                        Contrato = new Contrato
                        {
                            Id = 2,
                            ClienteId = 2,
                            Cliente = new Cliente
                            {
                                Id = 2,
                                TipoPessoa = "Juridica",
                                PessoaJuridicaId = 1,
                                PessoaJuridica = new PessoaJuridica
                                {
                                    Id = 1,
                                    RazaoSocial = "Empresa ABC Ltda",
                                    Cnpj = "12345678000199"
                                }
                            },
                            ConsultorId = 2,
                            Consultor = new Consultor
                            {
                                Id = 2,
                                PessoaFisicaId = 2,
                                PessoaFisica = new PessoaFisica
                                {
                                    Id = 2,
                                    Nome = "Carlos Oliveira",
                                    Cpf = "11122233344"
                                }
                            },
                            Situacao = "Contrato Assinado"
                        },
                        SituacaoAnterior = "Contrato Enviado",
                        NovaSituacao = "Contrato Assinado",
                        MotivoMudanca = "Contrato assinado e finalizado",
                        DataMudanca = DateTime.UtcNow.AddDays(-1),
                        DataCadastro = DateTime.UtcNow.AddDays(-1)
                    }
                };

                return Ok(mockHistorico);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/HistoricoSituacaoContrato/5
        [HttpGet("{id}")]
        public async Task<ActionResult<HistoricoSituacaoContrato>> GetHistoricoSituacaoContrato(int id)
        {
            try
            {
                // Mock data para desenvolvimento
                var mockHistorico = new HistoricoSituacaoContrato
                {
                    Id = id,
                    ContratoId = 1,
                    Contrato = new Contrato
                    {
                        Id = 1,
                        ClienteId = 1,
                        Cliente = new Cliente
                        {
                            Id = 1,
                            TipoPessoa = "Fisica",
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "João Silva",
                                Cpf = "12345678901"
                            }
                        },
                        ConsultorId = 1,
                        Consultor = new Consultor
                        {
                            Id = 1,
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "Maria Santos",
                                Cpf = "98765432100"
                            }
                        },
                        Situacao = "Prospecto"
                    },
                    SituacaoAnterior = "Leed",
                    NovaSituacao = "Prospecto",
                    MotivoMudanca = "Cliente demonstrou interesse após apresentação",
                    DataMudanca = DateTime.UtcNow.AddDays(-5),
                    DataCadastro = DateTime.UtcNow.AddDays(-5)
                };

                return Ok(mockHistorico);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/HistoricoSituacaoContrato/contrato/5
        [HttpGet("contrato/{contratoId}")]
        public async Task<ActionResult<IEnumerable<HistoricoSituacaoContrato>>> GetHistoricoPorContrato(int contratoId)
        {
            try
            {
                Console.WriteLine($"🔍 GetHistoricoPorContrato: Buscando histórico para contrato ID: {contratoId}");

                // Buscar histórico real no banco de dados
                var historico = await _context.HistoricoSituacaoContratos
                    .Include(h => h.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(h => h.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(h => h.Contrato)
                        .ThenInclude(c => c.Consultor)
                            .ThenInclude(co => co.PessoaFisica)
                    .Where(h => h.ContratoId == contratoId)
                    .OrderByDescending(h => h.DataMudanca)
                    .ToListAsync();

                Console.WriteLine($"✅ GetHistoricoPorContrato: Encontrados {historico.Count} registros de histórico para contrato {contratoId}");

                if (!historico.Any())
                {
                    Console.WriteLine($"ℹ️ GetHistoricoPorContrato: Nenhum histórico encontrado para contrato {contratoId}");

                    // Se não há histórico real, criar um registro inicial baseado na situação atual do contrato
                    var contrato = await _context.Contratos
                        .Include(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                        .Include(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                        .Include(c => c.Consultor)
                            .ThenInclude(co => co.PessoaFisica)
                        .FirstOrDefaultAsync(c => c.Id == contratoId);

                    if (contrato != null)
                    {
                        var historicoInicial = new HistoricoSituacaoContrato
                        {
                            Id = 0, // ID temporário
                            ContratoId = contratoId,
                            Contrato = contrato,
                            SituacaoAnterior = "N/A",
                            NovaSituacao = contrato.Situacao,
                            MotivoMudanca = "Situação inicial do contrato",
                            DataMudanca = contrato.DataCadastro,
                            DataCadastro = contrato.DataCadastro
                        };

                        Console.WriteLine($"ℹ️ GetHistoricoPorContrato: Criado histórico inicial para contrato {contratoId}");
                        return Ok(new List<HistoricoSituacaoContrato> { historicoInicial });
                    }
                }

                return Ok(historico);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetHistoricoPorContrato: Erro ao buscar histórico para contrato {contratoId}: {ex.Message}");
                Console.WriteLine($"❌ GetHistoricoPorContrato: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/HistoricoSituacaoContrato
        [HttpPost]
        public async Task<ActionResult<HistoricoSituacaoContrato>> CreateHistoricoSituacaoContrato(CreateHistoricoSituacaoDTO historicoDTO)
        {
            try
            {
                // Verificar se a tabela HistoricoSituacaoContratos existe, se não, criar
                await EnsureHistoricoTableExists();

                // Verificar se o contrato existe
                var contrato = await _context.Contratos.FindAsync(historicoDTO.ContratoId);
                if (contrato == null)
                {
                    return BadRequest("Contrato não encontrado");
                }

                // Criar histórico real no banco de dados
                var novoHistorico = new HistoricoSituacaoContrato
                {
                    ContratoId = historicoDTO.ContratoId,
                    SituacaoAnterior = historicoDTO.SituacaoAnterior,
                    NovaSituacao = historicoDTO.NovaSituacao,
                    MotivoMudanca = historicoDTO.MotivoMudanca,
                    DataMudanca = DateTime.UtcNow,
                    DataCadastro = DateTime.UtcNow,
                    Contrato = contrato
                };

                _context.HistoricoSituacaoContratos.Add(novoHistorico);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ CreateHistoricoSituacaoContrato: Histórico criado com ID {novoHistorico.Id}");

                return CreatedAtAction(nameof(GetHistoricoSituacaoContrato), new { id = novoHistorico.Id }, novoHistorico);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CreateHistoricoSituacaoContrato: Erro ao criar histórico: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // DELETE: api/HistoricoSituacaoContrato/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHistoricoSituacaoContrato(int id)
        {
            try
            {
                // Verificar se a tabela HistoricoSituacaoContratos existe, se não, criar
                await EnsureHistoricoTableExists();

                // Buscar e remover histórico real
                var historico = await _context.HistoricoSituacaoContratos.FindAsync(id);
                if (historico == null)
                {
                    return NotFound($"Histórico com ID {id} não encontrado");
                }

                _context.HistoricoSituacaoContratos.Remove(historico);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Histórico {id} removido com sucesso" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DeleteHistoricoSituacaoContrato: Erro ao remover histórico: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        private async Task EnsureHistoricoTableExists()
        {
            try
            {
                // Tentar executar uma query simples na tabela HistoricoSituacaoContratos
                await _context.Database.ExecuteSqlRawAsync("SELECT TOP 1 * FROM HistoricoSituacaoContratos");
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Message.Contains("Invalid object name 'HistoricoSituacaoContratos'"))
            {
                // Tabela não existe, criar agora
                await _context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE [dbo].[HistoricoSituacaoContratos] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [ContratoId] int NOT NULL,
                        [SituacaoAnterior] nvarchar(50) NOT NULL,
                        [NovaSituacao] nvarchar(50) NOT NULL,
                        [MotivoMudanca] nvarchar(500) NULL,
                        [DataMudanca] datetime2 NOT NULL,
                        [DataCadastro] datetime2 NOT NULL,
                        CONSTRAINT [PK_HistoricoSituacaoContratos] PRIMARY KEY ([Id])
                    );

                    CREATE INDEX [IX_HistoricoSituacaoContratos_ContratoId] ON [dbo].[HistoricoSituacaoContratos] ([ContratoId]);

                    ALTER TABLE [dbo].[HistoricoSituacaoContratos] ADD CONSTRAINT [FK_HistoricoSituacaoContratos_Contratos_ContratoId]
                        FOREIGN KEY ([ContratoId]) REFERENCES [dbo].[Contratos] ([Id]);
                ");

                Console.WriteLine("Tabela HistoricoSituacaoContratos criada com sucesso!");
            }
        }
    }
}
