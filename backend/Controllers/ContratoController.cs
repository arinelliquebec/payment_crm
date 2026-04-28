using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContratoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public ContratoController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Contrato
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratos()
        {
            Console.WriteLine($"📋 GetContratos: MÉTODO CHAMADO às {DateTime.Now:HH:mm:ss}");

            try
            {
                Console.WriteLine("🔍 GetContratos: Buscando contratos reais no banco de dados");

                // Garantir que a coluna ParceiroId existe
                await EnsureParceiroIdColumnExists();

                // Buscar contratos reais do banco de dados
                var contratos = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.PessoaFisica)
                    .Where(c => c.Ativo)
                    .ToListAsync();

                Console.WriteLine($"✅ GetContratos: Encontrados {contratos.Count} contratos no banco de dados");

                // Se não há contratos no banco, retornar lista vazia
                if (!contratos.Any())
                {
                    Console.WriteLine("ℹ️ GetContratos: Nenhum contrato encontrado no banco de dados");
                    return Ok(new List<Contrato>());
                }

                // TEMPORÁRIO: Preencher novos campos com valores de exemplo para contratos existentes
                foreach (var contrato in contratos)
                {
                    if (string.IsNullOrEmpty(contrato.NumeroPasta))
                    {
                        contrato.NumeroPasta = $"PASTA-{contrato.Id:000}";
                    }

                    if (string.IsNullOrEmpty(contrato.TipoServico))
                    {
                        contrato.TipoServico = "Consultoria Jurídica";
                    }

                    if (string.IsNullOrEmpty(contrato.ObjetoContrato))
                    {
                        contrato.ObjetoContrato = "Processo de consultoria e acompanhamento jurídico";
                    }

                    if (!contrato.DataFechamentoContrato.HasValue)
                    {
                        contrato.DataFechamentoContrato = contrato.DataCadastro.AddDays(1);
                    }

                    if (!contrato.Comissao.HasValue)
                    {
                        contrato.Comissao = (contrato.ValorDevido ?? 0) * 0.1m; // 10% de comissão
                    }

                    if (!contrato.ValorEntrada.HasValue)
                    {
                        contrato.ValorEntrada = (contrato.ValorDevido ?? 0) * 0.3m; // 30% de entrada
                    }

                    if (!contrato.ValorParcela.HasValue && contrato.ValorDevido.HasValue)
                    {
                        var valorRestante = contrato.ValorDevido.Value - (contrato.ValorEntrada ?? 0);
                        contrato.ValorParcela = valorRestante / 6; // 6 parcelas por padrão
                        contrato.NumeroParcelas = 6;
                    }

                    if (!contrato.PrimeiroVencimento.HasValue)
                    {
                        contrato.PrimeiroVencimento = DateTime.Now.AddDays(30);
                    }

                    if (string.IsNullOrEmpty(contrato.AnexoDocumento))
                    {
                        contrato.AnexoDocumento = $"contrato_{contrato.Id}.pdf";
                    }

                    if (string.IsNullOrEmpty(contrato.Pendencias))
                    {
                        contrato.Pendencias = "Aguardando assinatura do contrato e documentação complementar";
                    }
                }

                return Ok(contratos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetContratos: Erro ao buscar contratos: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Contrato>> GetContrato(int id)
        {
            try
            {
                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.PessoaFisica)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

                if (contrato == null)
                {
                    return NotFound($"Contrato com ID {id} não encontrado");
                }

                return Ok(contrato);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/cliente/5
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratosPorCliente(int clienteId)
        {
            try
            {
                // Mock data para desenvolvimento
                var mockContratos = new List<Contrato>
                {
                    new Contrato
                    {
                        Id = 1,
                        ClienteId = clienteId,
                        Cliente = new Cliente
                        {
                            Id = clienteId,
                            TipoPessoa = "Fisica",
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "João Silva",
                                Cpf = "12345678901"
                            },
                            FilialId = 5
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
                            },
                            FilialId = 1
                        },
                        Situacao = "Leed",
                        DataUltimoContato = DateTime.Now.AddDays(-2),
                        DataProximoContato = DateTime.Now.AddDays(5),
                        ValorDevido = 50000.00m,
                        ValorNegociado = 45000.00m,
                        Observacoes = "Cliente interessado em plano empresarial",
                        DataCadastro = DateTime.Now.AddDays(-10)
                    }
                };

                return Ok(mockContratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/consultor/5
        [HttpGet("consultor/{consultorId}")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratosPorConsultor(int consultorId)
        {
            try
            {
                // Mock data para desenvolvimento
                var mockContratos = new List<Contrato>
                {
                    new Contrato
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
                            },
                            FilialId = 5
                        },
                        ConsultorId = consultorId,
                        Consultor = new Consultor
                        {
                            Id = consultorId,
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "Maria Santos",
                                Cpf = "98765432100"
                            },
                            FilialId = 1
                        },
                        Situacao = "Leed",
                        DataUltimoContato = DateTime.Now.AddDays(-2),
                        DataProximoContato = DateTime.Now.AddDays(5),
                        ValorDevido = 50000.00m,
                        ValorNegociado = 45000.00m,
                        Observacoes = "Cliente interessado em plano empresarial",
                        DataCadastro = DateTime.Now.AddDays(-10)
                    }
                };

                return Ok(mockContratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/situacao/Leed
        [HttpGet("situacao/{situacao}")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratosPorSituacao(string situacao)
        {
            try
            {
                // Mock data para desenvolvimento
                var mockContratos = new List<Contrato>
                {
                    new Contrato
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
                            },
                            FilialId = 5
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
                            },
                            FilialId = 1
                        },
                        Situacao = situacao,
                        DataUltimoContato = DateTime.Now.AddDays(-2),
                        DataProximoContato = DateTime.Now.AddDays(5),
                        ValorDevido = 50000.00m,
                        ValorNegociado = 45000.00m,
                        Observacoes = "Cliente interessado em plano empresarial",
                        DataCadastro = DateTime.Now.AddDays(-10)
                    }
                };

                return Ok(mockContratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/Contrato
        [HttpPost]
        public async Task<IActionResult> CreateContrato(CreateContratoDTO createContratoDTO)
        {
            try
            {
                // Buscar dados reais do cliente e consultor
                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c => c.Id == createContratoDTO.ClienteId);

                var consultor = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == createContratoDTO.ConsultorId);

                // Criar contrato real no banco de dados
                var novoContrato = new Contrato
                {
                    ClienteId = createContratoDTO.ClienteId,
                    ConsultorId = createContratoDTO.ConsultorId,
                    ParceiroId = createContratoDTO.ParceiroId,
                    Situacao = createContratoDTO.Situacao,
                    DataUltimoContato = createContratoDTO.DataUltimoContato,
                    DataProximoContato = createContratoDTO.DataProximoContato,
                    ValorDevido = createContratoDTO.ValorDevido,
                    ValorNegociado = createContratoDTO.ValorNegociado,
                    Observacoes = createContratoDTO.Observacoes,
                    // Novos campos
                    NumeroPasta = createContratoDTO.NumeroPasta,
                    DataFechamentoContrato = createContratoDTO.DataFechamentoContrato,
                    TipoServico = createContratoDTO.TipoServico,
                    ObjetoContrato = createContratoDTO.ObjetoContrato,
                    Comissao = createContratoDTO.Comissao,
                    ValorEntrada = createContratoDTO.ValorEntrada,
                    ValorParcela = createContratoDTO.ValorParcela,
                    NumeroParcelas = createContratoDTO.NumeroParcelas,
                    PrimeiroVencimento = createContratoDTO.PrimeiroVencimento,
                    AnexoDocumento = createContratoDTO.AnexoDocumento,
                    Pendencias = createContratoDTO.Pendencias,
                    DataCadastro = DateTime.Now,
                    Ativo = true
                };

                // Salvar no banco de dados
                _context.Contratos.Add(novoContrato);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ CreateContrato: Contrato criado com ID {novoContrato.Id} no banco de dados");

                // Buscar o contrato criado com todos os dados relacionados
                var contratoCompleto = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.PessoaFisica)
                    .FirstOrDefaultAsync(c => c.Id == novoContrato.Id);

                return CreatedAtAction(nameof(GetContrato), new { id = contratoCompleto.Id }, contratoCompleto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Contrato/5/situacao
        [HttpPut("{id}/situacao")]
        public async Task<IActionResult> UpdateSituacaoContrato(int id, UpdateSituacaoContratoDTO updateDTO)
        {
            Console.WriteLine($"🚀 UpdateSituacaoContrato: MÉTODO CHAMADO! ID={id}, NovaSituacao={updateDTO?.NovaSituacao ?? "NULL"}");
            Console.WriteLine($"🚀 UpdateSituacaoContrato: Request recebido às {DateTime.Now:HH:mm:ss}");

            try
            {
                Console.WriteLine($"🔍 UpdateSituacaoContrato: Buscando contrato com ID {id}");

                // Verificar se há contratos na tabela
                var totalContratos = await _context.Contratos.CountAsync();
                Console.WriteLine($"🔍 UpdateSituacaoContrato: Total de contratos na tabela: {totalContratos}");

                // Listar todos os IDs de contratos para debug
                var idsContratos = await _context.Contratos.Select(c => c.Id).ToListAsync();
                Console.WriteLine($"🔍 UpdateSituacaoContrato: IDs de contratos encontrados: [{string.Join(", ", idsContratos)}]");

                // Buscar o contrato existente com todos os dados relacionados
                var contratoExistente = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contratoExistente == null)
                {
                    Console.WriteLine($"❌ UpdateSituacaoContrato: Contrato com ID {id} não encontrado na tabela");
                    return NotFound($"Contrato com ID {id} não encontrado");
                }

                Console.WriteLine($"✅ UpdateSituacaoContrato: Contrato encontrado - Cliente: {contratoExistente.Cliente?.PessoaFisica?.Nome ?? contratoExistente.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A"}, Consultor: {contratoExistente.Consultor?.PessoaFisica?.Nome ?? "N/A"}");

                // IMPORTANTE: Salvar a situação anterior ANTES de alterar
                var situacaoAnterior = contratoExistente.Situacao;
                Console.WriteLine($"🔄 UpdateSituacaoContrato: Mudando situação de '{situacaoAnterior}' para '{updateDTO.NovaSituacao}'");

                // Atualizar apenas os campos que podem ser alterados
                contratoExistente.Situacao = updateDTO.NovaSituacao;
                // Garantir valores default para colunas NOT NULL
                contratoExistente.DataUltimoContato = updateDTO.DataUltimoContato ?? contratoExistente.DataUltimoContato ?? DateTime.Now;
                contratoExistente.DataProximoContato = updateDTO.DataProximoContato ?? contratoExistente.DataProximoContato ?? DateTime.Now.AddDays(3);

                // Só atualizar valores monetários se não forem null
                if (updateDTO.ValorDevido.HasValue)
                {
                    contratoExistente.ValorDevido = updateDTO.ValorDevido;
                    Console.WriteLine($"💰 UpdateSituacaoContrato: ValorDevido atualizado para {updateDTO.ValorDevido}");
                }
                else
                {
                    Console.WriteLine($"⚠️ UpdateSituacaoContrato: ValorDevido mantido como {contratoExistente.ValorDevido}");
                }

                if (updateDTO.ValorNegociado.HasValue)
                {
                    contratoExistente.ValorNegociado = updateDTO.ValorNegociado;
                    Console.WriteLine($"💰 UpdateSituacaoContrato: ValorNegociado atualizado para {updateDTO.ValorNegociado}");
                }
                else
                {
                    Console.WriteLine($"⚠️ UpdateSituacaoContrato: ValorNegociado mantido como {contratoExistente.ValorNegociado}");
                }

                contratoExistente.Observacoes = updateDTO.Observacoes;
                contratoExistente.DataAtualizacao = DateTime.Now;

                // Salvar as alterações no banco
                Console.WriteLine($"💾 UpdateSituacaoContrato: Salvando alterações do contrato...");
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ UpdateSituacaoContrato: Contrato salvo com sucesso!");

                // Criar histórico de situação
                Console.WriteLine($"📝 UpdateSituacaoContrato: Criando histórico de mudança de situação...");
                var novoHistorico = new HistoricoSituacaoContrato
                {
                    ContratoId = contratoExistente.Id,
                    SituacaoAnterior = situacaoAnterior,
                    NovaSituacao = updateDTO.NovaSituacao,
                    MotivoMudanca = updateDTO.MotivoMudanca ?? "Mudança de situação realizada",
                    DataMudanca = DateTime.Now,
                    DataCadastro = DateTime.Now,
                    Contrato = contratoExistente // Adicionar referência ao contrato
                };

                _context.HistoricoSituacaoContratos.Add(novoHistorico);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ UpdateSituacaoContrato: Histórico criado com sucesso! ID: {novoHistorico.Id}");

                return Ok(new { contrato = contratoExistente, historico = novoHistorico });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UpdateSituacaoContrato: ERRO COMPLETO: {ex}");
                Console.WriteLine($"❌ UpdateSituacaoContrato: Mensagem: {ex.Message}");
                Console.WriteLine($"❌ UpdateSituacaoContrato: StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"❌ UpdateSituacaoContrato: Inner Exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Contrato/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContrato(int id, CreateContratoDTO updateDTO)
        {
            try
            {
                var contrato = await _context.Contratos.FirstOrDefaultAsync(c => c.Id == id && c.Ativo);
                if (contrato == null)
                {
                    return NotFound($"Contrato com ID {id} não encontrado");
                }

                // Atualizar campos
                contrato.ClienteId = updateDTO.ClienteId;
                contrato.ConsultorId = updateDTO.ConsultorId;
                contrato.ParceiroId = updateDTO.ParceiroId;
                contrato.Situacao = updateDTO.Situacao;
                contrato.DataUltimoContato = updateDTO.DataUltimoContato;
                contrato.DataProximoContato = updateDTO.DataProximoContato;
                contrato.ValorDevido = updateDTO.ValorDevido;
                contrato.ValorNegociado = updateDTO.ValorNegociado;
                contrato.Observacoes = updateDTO.Observacoes;
                contrato.NumeroPasta = updateDTO.NumeroPasta;
                contrato.DataFechamentoContrato = updateDTO.DataFechamentoContrato;
                contrato.TipoServico = updateDTO.TipoServico;
                contrato.ObjetoContrato = updateDTO.ObjetoContrato;
                contrato.Comissao = updateDTO.Comissao;
                contrato.ValorEntrada = updateDTO.ValorEntrada;
                contrato.ValorParcela = updateDTO.ValorParcela;
                contrato.NumeroParcelas = updateDTO.NumeroParcelas;
                contrato.PrimeiroVencimento = updateDTO.PrimeiroVencimento;
                contrato.AnexoDocumento = updateDTO.AnexoDocumento;
                contrato.Pendencias = updateDTO.Pendencias;
                contrato.DataAtualizacao = DateTime.Now;

                await _context.SaveChangesAsync();

                // Retornar contrato atualizado com dados relacionados
                var contratoAtualizado = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.PessoaFisica)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id);

                return Ok(contratoAtualizado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // DELETE: api/Contrato/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContrato(int id)
        {
            try
            {
                Console.WriteLine($"🗑️ DeleteContrato: Iniciando exclusão do contrato ID: {id}");

                // Buscar o contrato no banco de dados
                var contrato = await _context.Contratos
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

                if (contrato == null)
                {
                    Console.WriteLine($"❌ DeleteContrato: Contrato ID {id} não encontrado ou já inativo");
                    return NotFound($"Contrato ID {id} não encontrado");
                }

                Console.WriteLine($"✅ DeleteContrato: Contrato ID {id} encontrado, marcando como inativo");

                // Marcar como inativo (soft delete)
                contrato.Ativo = false;
                contrato.DataAtualizacao = DateTime.Now;

                // Salvar as alterações
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ DeleteContrato: Contrato ID {id} marcado como inativo com sucesso");

                return Ok(new {
                    message = $"Contrato {id} removido com sucesso",
                    contratoId = id,
                    deletedAt = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DeleteContrato: Erro ao excluir contrato ID {id}: {ex.Message}");
                Console.WriteLine($"❌ DeleteContrato: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // Método para adicionar coluna ParceiroId na tabela Contratos
        [HttpPost("admin/migrate-columns")]
        public async Task<IActionResult> MigrateColumns()
        {
            try
            {
                Console.WriteLine("🔧 MigrateColumns: Verificando se coluna ParceiroId existe na tabela Contratos");

                // Verificar se a coluna ParceiroId existe
                var parceiroIdExists = await _context.Database
                    .SqlQueryRaw<int>("SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('Contratos') AND name = 'ParceiroId'")
                    .ToListAsync();

                if (parceiroIdExists.FirstOrDefault() == 0)
                {
                    Console.WriteLine("➕ MigrateColumns: Adicionando coluna ParceiroId");
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE Contratos ADD ParceiroId int NULL");
                    Console.WriteLine("✅ MigrateColumns: Coluna ParceiroId adicionada com sucesso");
                }
                else
                {
                    Console.WriteLine("ℹ️ MigrateColumns: Coluna ParceiroId já existe");
                }

                return Ok(new { message = "Migração de colunas concluída com sucesso" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ MigrateColumns: Erro durante migração: {ex.Message}");
                return StatusCode(500, $"Erro durante migração: {ex.Message}");
            }
        }

        private async Task EnsureParceiroIdColumnExists()
        {
            try
            {
                Console.WriteLine("🔧 EnsureParceiroIdColumnExists: Verificando se coluna ParceiroId existe na tabela Contratos");

                // Verificar se a coluna ParceiroId existe
                var parceiroIdExists = await _context.Database
                    .SqlQueryRaw<int>("SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('Contratos') AND name = 'ParceiroId'")
                    .ToListAsync();

                if (parceiroIdExists.FirstOrDefault() == 0)
                {
                    Console.WriteLine("➕ EnsureParceiroIdColumnExists: Adicionando coluna ParceiroId");
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE Contratos ADD ParceiroId int NULL");
                    Console.WriteLine("✅ EnsureParceiroIdColumnExists: Coluna ParceiroId adicionada com sucesso");
                }
                else
                {
                    Console.WriteLine("ℹ️ EnsureParceiroIdColumnExists: Coluna ParceiroId já existe");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ EnsureParceiroIdColumnExists: Erro: {ex.Message}");
            }
        }
    }
}
