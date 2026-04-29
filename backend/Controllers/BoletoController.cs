using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using System.Text.Json;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BoletoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly ISantanderBoletoService _santanderService;
        private readonly ILogger<BoletoController> _logger;
        private readonly IAuthorizationService _authorizationService;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly INotificacaoService _notificacaoService;
        private readonly IAzureBlobStorageService _blobStorageService;
        private readonly IAuditService _auditService;

        public BoletoController(
            CrmArrighiContext context,
            ISantanderBoletoService santanderService,
            ILogger<BoletoController> logger,
            IAuthorizationService authorizationService,
            IConfiguration configuration,
            IEmailService emailService,
            INotificacaoService notificacaoService,
            IAzureBlobStorageService blobStorageService,
            IAuditService auditService)
        {
            _context = context;
            _santanderService = santanderService;
            _logger = logger;
            _authorizationService = authorizationService;
            _configuration = configuration;
            _emailService = emailService;
            _notificacaoService = notificacaoService;
            _blobStorageService = blobStorageService;
            _auditService = auditService;
        }

        // GET: api/Boleto
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BoletoResponseDTO>>> GetBoletos(
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null)
        {
            try
            {
                _logger.LogInformation("🔍 GetBoletos: Iniciando busca de boletos");
                if (dataInicio.HasValue || dataFim.HasValue)
                {
                    _logger.LogInformation($"📅 Filtro de data: {dataInicio?.ToString("yyyy-MM-dd")} até {dataFim?.ToString("yyyy-MM-dd")}");
                }

                // Obter usuário logado para aplicar filtragem por filial
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                _logger.LogInformation($"🔍 GetBoletos: X-Usuario-Id header = {usuarioIdHeader}");

                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    _logger.LogWarning("❌ GetBoletos: Usuário não identificado");
                    return Unauthorized("Usuário não identificado na requisição.");
                }

                _logger.LogInformation($"🔍 GetBoletos: UsuarioId identificado = {usuarioId}");

                var boletosQuery = _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.Filial);

                _logger.LogInformation("🔍 GetBoletos: Query base criada, aplicando filtros de autorização");

                // Aplicar filtragem por permissões de usuário (incluindo filial para Gestor de Filial)
                var boletosFiltrados = await _authorizationService.FilterBoletosByUserAsync(usuarioId, boletosQuery);

                _logger.LogInformation("🔍 GetBoletos: Filtros aplicados, executando query no banco");

                var boletos = await boletosFiltrados.OrderByDescending(b => b.DataCadastro).ToListAsync();

                _logger.LogInformation($"✅ GetBoletos: Encontrados {boletos.Count} boletos para usuário {usuarioId}");

                // Aplicar filtro de data APÓS carregar do banco
                if (dataInicio.HasValue || dataFim.HasValue)
                {
                    boletos = boletos.Where(b =>
                    {
                        // Filtrar por data de emissão (IssueDate)
                        var dataEmissao = b.IssueDate.Date;

                        // Verificar se a data de emissão está no período
                        if (dataInicio.HasValue && dataEmissao < dataInicio.Value.Date)
                            return false;
                        if (dataFim.HasValue && dataEmissao > dataFim.Value.Date)
                            return false;

                        return true;
                    }).ToList();

                    _logger.LogInformation($"📅 Após filtro de data: {boletos.Count} boletos");
                }

                var response = boletos.Select(MapearBoletoParaResponse).ToList();

                _logger.LogInformation($"✅ GetBoletos: Response preparada com {response.Count} boletos");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ GetBoletos: Erro completo: {ex.Message} | StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { erro = "Erro interno do servidor", detalhes = ex.Message, tipo = ex.GetType().Name });
            }
        }

        // GET: api/Boleto/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BoletoResponseDTO>> GetBoleto(int id)
        {
            try
            {
                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (boleto == null)
                {
                    return NotFound($"Boleto com ID {id} não encontrado");
                }

                var response = MapearBoletoParaResponse(boleto);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar boleto ID: {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/Boleto/contrato/5
        [HttpGet("contrato/{contratoId}")]
        public async Task<ActionResult<IEnumerable<BoletoResponseDTO>>> GetBoletosPorContrato(int contratoId)
        {
            try
            {
                var boletos = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .Where(b => b.ContratoId == contratoId)
                    .OrderByDescending(b => b.DataCadastro)
                    .ToListAsync();

                var response = boletos.Select(MapearBoletoParaResponse).ToList();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar boletos do contrato ID: {ContratoId}", contratoId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // POST: api/Boleto
        [HttpPost]
        public async Task<ActionResult<BoletoResponseDTO>> PostBoleto(CreateBoletoDTO dto)
        {
            try
            {
                _logger.LogInformation("🔔 Iniciando criação de boleto para contrato ID: {ContratoId}", dto.ContratoId);
                _logger.LogInformation("🔔 Dados recebidos: ContratoId={ContratoId}, Valor={Valor}, Vencimento={Vencimento}",
                    dto.ContratoId, dto.NominalValue, dto.DueDate);

                // Validar se o contrato existe
                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                            .ThenInclude(pf => pf.Endereco)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                            .ThenInclude(pj => pj.Endereco)
                    .FirstOrDefaultAsync(c => c.Id == dto.ContratoId);

                if (contrato == null)
                {
                    _logger.LogWarning("❌ Tentativa de criar boleto para contrato inexistente: {ContratoId}", dto.ContratoId);
                    return NotFound(new {
                        recurso = "Contrato",
                        id = dto.ContratoId,
                        mensagem = $"Contrato #{dto.ContratoId} não foi encontrado no banco de dados",
                        detalhes = "Verifique se o contrato existe antes de criar o boleto"
                    });
                }

                _logger.LogInformation("✅ Contrato encontrado: {ContratoId}", contrato.Id);

                // Validar se cliente tem dados necessários
                if (contrato.Cliente == null)
                {
                    _logger.LogError("❌ Contrato {ContratoId} não possui cliente associado", dto.ContratoId);
                    return BadRequest(new { mensagem = "Contrato não possui cliente associado" });
                }

                _logger.LogInformation("✅ Cliente associado ao contrato");

                // ========================================================================
                // PROCESSAMENTO DE BOLETO MANUAL COM TIPO SELECIONADO PELO USUÁRIO
                // Tipos: AVULSO, RENEGOCIACAO, ANTECIPACAO
                // Se não informado, usa comportamento legado (detecção automática)
                // ========================================================================
                
                var tipoBoletoManual = dto.TipoBoletoManual;
                var parcelasSelecionadas = dto.ParcelasSelecionadas ?? new List<ParcelaSelecionadaDTO>();
                
                // Variáveis para controle de fluxo
                int? parcelaParaUsar = null;
                bool isRenegociacao = tipoBoletoManual == TipoBoletoManual.RENEGOCIACAO;
                bool isAntecipacao = tipoBoletoManual == TipoBoletoManual.ANTECIPACAO;
                bool isAvulso = tipoBoletoManual == TipoBoletoManual.AVULSO;
                bool temTipoExplicito = tipoBoletoManual.HasValue;
                List<int> parcelasCobertas = new();
                List<int> boletosOriginaisRenegociados = new();
                
                _logger.LogInformation("📋 Tipo de boleto manual: {Tipo}, Parcelas selecionadas: {Count}",
                    tipoBoletoManual?.ToString() ?? "NÃO INFORMADO (legado)", parcelasSelecionadas.Count);
                
                // ========================================================================
                // VALIDAÇÃO: Se é RENEGOCIAÇÃO ou ANTECIPAÇÃO, precisa ter parcelas selecionadas
                // ========================================================================
                if ((isRenegociacao || isAntecipacao) && !parcelasSelecionadas.Any())
                {
                    var tipoNome = isRenegociacao ? "renegociação" : "antecipação";
                    _logger.LogWarning("⚠️ Boleto de {Tipo} sem parcelas selecionadas", tipoNome);
                    return BadRequest(new {
                        erro = "Parcelas não informadas",
                        mensagem = $"Para boletos de {tipoNome}, é necessário selecionar as parcelas que serão cobertas.",
                        sugestao = "Use o endpoint GET /api/Boleto/contrato/{id}/parcelas-disponiveis para listar as parcelas disponíveis"
                    });
                }
                
                // ========================================================================
                // PROCESSAMENTO DE RENEGOCIAÇÃO COM PARCELAS SELECIONADAS
                // ========================================================================
                if (isRenegociacao && parcelasSelecionadas.Any())
                {
                    _logger.LogInformation("🔄 RENEGOCIAÇÃO: Processando {Count} parcela(s) selecionada(s)", parcelasSelecionadas.Count);
                    
                    // Validar se as parcelas selecionadas existem e estão BAIXADO_NAO_PAGO
                    foreach (var parcelaSel in parcelasSelecionadas)
                    {
                        if (!parcelaSel.BoletoId.HasValue)
                        {
                            return BadRequest(new
                            {
                                erro = "Boleto original obrigatório",
                                mensagem = "Na renegociação, cada parcela selecionada deve informar o BoletoId original BAIXADO não pago.",
                                sugestao = "Use o endpoint GET /api/Boleto/contrato/{id}/parcelas-disponiveis e envie exatamente os itens de ParcelasRenegociacao."
                            });
                        }

                        var boletoOriginal = await _context.Boletos
                            .FirstOrDefaultAsync(b => b.Id == parcelaSel.BoletoId &&
                                                     b.ContratoId == dto.ContratoId &&
                                                     b.Ativo &&
                                                     b.Status == "BAIXADO" &&
                                                     !b.FoiPago);

                        if (boletoOriginal == null)
                        {
                            return BadRequest(new {
                                erro = "Boleto inválido para renegociação",
                                mensagem = $"Boleto #{parcelaSel.BoletoId} não está disponível para renegociação",
                                sugestao = "Verifique se o boleto existe, está BAIXADO e não foi pago"
                            });
                        }

                        if (!boletoOriginal.NumeroParcela.HasValue)
                        {
                            return BadRequest(new
                            {
                                erro = "Boleto sem parcela válida",
                                mensagem = $"Boleto #{parcelaSel.BoletoId} não possui NúmeroParcela para renegociação.",
                                sugestao = "Selecione outro boleto em atraso retornado pelo endpoint de parcelas disponíveis."
                            });
                        }

                        if (parcelaSel.NumeroParcela != boletoOriginal.NumeroParcela.Value)
                        {
                            return BadRequest(new
                            {
                                erro = "Parcela divergente",
                                mensagem = $"Parcela informada ({parcelaSel.NumeroParcela}) difere da parcela original do boleto #{parcelaSel.BoletoId} ({boletoOriginal.NumeroParcela}).",
                                sugestao = "Recarregue as parcelas disponíveis e envie os dados exatamente como retornados."
                            });
                        }

                        parcelasCobertas.Add(parcelaSel.NumeroParcela);
                        boletosOriginaisRenegociados.Add(parcelaSel.BoletoId.Value);
                    }
                    
                    // Se só uma parcela, usar como NumeroParcela do novo boleto
                    if (parcelasSelecionadas.Count == 1)
                    {
                        parcelaParaUsar = parcelasSelecionadas[0].NumeroParcela;
                        _logger.LogInformation("🔄 RENEGOCIAÇÃO SIMPLES: Nova parcela assumirá número {Parcela}", parcelaParaUsar);
                    }
                    else
                    {
                        // Múltiplas parcelas - criar como avulso com referência às parcelas
                        parcelaParaUsar = null;
                        _logger.LogInformation("🔄 RENEGOCIAÇÃO MÚLTIPLAS: {Count} parcelas serão cobertas: [{Parcelas}]",
                            parcelasSelecionadas.Count, string.Join(", ", parcelasCobertas));
                    }
                    
                    // Marcar boletos originais como renegociados
                    foreach (var boletoId in boletosOriginaisRenegociados)
                    {
                        var boletoOriginal = await _context.Boletos.FindAsync(boletoId);
                        if (boletoOriginal != null)
                        {
                            boletoOriginal.NumeroParcela = null; // Marcar como avulso
                            boletoOriginal.DataAtualizacao = DateTime.Now;
                            _logger.LogInformation("✅ Boleto #{BoletoId} marcado como AVULSO (renegociado)", boletoId);
                        }
                    }
                    await _context.SaveChangesAsync();
                }
                
                // ========================================================================
                // PROCESSAMENTO DE ANTECIPAÇÃO COM PARCELAS SELECIONADAS
                // ========================================================================
                else if (isAntecipacao && parcelasSelecionadas.Any())
                {
                    _logger.LogInformation("⏩ ANTECIPAÇÃO: Processando {Count} parcela(s) selecionada(s)", parcelasSelecionadas.Count);
                    
                    foreach (var parcelaSel in parcelasSelecionadas)
                    {
                        parcelasCobertas.Add(parcelaSel.NumeroParcela);
                    }
                    
                    // Se só uma parcela, usar como NumeroParcela do novo boleto
                    if (parcelasSelecionadas.Count == 1)
                    {
                        parcelaParaUsar = parcelasSelecionadas[0].NumeroParcela;
                        _logger.LogInformation("⏩ ANTECIPAÇÃO SIMPLES: Nova parcela assumirá número {Parcela}", parcelaParaUsar);
                    }
                    else
                    {
                        // Múltiplas parcelas - criar como avulso com referência às parcelas
                        parcelaParaUsar = null;
                        _logger.LogInformation("⏩ ANTECIPAÇÃO MÚLTIPLAS: {Count} parcelas serão cobertas: [{Parcelas}]",
                            parcelasSelecionadas.Count, string.Join(", ", parcelasCobertas));
                    }
                }
                
                // ========================================================================
                // BOLETO AVULSO: Não afeta parcelas do contrato
                // ========================================================================
                else if (isAvulso)
                {
                    _logger.LogInformation("📄 AVULSO: Boleto não afetará parcelas do contrato (acordo especial/outros contratos)");
                    parcelaParaUsar = null;
                }
                
                // ========================================================================
                // COMPORTAMENTO LEGADO: Detectar automaticamente se não informou tipo
                // ========================================================================
                else if (!temTipoExplicito)
                {
                    _logger.LogInformation("🔄 MODO LEGADO: Tipo não informado, usando detecção automática...");
                    
                    // Verificar se existe boleto BAIXADO não pago (renegociação automática)
                    var boletoBaixadoMaisAntigo = await _context.Boletos
                        .Where(b => b.ContratoId == dto.ContratoId &&
                                   b.Ativo &&
                                   b.Status == "BAIXADO" &&
                                   !b.FoiPago &&
                                   b.NumeroParcela.HasValue)
                        .OrderBy(b => b.NumeroParcela)
                        .FirstOrDefaultAsync();

                    if (boletoBaixadoMaisAntigo != null)
                    {
                        var valorParcela = contrato.ValorParcela ?? 0;
                        var valorNovoBoleto = dto.NominalValue;
                        var toleranciaMaxima = valorParcela * 1.5m;
                        
                        if (valorParcela > 0 && valorNovoBoleto <= toleranciaMaxima)
                        {
                            parcelaParaUsar = boletoBaixadoMaisAntigo.NumeroParcela;
                            isRenegociacao = true;
                            boletosOriginaisRenegociados.Add(boletoBaixadoMaisAntigo.Id);
                            
                            _logger.LogInformation("🔄 RENEGOCIAÇÃO LEGADO: Boleto #{BoletoId} BAIXADO (parcela {Parcela}). Novo boleto R$ {ValorNovo:N2} assumirá esta parcela.",
                                boletoBaixadoMaisAntigo.Id, parcelaParaUsar, valorNovoBoleto);
                            
                            boletoBaixadoMaisAntigo.NumeroParcela = null;
                            boletoBaixadoMaisAntigo.DataAtualizacao = DateTime.Now;
                            await _context.SaveChangesAsync();
                        }
                        else
                        {
                            isRenegociacao = true;
                            var parcelasEstimadas = valorParcela > 0 ? Math.Round(valorNovoBoleto / valorParcela) : 0;
                            
                            _logger.LogInformation("🔄 RENEGOCIAÇÃO MÚLTIPLAS LEGADO: Novo boleto R$ {ValorNovo:N2} (~{ParcelasEstimadas} parcelas de R$ {ValorParcela:N2}). Será criado como AVULSO.",
                                valorNovoBoleto, parcelasEstimadas, valorParcela);
                        }
                    }
                }
                
                // ========================================================================
                // VALIDAÇÃO ANTI-DUPLICATA
                // Pula validação se for RENEGOCIAÇÃO, ANTECIPAÇÃO ou AVULSO explícito
                // ========================================================================
                bool pulaValidacaoDuplicata = isRenegociacao || isAntecipacao || isAvulso;
                
                // Calcular número da parcela que seria gerada (baseado no mês)
                int? numeroParcelaCalculada = null;
                if (contrato.PrimeiroVencimento.HasValue && !pulaValidacaoDuplicata)
                {
                    var primeiroVencimento = contrato.PrimeiroVencimento.Value;
                    var mesesDiferenca = ((dto.DueDate.Year - primeiroVencimento.Year) * 12) +
                                         (dto.DueDate.Month - primeiroVencimento.Month);
                    numeroParcelaCalculada = mesesDiferenca + 1;
                    if (numeroParcelaCalculada < 1) numeroParcelaCalculada = 1;
                }

                // Verificar se já existe boleto ativo para esta parcela
                if (numeroParcelaCalculada.HasValue && !pulaValidacaoDuplicata)
                {
                    var boletoParcelaExistente = await _context.Boletos
                        .Where(b => b.ContratoId == dto.ContratoId &&
                                   b.NumeroParcela == numeroParcelaCalculada &&
                                   b.Ativo &&
                                   b.Status != "ERRO" && b.Status != "CANCELADO" &&
                                   !(b.Status == "BAIXADO" && !b.FoiPago))
                        .Select(b => new { b.Id, b.NsuCode, b.DueDate, b.Status, b.FoiPago })
                        .FirstOrDefaultAsync();

                    if (boletoParcelaExistente != null)
                    {
                        var statusDisplay = boletoParcelaExistente.FoiPago ? "PAGO" : boletoParcelaExistente.Status;
                        _logger.LogWarning("⚠️ DUPLICATA BLOQUEADA: Já existe boleto #{BoletoId} (NSU {Nsu}) para parcela {Parcela} do contrato #{ContratoId} - Status: {Status}",
                            boletoParcelaExistente.Id, boletoParcelaExistente.NsuCode, numeroParcelaCalculada, dto.ContratoId, statusDisplay);
                        
                        return Conflict(new {
                            erro = "Boleto duplicado",
                            mensagem = $"Já existe um boleto {(boletoParcelaExistente.FoiPago ? "PAGO" : "ativo")} para a parcela {numeroParcelaCalculada} deste contrato",
                            boletoExistente = new {
                                id = boletoParcelaExistente.Id,
                                nsu = boletoParcelaExistente.NsuCode,
                                vencimento = boletoParcelaExistente.DueDate.ToString("dd/MM/yyyy"),
                                status = statusDisplay
                            },
                            sugestao = boletoParcelaExistente.FoiPago 
                                ? "Esta parcela já foi paga. Não é necessário gerar novo boleto." 
                                : "Verifique se o boleto já foi gerado antes de criar um novo"
                        });
                    }
                }
                else if (pulaValidacaoDuplicata)
                {
                    var tipoStr = isRenegociacao ? "RENEGOCIAÇÃO" : (isAntecipacao ? "ANTECIPAÇÃO" : "AVULSO");
                    _logger.LogInformation("🔄 {Tipo}: Pulando verificação de duplicata por parcela/mês.", tipoStr);
                }

                _logger.LogInformation("✅ Validação anti-duplicata passou - {Motivo}", 
                    pulaValidacaoDuplicata ? $"Tipo: {(isRenegociacao ? "RENEGOCIAÇÃO" : (isAntecipacao ? "ANTECIPAÇÃO" : "AVULSO"))}" : "Nenhum boleto existente encontrado");
                // ========================================================================

                // Gerar NSU Code único
                var nsuCode = await _santanderService.GerarProximoNsuCodeAsync();
                var nsuDate = DateTime.Today;

                _logger.LogInformation("✅ NSU Code gerado: {NsuCode}", nsuCode);

                // Criar boleto
                var boleto = await CriarBoletoFromDTO(dto, contrato, nsuCode, nsuDate);

                // ========================================================================
                // DEFINIR NÚMERO DA PARCELA E CAMPOS DE BOLETO MANUAL
                // - RENEGOCIAÇÃO/ANTECIPAÇÃO com 1 parcela → usa NumeroParcela específica
                // - RENEGOCIAÇÃO/ANTECIPAÇÃO múltiplas → NULL com ParcelasCobertas
                // - AVULSO → NULL (não afeta parcelas)
                // - LEGADO → calcula baseado no mês do vencimento
                // ========================================================================
                
                // Definir campos de tipo de boleto manual e parcelas cobertas
                if (isRenegociacao)
                {
                    boleto.TipoBoletoManual = "RENEGOCIACAO";
                    if (parcelasCobertas.Any())
                    {
                        boleto.ParcelasCobertas = System.Text.Json.JsonSerializer.Serialize(parcelasCobertas);
                    }
                    if (boletosOriginaisRenegociados.Any())
                    {
                        boleto.BoletosOriginaisRenegociados = System.Text.Json.JsonSerializer.Serialize(boletosOriginaisRenegociados);
                    }
                }
                else if (isAntecipacao)
                {
                    boleto.TipoBoletoManual = "ANTECIPACAO";
                    if (parcelasCobertas.Any())
                    {
                        boleto.ParcelasCobertas = System.Text.Json.JsonSerializer.Serialize(parcelasCobertas);
                    }
                }
                else if (isAvulso)
                {
                    boleto.TipoBoletoManual = "AVULSO";
                }
                
                // Definir NumeroParcela baseado no tipo
                if (parcelaParaUsar.HasValue)
                {
                    // Renegociação/Antecipação simples (1 parcela)
                    boleto.NumeroParcela = parcelaParaUsar.Value;
                    var tipoStr = isRenegociacao ? "RENEGOCIAÇÃO" : (isAntecipacao ? "ANTECIPAÇÃO" : "MANUAL");
                    _logger.LogInformation("📊 NumeroParcela = {NumeroParcela} ({Tipo} simples)", parcelaParaUsar.Value, tipoStr);
                }
                else if (isRenegociacao || isAntecipacao || isAvulso)
                {
                    // Múltiplas parcelas ou avulso - deixar como NULL
                    boleto.NumeroParcela = null;
                    var tipoStr = isRenegociacao ? "RENEGOCIAÇÃO" : (isAntecipacao ? "ANTECIPAÇÃO" : "AVULSO");
                    
                    if (parcelasCobertas.Any())
                    {
                        _logger.LogInformation("📊 NumeroParcela = NULL ({Tipo} de múltiplas parcelas). Parcelas cobertas: [{Parcelas}]",
                            tipoStr, string.Join(", ", parcelasCobertas));
                    }
                    else
                    {
                        _logger.LogInformation("📊 NumeroParcela = NULL ({Tipo}). Este boleto não afetará a geração automática.",
                            tipoStr);
                    }
                }
                else if (contrato.PrimeiroVencimento.HasValue)
                {
                    // Calcular NumeroParcela baseado na data de vencimento
                    var primeiroVencimento = contrato.PrimeiroVencimento.Value;
                    var dataVencimentoBoleto = dto.DueDate;
                    var diaVencimentoOriginal = primeiroVencimento.Day;
                    var diaVencimentoBoleto = dataVencimentoBoleto.Day;

                    // ========================================================================
                    // VERIFICAR SE O VENCIMENTO É ANTES DO PRIMEIRO VENCIMENTO DO CONTRATO
                    // Se for antes, é um boleto AVULSO (cobrança de algo antigo/especial)
                    // e não deve bloquear a geração automática das parcelas regulares
                    // ========================================================================
                    if (dataVencimentoBoleto.Date < primeiroVencimento.Date)
                    {
                        // Vencimento ANTES do início do contrato - marcar como AVULSO
                        boleto.NumeroParcela = null;
                        _logger.LogInformation("📊 NumeroParcela = NULL (boleto AVULSO). Motivo: Vencimento {DataBoleto} é ANTERIOR ao PrimeiroVencimento do contrato {PrimeiroVenc}. Este boleto não bloqueará a geração automática.",
                            dataVencimentoBoleto.ToString("dd/MM/yyyy"), primeiroVencimento.ToString("dd/MM/yyyy"));
                    }
                    // ========================================================================
                    // VERIFICAR SE O VENCIMENTO ESTÁ FORA DO DIA ORIGINAL
                    // Se o dia do vencimento estiver fora de uma tolerância de ±5 dias,
                    // marcar como boleto AVULSO para não interferir na geração automática
                    // ========================================================================
                    else
                    {
                        const int TOLERANCIA_DIAS = 5;
                        var diferencaDias = Math.Abs(diaVencimentoOriginal - diaVencimentoBoleto);
                        
                        // Considerar também virada de mês (ex: dia 28 vs dia 2 do próximo mês)
                        var ultimoDiaMes = DateTime.DaysInMonth(dataVencimentoBoleto.Year, dataVencimentoBoleto.Month);
                        if (diaVencimentoOriginal > ultimoDiaMes)
                        {
                            // Se o dia original não existe no mês (ex: 31 em fevereiro), ajustar
                            diferencaDias = Math.Abs(ultimoDiaMes - diaVencimentoBoleto);
                        }

                        if (diferencaDias > TOLERANCIA_DIAS)
                        {
                            // Vencimento fora do dia original - marcar como AVULSO
                            boleto.NumeroParcela = null;
                            _logger.LogInformation("📊 NumeroParcela = NULL (boleto AVULSO). Motivo: Vencimento dia {DiaBoleto} fora do dia original {DiaOriginal} (tolerância ±{Tolerancia} dias). Este boleto não bloqueará a geração automática.",
                                diaVencimentoBoleto, diaVencimentoOriginal, TOLERANCIA_DIAS);
                        }
                        else
                        {
                            // Vencimento dentro da tolerância - calcular parcela normalmente
                            var mesesDiferenca = ((dataVencimentoBoleto.Year - primeiroVencimento.Year) * 12) +
                                                 (dataVencimentoBoleto.Month - primeiroVencimento.Month);

                            var numeroParcela = mesesDiferenca + 1;
                            if (numeroParcela < 1) numeroParcela = 1;

                            boleto.NumeroParcela = numeroParcela;

                            _logger.LogInformation("📊 NumeroParcela calculado automaticamente: {NumeroParcela} (PrimeiroVencimento: {PrimeiroVencimento}, DueDate: {DueDate})",
                                numeroParcela, primeiroVencimento.ToString("dd/MM/yyyy"), dataVencimentoBoleto.ToString("dd/MM/yyyy"));
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ Contrato {ContratoId} não possui PrimeiroVencimento, NumeroParcela não será definido", contrato.Id);
                }

                _logger.LogInformation("✅ Boleto criado em memória, preparando para registrar no Santander...");

                // Registrar na API Santander
                try
                {
                    var santanderResponse = await _santanderService.RegistrarBoletoAsync(boleto);

                    // Atualizar boleto com dados de resposta
                    AtualizarBoletoComResposta(boleto, santanderResponse);
                    boleto.Status = "REGISTRADO";

                    _logger.LogInformation("✅ Boleto registrado no Santander com sucesso");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro ao registrar boleto na API Santander");
                    boleto.Status = "ERRO";
                    boleto.ErrorMessage = ex.Message;
                    boleto.ErrorCode = "API_ERROR";
                }

                // Salvar no banco
                _context.Boletos.Add(boleto);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Boleto salvo no banco de dados. ID: {Id}, NSU: {NsuCode}", boleto.Id, boleto.NsuCode);

                // Enviar email automaticamente se configurado e boleto registrado com sucesso
                EnvioEmailBoletoResult? resultadoEmail = null;
                var enviarAutomaticamente = _configuration.GetValue<bool>("Email:EnviarBoletoAutomaticamente", true);

                if (enviarAutomaticamente && boleto.Status == "REGISTRADO")
                {
                    var emailCliente = contrato.Cliente?.PessoaFisica?.EmailEmpresarial
                                    ?? contrato.Cliente?.PessoaJuridica?.Email;

                    if (!string.IsNullOrWhiteSpace(emailCliente))
                    {
                        _logger.LogInformation("📧 Enviando boleto por email para: {Email}", emailCliente);
                        resultadoEmail = await EnviarBoletoEmailInternoAsync(boleto, emailCliente);

                        if (resultadoEmail.Sucesso)
                        {
                            _logger.LogInformation("✅ Email enviado com sucesso para: {Email}", emailCliente);
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Falha ao enviar email: {Erro}", resultadoEmail.Erro);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ Cliente não possui email cadastrado. Boleto não será enviado por email.");
                        resultadoEmail = new EnvioEmailBoletoResult
                        {
                            Sucesso = false,
                            Erro = "Cliente não possui email cadastrado",
                            EmailDestino = null
                        };
                    }
                }

                var response = MapearBoletoParaResponse(boleto);

                // Auditoria de criação de boleto
                var usuarioIdHeaderCreate = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeaderCreate, out int usuarioIdCreate);
                var nomeClienteBoleto = contrato.Cliente?.PessoaFisica?.Nome
                    ?? contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";
                await _auditService.LogAsync(
                    usuarioIdCreate, "Create", "Boleto", boleto.Id,
                    $"Boleto #{boleto.Id} criado | Cliente: {nomeClienteBoleto} | Contrato: #{contrato.Id} | Valor: R$ {boleto.NominalValue:N2} | Vencimento: {boleto.DueDate:dd/MM/yyyy} | Tipo: {boleto.TipoPagamento ?? "Boleto"}{(boleto.NumeroParcela.HasValue ? $" | Parcela: {boleto.NumeroParcela}" : "")}",
                    "Boletos",
                    valorNovo: new {
                        boleto.Id,
                        Cliente = nomeClienteBoleto,
                        ContratoId = contrato.Id,
                        boleto.NominalValue,
                        boleto.DueDate,
                        boleto.TipoPagamento,
                        boleto.NumeroParcela,
                        boleto.Status,
                        boleto.NsuCode
                    },
                    httpContext: HttpContext);

                // Adicionar informação do envio de email na resposta
                return CreatedAtAction(nameof(GetBoleto), new { id = boleto.Id }, new
                {
                    boleto = response,
                    email = resultadoEmail != null ? new
                    {
                        enviado = resultadoEmail.Sucesso,
                        destino = resultadoEmail.EmailDestino,
                        erro = resultadoEmail.Erro
                    } : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ERRO CRÍTICO ao criar boleto: {Message}", ex.Message);
                _logger.LogError("❌ Stack trace: {StackTrace}", ex.StackTrace);
                return StatusCode(500, new {
                    mensagem = "Erro interno do servidor",
                    detalhes = ex.Message,
                    tipo = ex.GetType().Name
                });
            }
        }

        // PUT: api/Boleto/sincronizar-cancelados
        // Endpoint para sincronizar boletos que estão CANCELADOS/INATIVOS no sistema
        // mas podem ter status diferente no Santander (detectar fraudes/inconsistências)
        [HttpPut("sincronizar-cancelados")]
        public async Task<ActionResult<object>> SincronizarBoletosCancelados()
        {
            try
            {
                _logger.LogInformation("🔍 Iniciando sincronização de boletos CANCELADOS/INATIVOS para auditoria");

                // Buscar boletos que estão INATIVOS ou com status CANCELADO
                var boletos = await _context.Boletos
                    .Where(b => !b.Ativo || b.Status == "CANCELADO")
                    .ToListAsync();

                _logger.LogInformation("📊 Encontrados {Total} boletos cancelados/inativos para verificar", boletos.Count);

                var beneficiaryCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";

                int sucessoCount = 0;
                int erroCount = 0;
                int inconsistenciasCount = 0;
                var inconsistenciasList = new List<object>();
                var atualizadosList = new List<object>();
                var errosList = new List<object>();

                foreach (var boleto in boletos)
                {
                    try
                    {
                        var statusAnteriorSistema = boleto.Status;
                        var ativoAnterior = boleto.Ativo;

                        // Consultar status na API Santander
                        var statusResponse = await _santanderService.ConsultarStatusPorNossoNumeroAsync(beneficiaryCode, boleto.BankNumber);

                        var statusSantander = statusResponse.Status;
                        var foiPagoSantander = statusResponse.FoiPago;
                        var valorPagoSantander = statusResponse.PaidValue ?? 0;

                        // Verificar inconsistência: Sistema diz CANCELADO mas Santander diz diferente
                        bool temInconsistencia = false;
                        string motivoInconsistencia = "";

                        if (statusAnteriorSistema == "CANCELADO" && statusSantander != "CANCELADO")
                        {
                            temInconsistencia = true;
                            motivoInconsistencia = $"Sistema: CANCELADO, Santander: {statusSantander}";
                            
                            if (foiPagoSantander)
                            {
                                motivoInconsistencia += $" - PAGO R$ {valorPagoSantander:N2}!";
                            }
                        }

                        if (!ativoAnterior && statusSantander != "CANCELADO" && statusSantander != "BAIXADO")
                        {
                            temInconsistencia = true;
                            motivoInconsistencia = $"Sistema: INATIVO, Santander: {statusSantander}";
                        }

                        // Atualizar status no banco para refletir o Santander
                        boleto.Status = statusSantander ?? boleto.Status;
                        boleto.Ativo = true; // Reativar boleto
                        boleto.DataAtualizacao = DateTime.Now;
                        
                        if (foiPagoSantander)
                        {
                            boleto.FoiPago = true;
                            boleto.ValorPago = valorPagoSantander;
                            // Usar SettlementDate se disponível, senão usar data atual
                            if (!string.IsNullOrEmpty(statusResponse.SettlementDate) && DateTime.TryParse(statusResponse.SettlementDate, out var settlementDate))
                            {
                                boleto.DataPagamento = settlementDate;
                            }
                            else if (!boleto.DataPagamento.HasValue)
                            {
                                boleto.DataPagamento = DateTime.Now;
                            }
                        }

                        await _context.SaveChangesAsync();

                        // 🔄 Processar renegociação automática se for boleto avulso pago
                        if (foiPagoSantander && !boleto.NumeroParcela.HasValue)
                        {
                            await ProcessarRenegociacaoAutomaticaAsync(boleto);
                        }

                        sucessoCount++;

                        if (temInconsistencia)
                        {
                            inconsistenciasCount++;
                            var inconsistencia = new
                            {
                                BoletoId = boleto.Id,
                                NsuCode = boleto.NsuCode,
                                ContratoId = boleto.ContratoId,
                                Valor = boleto.NominalValue,
                                Vencimento = boleto.DueDate.ToString("dd/MM/yyyy"),
                                StatusSistemaAnterior = statusAnteriorSistema,
                                AtivoAnterior = ativoAnterior,
                                StatusSantander = statusSantander,
                                FoiPago = foiPagoSantander,
                                ValorPago = valorPagoSantander,
                                Motivo = motivoInconsistencia,
                                Acao = "CORRIGIDO - Status atualizado para refletir Santander"
                            };

                            inconsistenciasList.Add(inconsistencia);
                            
                            _logger.LogWarning("⚠️ INCONSISTÊNCIA DETECTADA - Boleto #{Id}: {Motivo}", 
                                boleto.Id, motivoInconsistencia);
                        }

                        atualizadosList.Add(new
                        {
                            BoletoId = boleto.Id,
                            NsuCode = boleto.NsuCode,
                            StatusAnterior = statusAnteriorSistema,
                            StatusNovo = boleto.Status,
                            FoiPago = foiPagoSantander,
                            ValorPago = valorPagoSantander,
                            Inconsistencia = temInconsistencia
                        });
                    }
                    catch (Exception ex)
                    {
                        erroCount++;
                        errosList.Add(new
                        {
                            BoletoId = boleto.Id,
                            NsuCode = boleto.NsuCode,
                            Erro = ex.Message
                        });

                        _logger.LogError(ex, "❌ Erro ao verificar boleto cancelado {Id}", boleto.Id);
                    }
                }

                var resultado = new
                {
                    Resumo = new
                    {
                        Total = boletos.Count,
                        Sucesso = sucessoCount,
                        Erros = erroCount,
                        InconsistenciasDetectadas = inconsistenciasCount
                    },
                    Inconsistencias = inconsistenciasList,
                    TodosAtualizados = atualizadosList,
                    Erros_Lista = errosList,
                    Mensagem = inconsistenciasCount > 0 
                        ? $"⚠️ ATENÇÃO: {inconsistenciasCount} inconsistência(s) detectada(s) e corrigida(s)!" 
                        : "✅ Nenhuma inconsistência encontrada"
                };

                _logger.LogInformation("✅ Auditoria de boletos cancelados concluída. Total: {Total}, Inconsistências: {Inconsistencias}",
                    boletos.Count, inconsistenciasCount);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar boletos cancelados");
                return StatusCode(500, new
                {
                    mensagem = "Erro ao sincronizar boletos cancelados",
                    detalhes = ex.Message
                });
            }
        }

        // PUT: api/Boleto/sincronizar-todos-forcado
        // Endpoint especial para sincronizar TODOS os boletos, incluindo BAIXADO e LIQUIDADO
        [HttpPut("sincronizar-todos-forcado")]
        public async Task<ActionResult<object>> SincronizarTodosBoletosForced()
        {
            try
            {
                _logger.LogInformation("🔄 Iniciando sincronização FORÇADA de TODOS os boletos");

                // Buscar TODOS os boletos ativos (incluindo BAIXADO e LIQUIDADO)
                var boletos = await _context.Boletos
                    .Where(b => b.Ativo)
                    .ToListAsync();

                _logger.LogInformation("📊 Encontrados {Total} boletos para sincronizar (TODOS)", boletos.Count);

                var beneficiaryCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";

                int sucessoCount = 0;
                int erroCount = 0;
                var atualizadosList = new List<object>();
                var errosList = new List<object>();

                foreach (var boleto in boletos)
                {
                    try
                    {
                        var statusAnterior = boleto.Status;
                        var paidValueAnterior = 0m; // Para comparação

                        // Consultar status na API Santander
                        var statusResponse = await _santanderService.ConsultarStatusPorNossoNumeroAsync(beneficiaryCode, boleto.BankNumber);

                        // Atualizar no banco
                        await AtualizarStatusBoletoNoBanco(boleto, statusResponse);

                        sucessoCount++;

                        // Log detalhado para BAIXADO
                        if (boleto.Status == "BAIXADO")
                        {
                            var foiPago = statusResponse.PaidValue.HasValue && statusResponse.PaidValue > 0;
                            _logger.LogInformation("📋 Boleto {Id} BAIXADO - PaidValue: {PaidValue}, FoiPago: {FoiPago}",
                                boleto.Id, statusResponse.PaidValue, foiPago);
                        }

                        atualizadosList.Add(new
                        {
                            BoletoId = boleto.Id,
                            NsuCode = boleto.NsuCode,
                            StatusAnterior = statusAnterior,
                            StatusNovo = boleto.Status,
                            PaidValue = statusResponse.PaidValue,
                            FoiPago = statusResponse.FoiPago
                        });

                        _logger.LogInformation("✅ Boleto {Id} sincronizado: {Anterior} → {Novo}, PaidValue: {PaidValue}",
                            boleto.Id, statusAnterior, boleto.Status, statusResponse.PaidValue);
                    }
                    catch (Exception ex)
                    {
                        erroCount++;
                        errosList.Add(new
                        {
                            BoletoId = boleto.Id,
                            NsuCode = boleto.NsuCode,
                            Erro = ex.Message
                        });

                        _logger.LogError(ex, "❌ Erro ao sincronizar boleto {Id}", boleto.Id);
                    }
                }

                var resultado = new
                {
                    Total = boletos.Count,
                    Sucesso = sucessoCount,
                    Erros = erroCount,
                    Atualizados = atualizadosList,
                    Erros_Lista = errosList
                };

                _logger.LogInformation("✅ Sincronização FORÇADA concluída. Total: {Total}, Sucesso: {Sucesso}, Erros: {Erros}",
                    boletos.Count, sucessoCount, erroCount);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar todos os boletos (forçado)");
                return StatusCode(500, new
                {
                    mensagem = "Erro ao sincronizar boletos",
                    detalhes = ex.Message
                });
            }
        }

        // PUT: api/Boleto/sincronizar-todos
        [HttpPut("sincronizar-todos")]
        public async Task<ActionResult<object>> SincronizarTodosBoletos()
        {
            try
            {
                _logger.LogInformation("🔄 Iniciando sincronização de todos os boletos registrados");

                // Buscar todos os boletos que estão REGISTRADOS ou ATIVO (não incluir PENDENTE, LIQUIDADO, BAIXADO, CANCELADO)
                var boletos = await _context.Boletos
                    .Where(b => b.Ativo && (b.Status == "REGISTRADO" || b.Status == "ATIVO"))
                    .ToListAsync();

                _logger.LogInformation("📊 Encontrados {Total} boletos para sincronizar", boletos.Count);

                var beneficiaryCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";

                var resultados = new
                {
                    Total = boletos.Count,
                    Sucesso = 0,
                    Erros = 0,
                    Atualizados = new List<object>(),
                    Erros_Lista = new List<object>()
                };

                int sucessoCount = 0;
                int erroCount = 0;
                var atualizadosList = new List<object>();
                var errosList = new List<object>();

                foreach (var boleto in boletos)
                {
                    try
                    {
                        var statusAnterior = boleto.Status;

                        // Consultar status
                        var statusResponse = await _santanderService.ConsultarStatusPorNossoNumeroAsync(beneficiaryCode, boleto.BankNumber);

                        // Atualizar no banco
                        await AtualizarStatusBoletoNoBanco(boleto, statusResponse);

                        sucessoCount++;

                        if (statusAnterior != boleto.Status)
                        {
                            atualizadosList.Add(new
                            {
                                BoletoId = boleto.Id,
                                NsuCode = boleto.NsuCode,
                                StatusAnterior = statusAnterior,
                                StatusNovo = boleto.Status
                            });

                            _logger.LogInformation("✅ Boleto {Id} atualizado: {Anterior} → {Novo}",
                                boleto.Id, statusAnterior, boleto.Status);
                        }
                    }
                    catch (Exception ex)
                    {
                        erroCount++;
                        errosList.Add(new
                        {
                            BoletoId = boleto.Id,
                            NsuCode = boleto.NsuCode,
                            Erro = ex.Message
                        });

                        _logger.LogError(ex, "❌ Erro ao sincronizar boleto {Id}", boleto.Id);
                    }
                }

                var resultado = new
                {
                    Total = boletos.Count,
                    Sucesso = sucessoCount,
                    Erros = erroCount,
                    Atualizados = atualizadosList,
                    Erros_Lista = errosList
                };

                _logger.LogInformation("✅ Sincronização concluída. Total: {Total}, Sucesso: {Sucesso}, Erros: {Erros}, Atualizados: {Atualizados}",
                    boletos.Count, sucessoCount, erroCount, atualizadosList.Count);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao sincronizar todos os boletos");
                return StatusCode(500, new
                {
                    mensagem = "Erro ao sincronizar boletos",
                    detalhes = ex.Message
                });
            }
        }

        // PUT: api/Boleto/5/corrigir-parcela
        // Endpoint para corrigir o número da parcela de um boleto (útil para renegociações avulsas)
        [HttpPut("{id}/corrigir-parcela")]
        public async Task<ActionResult> CorrigirNumeroParcela(int id, [FromQuery] int? novaParcela)
        {
            try
            {
                var boleto = await _context.Boletos.FindAsync(id);

                if (boleto == null)
                {
                    return NotFound(new { erro = $"Boleto #{id} não encontrado" });
                }

                var parcelaAnterior = boleto.NumeroParcela;
                boleto.NumeroParcela = novaParcela;
                boleto.DataAtualizacao = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Boleto #{id}: Número da parcela alterado de {parcelaAnterior} para {novaParcela?.ToString() ?? "NULL (avulso)"}");

                return Ok(new
                {
                    mensagem = "Número da parcela corrigido com sucesso",
                    boletoId = id,
                    parcelaAnterior = parcelaAnterior,
                    parcelaNova = novaParcela,
                    observacao = novaParcela == null ? "Boleto marcado como AVULSO (renegociação)" : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao corrigir parcela do boleto #{id}");
                return StatusCode(500, new { erro = "Erro ao corrigir parcela", detalhes = ex.Message });
            }
        }

        // PUT: api/Boleto/5/sincronizar
        [HttpPut("{id}/sincronizar")]
        public async Task<ActionResult<BoletoResponseDTO>> SincronizarBoleto(int id)
        {
            try
            {
                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (boleto == null)
                {
                    return NotFound($"Boleto com ID {id} não encontrado");
                }

                // Permitir sincronização de qualquer boleto que não seja PENDENTE
                if (boleto.Status == "PENDENTE")
                {
                    return BadRequest("Boletos pendentes (não registrados) não podem ser sincronizados. Registre o boleto primeiro.");
                }

                _logger.LogInformation("🔄 Sincronizando boleto ID: {Id}, Status atual: {Status}", id, boleto.Status);

                try
                {
                    var beneficiaryCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";

                    // ✅ Usar novo método de consulta de status
                    var statusResponse = await _santanderService.ConsultarStatusPorNossoNumeroAsync(beneficiaryCode, boleto.BankNumber);

                    // ✅ Atualizar status no banco
                    await AtualizarStatusBoletoNoBanco(boleto, statusResponse);

                    _logger.LogInformation("✅ Boleto sincronizado com sucesso. ID: {Id}, Novo Status: {Status}", id, boleto.Status);

                    var response = MapearBoletoParaResponse(boleto);
                    return Ok(response);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao sincronizar boleto ID: {Id}", id);
                    return BadRequest($"Erro ao sincronizar boleto: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao sincronizar boleto ID: {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // DELETE: api/Boleto/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoleto(int id)
        {
            try
            {
                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .FirstOrDefaultAsync(b => b.Id == id);
                if (boleto == null)
                {
                    return NotFound($"Boleto com ID {id} não encontrado");
                }

                if (boleto.Status == "LIQUIDADO")
                {
                    return BadRequest("Não é possível excluir um boleto liquidado");
                }

                // Tentar cancelar na API Santander se estiver registrado
                if (boleto.Status == "REGISTRADO")
                {
                    try
                    {
                        await _santanderService.CancelarBoletoAsync(boleto.CovenantCode, boleto.BankNumber, boleto.NsuDate);
                        _logger.LogInformation("Boleto cancelado na API Santander. ID: {Id}", id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Erro ao cancelar boleto na API Santander. ID: {Id}", id);
                        // Continua com a exclusão mesmo se não conseguir cancelar na API
                    }
                }

                boleto.Ativo = false;
                boleto.Status = "CANCELADO";
                boleto.DataAtualizacao = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Boleto cancelado com sucesso. ID: {Id}", id);

                // Auditoria de cancelamento de boleto
                var usuarioIdHeaderCancel = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeaderCancel, out int usuarioIdCancel);
                var nomeClienteCancel = boleto.Contrato?.Cliente?.PessoaFisica?.Nome
                    ?? boleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";
                await _auditService.LogAsync(
                    usuarioIdCancel, "Delete", "Boleto", id,
                    $"Boleto #{id} cancelado | Cliente: {nomeClienteCancel} | Valor: R$ {boleto.NominalValue:N2} | Vencimento: {boleto.DueDate:dd/MM/yyyy}",
                    "Boletos",
                    valorAnterior: new {
                        boleto.Id,
                        Cliente = nomeClienteCancel,
                        boleto.NominalValue,
                        boleto.DueDate,
                        StatusAnterior = boleto.Status
                    },
                    severidade: "Warning",
                    httpContext: HttpContext);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao cancelar boleto ID: {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // PUT: api/Boleto/{id}/marcar-pago-manual
        /// <summary>
        /// Marca uma parcela PIX como paga manualmente (sem consulta ao Santander).
        /// Uso: quando o cliente paga via PIX direto e o financeiro confirma o recebimento.
        /// </summary>
        [HttpPut("{id}/marcar-pago-manual")]
        public async Task<IActionResult> MarcarPixComoPagoManual(int id, [FromBody] MarcarPagoManualDTO dto)
        {
            try
            {
                _logger.LogInformation("💰 MarcarPixComoPago: Marcando parcela {Id} como paga manualmente", id);

                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (boleto == null)
                {
                    return NotFound(new { message = $"Parcela/Boleto {id} não encontrado" });
                }

                // Verificar se é PIX
                if (boleto.TipoPagamento != "Pix")
                {
                    return BadRequest(new { message = "Esta operação é apenas para parcelas PIX. Use a sincronização com Santander para boletos." });
                }

                // Verificar se já está pago
                if (boleto.FoiPago)
                {
                    return BadRequest(new { message = "Esta parcela já está marcada como paga" });
                }

                // Marcar como pago
                boleto.FoiPago = true;
                boleto.Status = "LIQUIDADO";
                boleto.ValorPago = dto.ValorPago ?? boleto.NominalValue;
                boleto.DataPagamento = dto.DataPagamento ?? DateTime.UtcNow;
                boleto.DataAtualizacao = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Parcela PIX {Id} marcada como paga. Valor: R$ {Valor}, Data: {Data}",
                    id, boleto.ValorPago, boleto.DataPagamento);

                // Auditoria de marcação como pago (PIX)
                var usuarioIdHeaderPago = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeaderPago, out int usuarioIdPago);
                var nomeClientePix = boleto.Contrato?.Cliente?.PessoaFisica?.Nome
                    ?? boleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";
                await _auditService.LogAsync(
                    usuarioIdPago, "Update", "Boleto", id,
                    $"Boleto #{id} marcado como pago (PIX) | Cliente: {nomeClientePix} | Valor Pago: R$ {boleto.ValorPago:N2} | Data Pagamento: {boleto.DataPagamento:dd/MM/yyyy}",
                    "Boletos",
                    valorAnterior: new { StatusAnterior = "PENDENTE", FoiPago = false },
                    valorNovo: new {
                        Cliente = nomeClientePix,
                        boleto.Status,
                        boleto.ValorPago,
                        boleto.DataPagamento,
                        FoiPago = true
                    },
                    camposAlterados: "Status,FoiPago,ValorPago,DataPagamento",
                    httpContext: HttpContext);

                return Ok(new
                {
                    message = "Parcela PIX marcada como paga com sucesso",
                    boletoId = id,
                    valorPago = boleto.ValorPago,
                    dataPagamento = boleto.DataPagamento,
                    status = boleto.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao marcar parcela PIX {Id} como paga", id);
                return StatusCode(500, new { message = $"Erro ao marcar parcela como paga: {ex.Message}" });
            }
        }

        // GET: api/Boleto/dashboard
        [HttpGet("dashboard")]
        public async Task<ActionResult<object>> GetDashboard()
        {
            try
            {
                var agora = DateTime.Now;

                var stats = await _context.Boletos
                    .GroupBy(b => 1)
                    .Select(g => new
                    {
                        // Regras de negócio dos cards:
                        // total, valor total (sem cancelados), total pago (sum), pendentes, pagos (count) e vencidos.
                        Total = g.Count(),
                        ValorTotal = g.Where(b => ((b.Status ?? "").Trim().ToUpper()) != "CANCELADO")
                            .Sum(b => (decimal?)b.NominalValue) ?? 0,
                        TotalPago = g.Where(b =>
                                ((b.Status ?? "").Trim().ToUpper()) == "LIQUIDADO" ||
                                (((b.Status ?? "").Trim().ToUpper()) == "BAIXADO" && b.FoiPago))
                            .Sum(b => (decimal?)b.NominalValue) ?? 0,
                        Pendentes = g.Count(b => ((b.Status ?? "").Trim().ToUpper()) == "ATIVO"),
                        Pagos = g.Count(b =>
                            ((b.Status ?? "").Trim().ToUpper()) == "LIQUIDADO" ||
                            (((b.Status ?? "").Trim().ToUpper()) == "BAIXADO" && b.FoiPago)),
                        Vencidos = g.Count(b => ((b.Status ?? "").Trim().ToUpper()) == "ATIVO" && b.DueDate < agora),

                        // Campos legados mantidos por compatibilidade com frontend já em produção.
                        TotalBoletos = g.Count(),
                        BoletosPendentes = g.Count(b => ((b.Status ?? "").Trim().ToUpper()) == "ATIVO"),
                        BoletosRegistrados = g.Count(b => ((b.Status ?? "").Trim().ToUpper()) == "REGISTRADO"),
                        BoletosLiquidados = g.Count(b =>
                            ((b.Status ?? "").Trim().ToUpper()) == "LIQUIDADO" ||
                            (((b.Status ?? "").Trim().ToUpper()) == "BAIXADO" && b.FoiPago)),
                        BoletosVencidos = g.Count(b => ((b.Status ?? "").Trim().ToUpper()) == "ATIVO" && b.DueDate < agora),
                        BoletosCancelados = g.Count(b => ((b.Status ?? "").Trim().ToUpper()) == "CANCELADO"),
                        ValorTotalRegistrado = g.Where(b => ((b.Status ?? "").Trim().ToUpper()) != "CANCELADO")
                            .Sum(b => (decimal?)b.NominalValue) ?? 0,
                        ValorTotalLiquidado = g.Where(b =>
                                ((b.Status ?? "").Trim().ToUpper()) == "LIQUIDADO" ||
                                (((b.Status ?? "").Trim().ToUpper()) == "BAIXADO" && b.FoiPago))
                            .Sum(b => (decimal?)b.NominalValue) ?? 0
                    })
                    .FirstOrDefaultAsync();

                if (stats == null)
                {
                    stats = new
                    {
                        Total = 0,
                        ValorTotal = 0m,
                        TotalPago = 0m,
                        Pendentes = 0,
                        Pagos = 0,
                        Vencidos = 0,
                        TotalBoletos = 0,
                        BoletosPendentes = 0,
                        BoletosRegistrados = 0,
                        BoletosLiquidados = 0,
                        BoletosVencidos = 0,
                        BoletosCancelados = 0,
                        ValorTotalRegistrado = 0m,
                        ValorTotalLiquidado = 0m
                    };
                }

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar dashboard");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/Boleto/liquidados-por-periodo?periodo=semana
        [HttpGet("liquidados-por-periodo")]
        public async Task<ActionResult<object>> GetBoletosLiquidadosPorPeriodo([FromQuery] string periodo = "semana")
        {
            try
            {
                var hoje = DateTime.Today;
                DateTime dataInicio;
                int dias;

                switch (periodo.ToLower())
                {
                    case "dia":
                        dataInicio = hoje;
                        dias = 1;
                        break;
                    case "semana":
                        dataInicio = hoje.AddDays(-6); // Últimos 7 dias
                        dias = 7;
                        break;
                    case "mês":
                    case "mes":
                        dataInicio = hoje.AddDays(-29); // Últimos 30 dias
                        dias = 30;
                        break;
                    default:
                        dataInicio = hoje.AddDays(-6);
                        dias = 7;
                        break;
                }

                _logger.LogInformation($"📊 GetBoletosLiquidadosPorPeriodo: Buscando boletos de {dataInicio:dd/MM/yyyy} até {hoje:dd/MM/yyyy}");

                // Buscar boletos liquidados no período
                var boletosLiquidados = await _context.Boletos
                    .Where(b => b.Ativo &&
                           b.Status == "LIQUIDADO" &&
                           b.DataAtualizacao.HasValue &&
                           b.DataAtualizacao.Value >= dataInicio &&
                           b.DataAtualizacao.Value <= hoje.AddDays(1).AddSeconds(-1))
                    .Select(b => new
                    {
                        b.Id,
                        b.NominalValue,
                        DataLiquidacao = b.DataAtualizacao.HasValue ? b.DataAtualizacao.Value.Date : hoje
                    })
                    .ToListAsync();

                _logger.LogInformation($"📊 Total de boletos liquidados encontrados: {boletosLiquidados.Count}");

                // Gerar lista de todos os dias do período
                var diasPeriodo = Enumerable.Range(0, dias)
                    .Select(i => dataInicio.AddDays(i))
                    .ToList();

                // Agrupar por dia e calcular valores
                var dadosPorDia = diasPeriodo.Select(dia =>
                {
                    var boletosNoDia = boletosLiquidados.Where(b => b.DataLiquidacao.Date == dia.Date).ToList();
                    var valorTotal = boletosNoDia.Any() ? boletosNoDia.Sum(b => b.NominalValue) : 0m;
                    var quantidade = boletosNoDia.Count;

                    return new
                    {
                        Data = dia.ToString("dd/MM"),
                        DiaSemana = GetDiaSemanaAbreviado(dia.DayOfWeek),
                        Valor = valorTotal,
                        Quantidade = quantidade,
                        DataCompleta = dia.ToString("yyyy-MM-dd")
                    };
                }).ToList();

                var resultado = new
                {
                    Periodo = periodo,
                    DataInicio = dataInicio.ToString("dd/MM/yyyy"),
                    DataFim = hoje.ToString("dd/MM/yyyy"),
                    TotalDias = dias,
                    ValorTotal = dadosPorDia.Sum(d => d.Valor),
                    QuantidadeTotal = dadosPorDia.Sum(d => d.Quantidade),
                    Dados = dadosPorDia
                };

                _logger.LogInformation($"✅ Resultado: {resultado.QuantidadeTotal} boletos, R$ {resultado.ValorTotal:N2}");

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar boletos liquidados por período");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        private string GetDiaSemanaAbreviado(DayOfWeek diaSemana)
        {
            return diaSemana switch
            {
                DayOfWeek.Sunday => "Dom",
                DayOfWeek.Monday => "Seg",
                DayOfWeek.Tuesday => "Ter",
                DayOfWeek.Wednesday => "Qua",
                DayOfWeek.Thursday => "Qui",
                DayOfWeek.Friday => "Sex",
                DayOfWeek.Saturday => "Sáb",
                _ => ""
            };
        }

        #region Métodos Privados

        private string LimparTexto(string texto)
        {
            if (string.IsNullOrEmpty(texto)) return "";

            // Remover acentos primeiro
            var normalizado = texto
                .Replace("á", "a").Replace("à", "a").Replace("ã", "a").Replace("â", "a")
                .Replace("é", "e").Replace("ê", "e")
                .Replace("í", "i")
                .Replace("ó", "o").Replace("ô", "o").Replace("õ", "o")
                .Replace("ú", "u").Replace("ü", "u")
                .Replace("ç", "c")
                .Replace("Á", "A").Replace("À", "A").Replace("Ã", "A").Replace("Â", "A")
                .Replace("É", "E").Replace("Ê", "E")
                .Replace("Í", "I")
                .Replace("Ó", "O").Replace("Ô", "O").Replace("Õ", "O")
                .Replace("Ú", "U").Replace("Ü", "U")
                .Replace("Ç", "C")
                .Replace("'", "'").Replace("'", "'").Replace(""", "\"").Replace(""", "\"")
                .Replace("–", "-").Replace("—", "-")
                .Replace("\r", " ").Replace("\n", " ")
                .Replace("\t", " ");

            // ✅ API Santander: Remover caracteres especiais (só aceita alfanumérico e espaços)
            // Remove: . - & / \ ( ) [ ] { } @ # $ % * + = ! ? : ; , < > | _ ~ ` ^ ' "
            normalizado = normalizado
                .Replace(".", " ")      // Ponto → Ex: "LTDA." vira "LTDA"
                .Replace("-", " ")      // Hífen → Ex: "EMPRESA-SP" vira "EMPRESA SP"
                .Replace("&", "E")      // E comercial → "A & B" vira "A E B"
                .Replace("/", " ")      // Barra
                .Replace("\\", " ")     // Barra invertida
                .Replace("(", " ")      // Parênteses
                .Replace(")", " ")
                .Replace("[", " ")      // Colchetes
                .Replace("]", " ")
                .Replace("{", " ")      // Chaves
                .Replace("}", " ")
                .Replace("@", " ")      // Arroba
                .Replace("#", " ")      // Hashtag
                .Replace("$", " ")      // Cifrão
                .Replace("%", " ")      // Porcentagem
                .Replace("*", " ")      // Asterisco
                .Replace("+", " ")      // Mais
                .Replace("=", " ")      // Igual
                .Replace("!", " ")      // Exclamação
                .Replace("?", " ")      // Interrogação
                .Replace(":", " ")      // Dois pontos
                .Replace(";", " ")      // Ponto e vírgula
                .Replace(",", " ")      // Vírgula
                .Replace("<", " ")      // Menor que
                .Replace(">", " ")      // Maior que
                .Replace("|", " ")      // Pipe
                .Replace("_", " ")      // Underscore
                .Replace("~", " ")      // Til
                .Replace("`", " ")      // Crase
                .Replace("^", " ")      // Circunflexo
                .Replace("'", " ")      // Aspas simples
                .Replace("\"", " ");    // Aspas duplas

            // Remove espaços múltiplos e trim
            while (normalizado.Contains("  "))
            {
                normalizado = normalizado.Replace("  ", " ");
            }

            return normalizado.Trim();
        }

        private string TruncarTexto(string texto, int maxLength)
        {
            if (string.IsNullOrEmpty(texto)) return "";

            if (texto.Length <= maxLength)
            {
                return texto;
            }

            // Truncar e adicionar indicador
            var truncado = texto.Substring(0, maxLength);
            _logger.LogWarning("⚠️ Texto truncado de {Original} para {Max} caracteres: '{Texto}'",
                texto.Length, maxLength, truncado);

            return truncado;
        }

        private static int? ExtrairMaiorParcelaCoberta(string? parcelasCobertasJson)
        {
            if (string.IsNullOrWhiteSpace(parcelasCobertasJson))
                return null;

            try
            {
                var parcelas = JsonSerializer.Deserialize<List<int>>(parcelasCobertasJson);
                if (parcelas == null || parcelas.Count == 0)
                    return null;

                return parcelas.Max();
            }
            catch
            {
                return null;
            }
        }

        private static DateTime CalcularDataVencimentoPorParcela(DateTime primeiroVencimento, int numeroParcela)
        {
            if (numeroParcela < 1) numeroParcela = 1;

            var mesBase = primeiroVencimento.AddMonths(numeroParcela - 1);
            var dia = Math.Min(primeiroVencimento.Day, DateTime.DaysInMonth(mesBase.Year, mesBase.Month));
            return new DateTime(mesBase.Year, mesBase.Month, dia);
        }

        private async Task<Boleto> CriarBoletoFromDTO(CreateBoletoDTO dto, Contrato contrato, string nsuCode, DateTime nsuDate)
        {
            // Determinar dados do pagador
            var (nomeCliente, tipoDoc, numeroDoc, endereco) = ObterDadosCliente(contrato.Cliente);

            // Truncar textos para respeitar limites do banco de dados
            var payerNameTruncado = TruncarTexto(LimparTexto(nomeCliente), 40);
            var payerAddressTruncado = TruncarTexto(LimparTexto(endereco?.Logradouro ?? "Endereco nao informado"), 40);
            var payerNeighborhoodTruncado = TruncarTexto(LimparTexto(endereco?.Bairro ?? "Bairro nao informado"), 30);

            // Limpar cidade removendo UF se vier junto (ex: "BELO HORIZONTE MG" → "BELO HORIZONTE")
            var cidadeLimpa = LimparCidade(endereco?.Cidade);
            var payerCityTruncado = TruncarTexto(LimparTexto(cidadeLimpa), 20);

            _logger.LogInformation("📝 Nome truncado: '{Original}' → '{Truncado}'", nomeCliente, payerNameTruncado);

            var boleto = new Boleto
            {
                ContratoId = dto.ContratoId,
                NsuCode = nsuCode,
                NsuDate = nsuDate,
                CovenantCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794",
                BankNumber = GerarNossoNumero(), // Gerar número único para cada boleto
                // Sanitizar ClientNumber: remover espaços, hífens e caracteres especiais
                ClientNumber = !string.IsNullOrWhiteSpace(dto.ClientNumber) 
                    ? new string(dto.ClientNumber.Where(c => char.IsLetterOrDigit(c)).ToArray()).ToUpper()
                    : await GerarClientNumberAsync(),
                DueDate = dto.DueDate,
                IssueDate = DateTime.Today,
                NominalValue = dto.NominalValue,
                DocumentKind = "DUPLICATA_MERCANTIL",

                // Dados do pagador (sanitizados e truncados)
                PayerName = payerNameTruncado,
                PayerDocumentType = tipoDoc,
                PayerDocumentNumber = TruncarTexto(
                    numeroDoc?.Replace(".", "").Replace("-", "").Replace("/", "") ?? "00000000000",
                    15
                ),
                PayerAddress = payerAddressTruncado,
                PayerNeighborhood = payerNeighborhoodTruncado,
                PayerCity = payerCityTruncado,
                PayerState = NormalizarEstado(endereco?.Estado, endereco?.Cidade),
                PayerZipCode = FormatarCep(endereco?.Cep),

                // Configurações opcionais
                FinePercentage = dto.FinePercentage,
                FineQuantityDays = dto.FineQuantityDays,
                InterestPercentage = dto.InterestPercentage,
                DeductionValue = dto.DeductionValue,
                WriteOffQuantityDays = dto.WriteOffQuantityDays,

                // Configurações de protesto
                ProtestType = dto.ProtestType,
                ProtestQuantityDays = dto.ProtestQuantityDays,

                // Mensagens
                Messages = dto.Messages != null && dto.Messages.Any() ?
                    JsonSerializer.Serialize(dto.Messages) : null,

                Status = "PENDENTE"
            };

            return boleto;
        }

        private static readonly HashSet<string> UfsValidas = new HashSet<string>
        {
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
            "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
            "RS", "RO", "RR", "SC", "SP", "SE", "TO"
        };

        private static readonly Dictionary<string, string> CidadeParaEstado = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "BELO HORIZONTE", "MG" },
            { "SAO PAULO", "SP" },
            { "RIO DE JANEIRO", "RJ" },
            { "BRASILIA", "DF" },
            { "SALVADOR", "BA" },
            { "FORTALEZA", "CE" },
            { "CURITIBA", "PR" },
            { "RECIFE", "PE" },
            { "PORTO ALEGRE", "RS" },
            { "MANAUS", "AM" },
            { "GOIANIA", "GO" },
            { "BELEM", "PA" },
            { "VITORIA", "ES" },
            { "FLORIANOPOLIS", "SC" },
            { "NATAL", "RN" },
            { "CAMPO GRANDE", "MS" },
            { "JOAO PESSOA", "PB" },
            { "SAO LUIS", "MA" },
            { "MACEIO", "AL" },
            { "CUIABA", "MT" },
            { "TERESINA", "PI" },
            { "ARACAJU", "SE" },
            { "PORTO VELHO", "RO" },
            { "BOA VISTA", "RR" },
            { "MACAPA", "AP" },
            { "PALMAS", "TO" },
            { "RIO BRANCO", "AC" }
        };

        private string LimparCidade(string? cidade)
        {
            if (string.IsNullOrWhiteSpace(cidade))
            {
                return "Cidade nao informada";
            }

            var cidadeLimpa = cidade.Trim().ToUpper();

            // Verificar se termina com espaço + 2 letras (formato "CIDADE UF")
            var partes = cidadeLimpa.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (partes.Length >= 2)
            {
                var ultimaParte = partes[partes.Length - 1];
                // Se a última parte é uma UF válida, remover
                if (ultimaParte.Length == 2 && UfsValidas.Contains(ultimaParte))
                {
                    // Remover a UF do nome da cidade
                    var cidadeSemUf = string.Join(" ", partes.Take(partes.Length - 1));
                    _logger.LogInformation("🧹 Cidade limpa: '{Original}' → '{Limpa}'", cidade, cidadeSemUf);
                    return cidadeSemUf;
                }
            }

            return cidadeLimpa;
        }

        private string NormalizarEstado(string? estadoOriginal, string? cidade)
        {
            // Normalizar estado original
            var estadoNormalizado = estadoOriginal?.Trim().ToUpper();

            // Se o estado é válido, retorna
            if (!string.IsNullOrWhiteSpace(estadoNormalizado) && UfsValidas.Contains(estadoNormalizado))
            {
                _logger.LogDebug("✅ Estado válido: {Estado}", estadoNormalizado);
                return estadoNormalizado;
            }

            // Log de estado inválido
            if (!string.IsNullOrWhiteSpace(estadoOriginal))
            {
                _logger.LogWarning("⚠️ Estado inválido detectado: '{Estado}' - Tentando corrigir...", estadoOriginal);
            }

            // Tentar extrair do campo cidade se tiver formato "CIDADE UF"
            if (!string.IsNullOrWhiteSpace(cidade))
            {
                var cidadeLimpa = cidade.Trim().ToUpper();

                // Verificar se termina com espaço + 2 letras (formato "CIDADE UF")
                var partes = cidadeLimpa.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (partes.Length >= 2)
                {
                    var ultimaParte = partes[partes.Length - 1];
                    if (ultimaParte.Length == 2 && UfsValidas.Contains(ultimaParte))
                    {
                        _logger.LogInformation("✅ Estado extraído do campo cidade: '{Cidade}' → UF: {UF}", cidade, ultimaParte);
                        return ultimaParte;
                    }
                }

                // Verificar pelo mapeamento de cidades conhecidas
                foreach (var (cidadeKey, uf) in CidadeParaEstado)
                {
                    if (cidadeLimpa.Contains(cidadeKey))
                    {
                        _logger.LogInformation("✅ Estado identificado pela cidade: '{Cidade}' → UF: {UF}", cidade, uf);
                        return uf;
                    }
                }
            }

            // Fallback: retornar SP como padrão
            _logger.LogWarning("⚠️ Não foi possível determinar o estado. Usando SP como padrão. Estado original: '{Estado}', Cidade: '{Cidade}'",
                estadoOriginal, cidade);
            return "SP";
        }

        private (string nome, string tipoDoc, string numeroDoc, Endereco? endereco) ObterDadosCliente(Cliente cliente)
        {
            _logger.LogInformation("🔍 ObterDadosCliente: ClienteId={ClienteId}, TipoPessoa={TipoPessoa}",
                cliente.Id, cliente.TipoPessoa);

            if (cliente.PessoaFisica != null)
            {
                _logger.LogInformation("✅ Cliente é Pessoa Física: {Nome}", cliente.PessoaFisica.Nome);
                return (
                    cliente.PessoaFisica.Nome,
                    "CPF",
                    cliente.PessoaFisica.Cpf,
                    cliente.PessoaFisica.Endereco
                );
            }
            else if (cliente.PessoaJuridica != null)
            {
                _logger.LogInformation("✅ Cliente é Pessoa Jurídica: {RazaoSocial}", cliente.PessoaJuridica.RazaoSocial);
                return (
                    cliente.PessoaJuridica.RazaoSocial,
                    "CNPJ",
                    cliente.PessoaJuridica.Cnpj,
                    cliente.PessoaJuridica.Endereco
                );
            }
            else
            {
                _logger.LogError("❌ Cliente {ClienteId} não possui PessoaFisica nem PessoaJuridica associada!", cliente.Id);
                _logger.LogError("❌ TipoPessoa: {TipoPessoa}, PessoaFisicaId: {PFId}, PessoaJuridicaId: {PJId}",
                    cliente.TipoPessoa, cliente.PessoaFisicaId, cliente.PessoaJuridicaId);
                throw new InvalidOperationException(
                    $"Cliente {cliente.Id} deve ter pessoa física ou jurídica associada. " +
                    $"TipoPessoa={cliente.TipoPessoa}, PFId={cliente.PessoaFisicaId}, PJId={cliente.PessoaJuridicaId}"
                );
            }
        }

        private string GerarNossoNumero()
        {
            // Gerar nosso número baseado em timestamp + random
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var random = new Random().Next(100, 999);
            return $"{timestamp}{random}".Substring(0, 13); // Máximo 13 caracteres
        }

        private async Task<string> GerarClientNumberAsync()
        {
            try
            {
                // Buscar o último ClientNumber usado
                var ultimoBoleto = await _context.Boletos
                    .Where(b => !string.IsNullOrEmpty(b.ClientNumber))
                    .OrderByDescending(b => b.Id)
                    .FirstOrDefaultAsync();

                if (ultimoBoleto != null && !string.IsNullOrEmpty(ultimoBoleto.ClientNumber))
                {
                    // Limpar hífens do ClientNumber existente
                    var clientNumberLimpo = ultimoBoleto.ClientNumber.Replace("-", "");

                    // Tentar extrair número do ClientNumber (ex: CONT148 → 148)
                    var apenasNumeros = new string(clientNumberLimpo.Where(char.IsDigit).ToArray());

                    if (int.TryParse(apenasNumeros, out int numeroAtual))
                    {
                        var proximoNumero = numeroAtual + 1;
                        return $"CONT{proximoNumero}";
                    }
                }

                // Se não encontrou, começar do 1
                return "CONT1";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao gerar ClientNumber, usando fallback");
                // Fallback: usar timestamp para garantir unicidade
                return $"CONT{DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString().Substring(5)}";
            }
        }

        private string FormatarCep(string? cep)
        {
            if (string.IsNullOrWhiteSpace(cep))
            {
                return "00000-000"; // CEP padrão
            }

            // Remover tudo que não é número
            var apenasNumeros = new string(cep.Where(char.IsDigit).ToArray());

            // Garantir 8 dígitos
            if (apenasNumeros.Length < 8)
            {
                apenasNumeros = apenasNumeros.PadLeft(8, '0');
            }
            else if (apenasNumeros.Length > 8)
            {
                apenasNumeros = apenasNumeros.Substring(0, 8);
            }

            // Formatar como 00000-000
            return $"{apenasNumeros.Substring(0, 5)}-{apenasNumeros.Substring(5, 3)}";
        }

        private void AtualizarBoletoComResposta(Boleto boleto, SantanderBoletoResponse response)
        {
            boleto.BarCode = response.barCode;
            boleto.DigitableLine = response.digitableLine;
            boleto.QrCodePix = response.qrCodePix;
            boleto.QrCodeUrl = response.qrCodeUrl;

            if (DateTime.TryParse(response.entryDate, out DateTime entryDate))
            {
                boleto.EntryDate = entryDate;
            }

            // Atualizar status se o boleto foi liquidado
            if (!string.IsNullOrEmpty(response.Status))
            {
                // A API Santander pode retornar diferentes valores para status liquidado
                var statusLiquidado = new[] { "LIQUIDADO", "PAID", "SETTLED", "PAGO" };
                if (statusLiquidado.Any(s => response.Status.Equals(s, StringComparison.OrdinalIgnoreCase)))
                {
                    _logger.LogInformation("✅ Boleto ID {BoletoId} foi LIQUIDADO. Status da API: {Status}", boleto.Id, response.Status);
                    boleto.Status = "LIQUIDADO";

                    // Atualizar data de liquidação se disponível
                    if (!string.IsNullOrEmpty(response.SettlementDate) && DateTime.TryParse(response.SettlementDate, out DateTime settlementDate))
                    {
                        boleto.DataAtualizacao = settlementDate;
                        _logger.LogInformation("📅 Data de liquidação: {SettlementDate}", settlementDate);
                    }
                }
            }

            boleto.DataAtualizacao = DateTime.UtcNow;
        }

        private BoletoResponseDTO MapearBoletoParaResponse(Boleto boleto)
        {
            var response = new BoletoResponseDTO
            {
                Id = boleto.Id,
                ContratoId = boleto.ContratoId,
                NsuCode = boleto.NsuCode,
                NsuDate = boleto.NsuDate,
                CovenantCode = boleto.CovenantCode,
                BankNumber = boleto.BankNumber,
                ClientNumber = boleto.ClientNumber,
                DueDate = boleto.DueDate,
                IssueDate = boleto.IssueDate,
                NominalValue = boleto.NominalValue,
                DocumentKind = boleto.DocumentKind,
                Status = boleto.Status,
                PayerName = boleto.PayerName,
                PayerDocumentType = boleto.PayerDocumentType,
                PayerDocumentNumber = boleto.PayerDocumentNumber,
                PayerAddress = boleto.PayerAddress,
                PayerNeighborhood = boleto.PayerNeighborhood,
                PayerCity = boleto.PayerCity,
                PayerState = boleto.PayerState,
                PayerZipCode = boleto.PayerZipCode,
                BarCode = boleto.BarCode,
                DigitableLine = boleto.DigitableLine,
                EntryDate = boleto.EntryDate,
                QrCodePix = boleto.QrCodePix,
                QrCodeUrl = boleto.QrCodeUrl,
                FoiPago = boleto.FoiPago,
                ValorPago = boleto.ValorPago,
                DataPagamento = boleto.DataPagamento,
                ProtestType = boleto.ProtestType,
                ProtestQuantityDays = boleto.ProtestQuantityDays,
                DataCadastro = boleto.DataCadastro,
                DataAtualizacao = boleto.DataAtualizacao,
                ErrorCode = boleto.ErrorCode,
                ErrorMessage = boleto.ErrorMessage,
                TraceId = boleto.TraceId,
                PdfBlobUrl = boleto.PdfBlobUrl,
                PdfArmazenadoEm = boleto.PdfArmazenadoEm,
                TipoBoletoManual = boleto.TipoBoletoManual
            };

            // Adicionar informações do contrato se disponível
            if (boleto.Contrato != null)
            {
                var clienteNome = boleto.Contrato.Cliente?.PessoaFisica?.Nome ??
                                 boleto.Contrato.Cliente?.PessoaJuridica?.RazaoSocial ??
                                 "Cliente não informado";

                var clienteDoc = boleto.Contrato.Cliente?.PessoaFisica?.Cpf ??
                                boleto.Contrato.Cliente?.PessoaJuridica?.Cnpj ??
                                "Documento não informado";

                var filialNome = boleto.Contrato.Cliente?.Filial?.Nome ?? "Sem filial";

                response.Contrato = new ContratoInfoDTO
                {
                    Id = boleto.Contrato.Id,
                    NumeroContrato = $"CONT-{boleto.Contrato.Id}",
                    NumeroPasta = boleto.Contrato.NumeroPasta,
                    TipoServico = boleto.Contrato.TipoServico,
                    ClienteNome = clienteNome,
                    ClienteDocumento = clienteDoc,
                    ValorContrato = boleto.Contrato.ValorNegociado,
                    FilialNome = filialNome
                };
            }

            return response;
        }

        // GET: api/Boleto/{id}/status
        [HttpGet("{id}/status")]
        public async Task<ActionResult<BoletoStatusResponseDTO>> ConsultarStatusBoleto(int id)
        {
            try
            {
                _logger.LogInformation("🔍 Consultando status do boleto ID: {BoletoId}", id);

                var boleto = await _context.Boletos.FindAsync(id);

                if (boleto == null)
                {
                    return NotFound(new { mensagem = $"Boleto com ID {id} não encontrado." });
                }

                if (string.IsNullOrEmpty(boleto.BankNumber))
                {
                    return BadRequest(new { mensagem = "Boleto não possui BankNumber válido para consulta de status." });
                }

                var beneficiaryCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";

                _logger.LogInformation("📄 BankNumber: {BankNumber}, BeneficiaryCode: {BeneficiaryCode}", boleto.BankNumber, beneficiaryCode);

                // Consultar status usando Nosso Número
                var statusResponse = await _santanderService.ConsultarStatusPorNossoNumeroAsync(beneficiaryCode, boleto.BankNumber);

                _logger.LogInformation("✅ Status consultado com sucesso: {Status}", statusResponse.Status);

                // ✅ Preencher dados de QR Code e código de barras do banco se a API não retornar
                // A API Santander só retorna esses dados na criação, não na consulta de status
                if (string.IsNullOrEmpty(statusResponse.QrCodePix) && !string.IsNullOrEmpty(boleto.QrCodePix))
                {
                    statusResponse.QrCodePix = boleto.QrCodePix;
                    _logger.LogInformation("📱 QrCodePix preenchido do banco de dados");
                }

                if (string.IsNullOrEmpty(statusResponse.QrCodeUrl) && !string.IsNullOrEmpty(boleto.QrCodeUrl))
                {
                    statusResponse.QrCodeUrl = boleto.QrCodeUrl;
                    _logger.LogInformation("🔗 QrCodeUrl preenchido do banco de dados");
                }

                if (string.IsNullOrEmpty(statusResponse.BarCode) && !string.IsNullOrEmpty(boleto.BarCode))
                {
                    statusResponse.BarCode = boleto.BarCode;
                    _logger.LogInformation("📊 BarCode preenchido do banco de dados");
                }

                if (string.IsNullOrEmpty(statusResponse.DigitableLine) && !string.IsNullOrEmpty(boleto.DigitableLine))
                {
                    statusResponse.DigitableLine = boleto.DigitableLine;
                    _logger.LogInformation("📝 DigitableLine preenchido do banco de dados");
                }

                // ✅ ATUALIZAR STATUS NO BANCO DE DADOS
                await AtualizarStatusBoletoNoBanco(boleto, statusResponse);

                return Ok(statusResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao consultar status do boleto ID: {BoletoId}", id);
                return StatusCode(500, new
                {
                    mensagem = "Erro ao consultar status do boleto",
                    detalhes = ex.Message,
                    tipo = ex.GetType().Name
                });
            }
        }

        // GET: api/Boleto/status/nosso-numero?beneficiaryCode=xxx&bankNumber=xxx
        [HttpGet("status/nosso-numero")]
        public async Task<ActionResult<BoletoStatusResponseDTO>> ConsultarStatusPorNossoNumero(
            [FromQuery] string beneficiaryCode,
            [FromQuery] string bankNumber)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(beneficiaryCode) || string.IsNullOrWhiteSpace(bankNumber))
                {
                    return BadRequest(new { mensagem = "beneficiaryCode e bankNumber são obrigatórios." });
                }

                _logger.LogInformation("🔍 Consultando status por Nosso Número - BeneficiaryCode: {BeneficiaryCode}, BankNumber: {BankNumber}",
                    beneficiaryCode, bankNumber);

                var statusResponse = await _santanderService.ConsultarStatusPorNossoNumeroAsync(beneficiaryCode, bankNumber);

                _logger.LogInformation("✅ Status consultado com sucesso: {Status}", statusResponse.Status);

                return Ok(statusResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao consultar status por Nosso Número");
                return StatusCode(500, new
                {
                    mensagem = "Erro ao consultar status do boleto",
                    detalhes = ex.Message,
                    tipo = ex.GetType().Name
                });
            }
        }

        // GET: api/Boleto/status/seu-numero?beneficiaryCode=xxx&clientNumber=xxx&dueDate=2023-01-01&nominalValue=100.00
        [HttpGet("status/seu-numero")]
        public async Task<ActionResult<BoletoStatusResponseDTO>> ConsultarStatusPorSeuNumero(
            [FromQuery] string beneficiaryCode,
            [FromQuery] string clientNumber,
            [FromQuery] string dueDate,
            [FromQuery] decimal nominalValue)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(beneficiaryCode) || string.IsNullOrWhiteSpace(clientNumber) ||
                    string.IsNullOrWhiteSpace(dueDate))
                {
                    return BadRequest(new { mensagem = "beneficiaryCode, clientNumber, dueDate e nominalValue são obrigatórios." });
                }

                if (!DateTime.TryParse(dueDate, out DateTime parsedDueDate))
                {
                    return BadRequest(new { mensagem = "dueDate deve estar no formato YYYY-MM-DD." });
                }

                _logger.LogInformation("🔍 Consultando status por Seu Número - BeneficiaryCode: {BeneficiaryCode}, ClientNumber: {ClientNumber}, DueDate: {DueDate}, Value: {Value}",
                    beneficiaryCode, clientNumber, parsedDueDate, nominalValue);

                var statusResponse = await _santanderService.ConsultarStatusPorSeuNumeroAsync(
                    beneficiaryCode, clientNumber, parsedDueDate, nominalValue);

                _logger.LogInformation("✅ Status consultado com sucesso: {Status}", statusResponse.Status);

                return Ok(statusResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao consultar status por Seu Número");
                return StatusCode(500, new
                {
                    mensagem = "Erro ao consultar status do boleto",
                    detalhes = ex.Message,
                    tipo = ex.GetType().Name
                });
            }
        }

        // GET: api/Boleto/status/por-tipo/{billId}?tipoConsulta=default
        [HttpGet("status/por-tipo/{billId}")]
        public async Task<ActionResult<BoletoStatusResponseDTO>> ConsultarStatusPorTipo(
            string billId,
            [FromQuery] string tipoConsulta = "default")
        {
            try
            {
                if (string.IsNullOrWhiteSpace(billId))
                {
                    return BadRequest(new { mensagem = "billId é obrigatório (formato: beneficiaryCode.bankNumber)." });
                }

                // Validar tipo de consulta
                var tiposValidos = new[] { "default", "duplicate", "bankslip", "settlement", "registry" };
                if (!tiposValidos.Contains(tipoConsulta.ToLower()))
                {
                    return BadRequest(new
                    {
                        mensagem = "tipoConsulta inválido.",
                        valoresPermitidos = tiposValidos,
                        descricoes = new
                        {
                            @default = "Pesquisa padrão, trazendo somente dados básicos do boleto",
                            duplicate = "Pesquisa de dados para emissão de segunda via de boleto",
                            bankslip = "Pesquisa para dados completos do boleto",
                            settlement = "Pesquisa para informações de baixas/liquidações do boleto",
                            registry = "Pesquisa de informações de cartório no boleto"
                        }
                    });
                }

                _logger.LogInformation("🔍 Consultando status por Tipo - BillId: {BillId}, TipoConsulta: {TipoConsulta}",
                    billId, tipoConsulta);

                var statusResponse = await _santanderService.ConsultarStatusPorTipoAsync(billId, tipoConsulta);

                _logger.LogInformation("✅ Status consultado com sucesso: {Status}", statusResponse.Status);

                return Ok(statusResponse);
            }
            catch (ArgumentException argEx)
            {
                _logger.LogWarning(argEx, "⚠️ Argumento inválido na consulta por tipo");
                return BadRequest(new { mensagem = argEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao consultar status por Tipo");
                return StatusCode(500, new
                {
                    mensagem = "Erro ao consultar status do boleto",
                    detalhes = ex.Message,
                    tipo = ex.GetType().Name
                });
            }
        }

        // POST: api/Boleto/{id}/enviar-email
        /// <summary>
        /// Envia o boleto por email para o cliente
        /// </summary>
        [HttpPost("{id}/enviar-email")]
        public async Task<ActionResult<EnvioEmailBoletoResult>> EnviarBoletoEmail(int id, [FromBody] EnviarEmailRequest? request = null)
        {
            try
            {
                _logger.LogInformation("📧 Iniciando envio de email para boleto ID: {BoletoId}", id);

                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (boleto == null)
                {
                    return NotFound(new { mensagem = $"Boleto com ID {id} não encontrado" });
                }

                // Obter email do destinatário (do request ou do cliente)
                var emailDestino = request?.EmailDestino;
                if (string.IsNullOrWhiteSpace(emailDestino))
                {
                    emailDestino = boleto.Contrato?.Cliente?.PessoaFisica?.EmailEmpresarial
                                ?? boleto.Contrato?.Cliente?.PessoaJuridica?.Email;
                }

                if (string.IsNullOrWhiteSpace(emailDestino))
                {
                    return BadRequest(new EnvioEmailBoletoResult
                    {
                        Sucesso = false,
                        Erro = "Cliente não possui email cadastrado",
                        EmailDestino = null
                    });
                }

                // Enviar boleto por email
                var resultado = await EnviarBoletoEmailInternoAsync(boleto, emailDestino);

                if (resultado.Sucesso)
                {
                    return Ok(resultado);
                }
                else
                {
                    return BadRequest(resultado);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao enviar email do boleto ID: {BoletoId}", id);
                return StatusCode(500, new EnvioEmailBoletoResult
                {
                    Sucesso = false,
                    Erro = ex.Message,
                    EmailDestino = null
                });
            }
        }

        /// <summary>
        /// Método interno para enviar boleto por email
        /// </summary>
        private async Task<EnvioEmailBoletoResult> EnviarBoletoEmailInternoAsync(Boleto boleto, string emailDestino)
        {
            try
            {
                // Baixar PDF do boleto
                byte[] pdfBytes;
                try
                {
                    var covenantCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";
                    var pdfLink = await _santanderService.BaixarPdfBoletoAsync(boleto.BankNumber, covenantCode, boleto.PayerDocumentNumber);

                    using var httpClient = new HttpClient();
                    httpClient.Timeout = TimeSpan.FromSeconds(30);
                    pdfBytes = await httpClient.GetByteArrayAsync(pdfLink);

                    _logger.LogInformation("📄 PDF baixado com sucesso. Tamanho: {Size} bytes", pdfBytes.Length);
                }
                catch (Exception pdfEx)
                {
                    _logger.LogError(pdfEx, "❌ Erro ao baixar PDF do boleto ID: {BoletoId}", boleto.Id);
                    return new EnvioEmailBoletoResult
                    {
                        Sucesso = false,
                        Erro = $"Erro ao baixar PDF: {pdfEx.Message}",
                        EmailDestino = emailDestino
                    };
                }

                // Dados do cliente
                var clienteNome = boleto.PayerName ??
                                 boleto.Contrato?.Cliente?.PessoaFisica?.Nome ??
                                 boleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial ??
                                 "Cliente";

                // Montar nome do arquivo
                var nomeArquivo = $"Boleto_{boleto.Id}_{boleto.DueDate:yyyy-MM-dd}.pdf";

                // 📦 Salvar PDF no Azure Blob Storage para portal do cliente
                try
                {
                    var blobFileName = $"boletos/{boleto.ContratoId}/Boleto_{boleto.Id}_{boleto.DueDate:yyyyMMdd}.pdf";
                    var blobUrl = await _blobStorageService.UploadFileAsync(blobFileName, pdfBytes, "application/pdf");
                    
                    // Atualizar boleto com URL do PDF armazenado
                    boleto.PdfBlobUrl = blobUrl;
                    boleto.PdfArmazenadoEm = DateTime.Now;
                    _context.Entry(boleto).Property(b => b.PdfBlobUrl).IsModified = true;
                    _context.Entry(boleto).Property(b => b.PdfArmazenadoEm).IsModified = true;
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("📦 PDF do boleto {BoletoId} salvo no Azure Blob Storage: {BlobUrl}", boleto.Id, blobUrl);
                }
                catch (Exception blobEx)
                {
                    // Não falhar o envio do email se o armazenamento do PDF falhar
                    _logger.LogWarning(blobEx, "⚠️ Falha ao salvar PDF do boleto {BoletoId} no Azure Blob Storage. Email será enviado normalmente.", boleto.Id);
                }

                // Enviar email
                var resultado = await _emailService.SendBoletoEmail(
                    toEmail: emailDestino,
                    clienteNome: clienteNome,
                    valor: boleto.NominalValue,
                    vencimento: boleto.DueDate,
                    numeroParcela: boleto.NumeroParcela ?? 1,
                    totalParcelas: boleto.Contrato?.NumeroParcelas,
                    linhaDigitavel: boleto.DigitableLine,
                    codigoPix: boleto.QrCodePix,
                    pdfBytes: pdfBytes,
                    nomeArquivoPdf: nomeArquivo
                );

                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro interno ao enviar boleto por email");
                return new EnvioEmailBoletoResult
                {
                    Sucesso = false,
                    Erro = ex.Message,
                    EmailDestino = emailDestino
                };
            }
        }

        // GET: api/Boleto/{id}/pdf-portal
        /// <summary>
        /// Baixar PDF armazenado no Azure Blob Storage (para portal do cliente)
        /// Este endpoint não acessa a API Santander, apenas o PDF armazenado localmente
        /// </summary>
        [HttpGet("{id}/pdf-portal")]
        public async Task<IActionResult> BaixarPdfBoletoPortal(int id)
        {
            try
            {
                _logger.LogInformation("📦 Portal: Baixando PDF armazenado do boleto ID: {BoletoId}", id);

                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (boleto == null)
                {
                    return NotFound(new { mensagem = $"Boleto com ID {id} não encontrado." });
                }

                // Verificar se o PDF está armazenado no Blob Storage
                if (string.IsNullOrEmpty(boleto.PdfBlobUrl))
                {
                    _logger.LogWarning("⚠️ Boleto {BoletoId} não possui PDF armazenado", id);
                    return NotFound(new { 
                        mensagem = "PDF não está disponível para download",
                        detalhes = "Este boleto foi gerado antes do sistema de armazenamento de PDFs. Use o endpoint /pdf para baixar diretamente do Santander.",
                        sugestao = "GET /api/Boleto/{id}/pdf"
                    });
                }

                // Extrair nome do arquivo do blob URL
                var blobFileName = new Uri(boleto.PdfBlobUrl).AbsolutePath.TrimStart('/');
                // Remove o nome do container do caminho
                var containerPrefix = "contratos/";
                if (blobFileName.StartsWith(containerPrefix))
                {
                    blobFileName = blobFileName.Substring(containerPrefix.Length);
                }

                _logger.LogInformation("📥 Baixando PDF do Blob Storage: {BlobFileName}", blobFileName);

                byte[] pdfBytes;
                try
                {
                    pdfBytes = await _blobStorageService.DownloadFileAsync(blobFileName);
                }
                catch (FileNotFoundException)
                {
                    _logger.LogError("❌ Arquivo não encontrado no Blob Storage: {BlobFileName}", blobFileName);
                    return NotFound(new { 
                        mensagem = "Arquivo PDF não encontrado no armazenamento",
                        detalhes = "O arquivo pode ter sido removido. Use o endpoint /pdf para baixar novamente do Santander."
                    });
                }

                // Gerar nome padronizado do arquivo
                var clienteNome = boleto.PayerName ??
                                 boleto.Contrato?.Cliente?.PessoaFisica?.Nome ??
                                 boleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial ??
                                 "Cliente";

                clienteNome = LimparNomeArquivo(clienteNome);
                var dataVencimento = boleto.DueDate.ToString("yyyy-MM-dd");
                var nomeArquivo = $"Boleto_{id}_{clienteNome}_{dataVencimento}.pdf";

                _logger.LogInformation("✅ PDF do portal baixado com sucesso. Tamanho: {Size} bytes", pdfBytes.Length);

                return File(pdfBytes, "application/pdf", nomeArquivo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao baixar PDF do portal para boleto ID: {BoletoId}", id);
                return StatusCode(500, new { 
                    mensagem = "Erro ao baixar PDF",
                    detalhes = ex.Message
                });
            }
        }

        // GET: api/Boleto/{id}/pdf
        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> BaixarPdfBoleto(int id)
        {
            try
            {
                _logger.LogInformation("📄 Baixando PDF do boleto ID: {BoletoId}", id);

                var boleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (boleto == null)
                {
                    return NotFound(new { mensagem = $"Boleto com ID {id} não encontrado." });
                }

                if (string.IsNullOrEmpty(boleto.BankNumber))
                {
                    return BadRequest(new { mensagem = "Boleto não possui BankNumber válido para download do PDF." });
                }

                // Se já existe PDF armazenado no blob, priorizar este arquivo para preservar
                // o layout original registrado (vencimento original), evitando variações de 2ª via.
                if (!string.IsNullOrEmpty(boleto.PdfBlobUrl))
                {
                    try
                    {
                        var blobFileName = new Uri(boleto.PdfBlobUrl).AbsolutePath.TrimStart('/');
                        var containerPrefix = "contratos/";
                        if (blobFileName.StartsWith(containerPrefix))
                        {
                            blobFileName = blobFileName.Substring(containerPrefix.Length);
                        }

                        _logger.LogInformation("📦 PDF já armazenado. Baixando do blob: {BlobFileName}", blobFileName);
                        var pdfBlobBytes = await _blobStorageService.DownloadFileAsync(blobFileName);

                        var clienteNomeBlob = boleto.PayerName ??
                                              boleto.Contrato?.Cliente?.PessoaFisica?.Nome ??
                                              boleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial ??
                                              "Cliente";
                        clienteNomeBlob = LimparNomeArquivo(clienteNomeBlob);
                        var nomeArquivoBlob = $"Boleto_{id}_{clienteNomeBlob}_{boleto.DueDate:yyyy-MM-dd}.pdf";

                        return File(pdfBlobBytes, "application/pdf", nomeArquivoBlob);
                    }
                    catch (Exception blobEx)
                    {
                        _logger.LogWarning(blobEx, "⚠️ Falha ao baixar PDF do blob para boleto {BoletoId}. Fazendo fallback para Santander.", id);
                    }
                }

                var covenantCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";

                _logger.LogInformation("📄 BankNumber: {BankNumber}, CovenantCode: {CovenantCode}", boleto.BankNumber, covenantCode);

                // Obter link do PDF da API Santander
                _logger.LogInformation("📄 Obtendo link do PDF da API Santander...");
                var pdfLink = await _santanderService.BaixarPdfBoletoAsync(boleto.BankNumber, covenantCode, boleto.PayerDocumentNumber);

                _logger.LogInformation("✅ Link do PDF obtido: {PdfLink}", pdfLink);

                // Baixar o PDF do link fornecido pelo Santander
                _logger.LogInformation("📥 Baixando arquivo PDF do link...");
                var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var pdfBytes = await httpClient.GetByteArrayAsync(pdfLink);

                _logger.LogInformation("✅ PDF baixado com sucesso. Tamanho: {Size} bytes", pdfBytes.Length);

                // 📦 Se o PDF não estava armazenado, salvar agora
                if (string.IsNullOrEmpty(boleto.PdfBlobUrl))
                {
                    try
                    {
                        var blobFileName = $"boletos/{boleto.ContratoId}/Boleto_{boleto.Id}_{boleto.DueDate:yyyyMMdd}.pdf";
                        var blobUrl = await _blobStorageService.UploadFileAsync(blobFileName, pdfBytes, "application/pdf");
                        
                        boleto.PdfBlobUrl = blobUrl;
                        boleto.PdfArmazenadoEm = DateTime.Now;
                        _context.Entry(boleto).Property(b => b.PdfBlobUrl).IsModified = true;
                        _context.Entry(boleto).Property(b => b.PdfArmazenadoEm).IsModified = true;
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation("📦 PDF do boleto {BoletoId} salvo no Azure Blob Storage: {BlobUrl}", boleto.Id, blobUrl);
                    }
                    catch (Exception blobEx)
                    {
                        _logger.LogWarning(blobEx, "⚠️ Falha ao salvar PDF do boleto {BoletoId} no Azure Blob Storage", id);
                    }
                }

                // Gerar nome padronizado do arquivo
                var clienteNome = boleto.PayerName ??
                                 boleto.Contrato?.Cliente?.PessoaFisica?.Nome ??
                                 boleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial ??
                                 "Cliente";

                // Limpar nome do cliente (remover caracteres inválidos)
                clienteNome = LimparNomeArquivo(clienteNome);

                var dataVencimento = boleto.DueDate.ToString("yyyy-MM-dd");
                var nomeArquivo = $"Boleto_{id}_{clienteNome}_{dataVencimento}.pdf";

                _logger.LogInformation("📄 Nome do arquivo: {NomeArquivo}", nomeArquivo);

                // Retornar o PDF diretamente com headers apropriados
                return File(pdfBytes, "application/pdf", nomeArquivo);
            }
            catch (HttpRequestException httpEx)
            {
                _logger.LogError(httpEx, "❌ Erro HTTP ao baixar PDF do Santander para boleto ID: {BoletoId}", id);
                return StatusCode(500, new {
                    mensagem = "Erro ao comunicar com a API Santander",
                    detalhes = $"Não foi possível baixar o PDF. Verifique se o boleto foi registrado corretamente no Santander. Erro: {httpEx.Message}",
                    tipo = "HttpRequestException"
                });
            }
            catch (TaskCanceledException timeoutEx)
            {
                _logger.LogError(timeoutEx, "❌ Timeout ao baixar PDF do Santander para boleto ID: {BoletoId}", id);
                return StatusCode(500, new {
                    mensagem = "Timeout ao baixar PDF",
                    detalhes = "A requisição para a API Santander demorou muito tempo. Tente novamente.",
                    tipo = "TimeoutException"
                });
            }
            catch (InvalidOperationException invalidOpEx) when (invalidOpEx.Message.Contains("access token"))
            {
                _logger.LogError(invalidOpEx, "❌ Erro de autenticação ao baixar PDF do boleto ID: {BoletoId}", id);
                return StatusCode(500, new {
                    mensagem = "Erro de autenticação com a API Santander",
                    detalhes = invalidOpEx.Message + " Verifique se o certificado mTLS está configurado corretamente.",
                    tipo = "AuthenticationException",
                    innerException = invalidOpEx.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro geral ao baixar PDF do boleto ID: {BoletoId}. Tipo: {ExType}. StackTrace: {StackTrace}",
                    id, ex.GetType().Name, ex.StackTrace);
                return StatusCode(500, new {
                    mensagem = "Erro interno do servidor",
                    detalhes = ex.Message,
                    tipo = ex.GetType().Name,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        private string LimparNomeArquivo(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                return "SemNome";

            // Remover caracteres inválidos para nomes de arquivo
            var caracteresInvalidos = Path.GetInvalidFileNameChars();
            var nomeLimpo = new string(nome
                .Where(c => !caracteresInvalidos.Contains(c))
                .ToArray());

            // Substituir espaços por underscore e limitar tamanho
            nomeLimpo = nomeLimpo.Replace(" ", "_");

            // Limitar a 50 caracteres
            if (nomeLimpo.Length > 50)
            {
                nomeLimpo = nomeLimpo.Substring(0, 50);
            }

            return string.IsNullOrWhiteSpace(nomeLimpo) ? "Cliente" : nomeLimpo;
        }

        /// <summary>
        /// Atualiza o status do boleto no banco de dados com base na resposta da API Santander
        /// </summary>
        private async Task AtualizarStatusBoletoNoBanco(Boleto boleto, BoletoStatusResponseDTO statusResponse)
        {
            try
            {
                var statusAnterior = boleto.Status;
                var foiPagoAnterior = boleto.FoiPago;

                // Atualizar Status principal
                if (!string.IsNullOrEmpty(statusResponse.Status))
                {
                    boleto.Status = statusResponse.Status.ToUpper();
                    _logger.LogInformation("📝 Atualizando status do boleto ID {BoletoId}: {StatusAnterior} → {StatusNovo}",
                        boleto.Id, statusAnterior, boleto.Status);
                }

                // ====================================================================
                // PERSISTIR CAMPOS DE PAGAMENTO (FoiPago, ValorPago, DataPagamento)
                // ====================================================================

                // Atualizar FoiPago baseado na lógica do DTO
                boleto.FoiPago = statusResponse.FoiPago;

                // Atualizar ValorPago
                if (statusResponse.PaidValue.HasValue && statusResponse.PaidValue > 0)
                {
                    boleto.ValorPago = statusResponse.PaidValue;
                    _logger.LogInformation("💰 Boleto ID {BoletoId} foi pago. Valor: R$ {Valor}, FoiPago: {FoiPago}",
                        boleto.Id, statusResponse.PaidValue, boleto.FoiPago);
                }
                else if (!boleto.FoiPago)
                {
                    // Só limpa valor pago quando o boleto de fato NÃO está pago.
                    // Se a API omitir paidValue em um retorno pontual de boleto já pago,
                    // preservamos o valor histórico que já estava no banco.
                    boleto.ValorPago = null;
                }

                // Atualizar DataPagamento (data de liquidação)
                DateTime? dataPagamentoFinal = null;
                
                // 1. Tentar obter do campo SettlementDate direto
                if (!string.IsNullOrEmpty(statusResponse.SettlementDate) &&
                    DateTime.TryParse(statusResponse.SettlementDate, out DateTime settlementDate))
                {
                    dataPagamentoFinal = settlementDate;
                    _logger.LogInformation("📅 Data de pagamento encontrada em SettlementDate: {Data}", settlementDate);
                }
                // 2. Se não tiver, tentar obter do array Settlements (comum para PIX)
                else if (statusResponse.Settlements != null && statusResponse.Settlements.Any())
                {
                    var ultimaLiquidacao = statusResponse.Settlements
                        .Where(s => !string.IsNullOrEmpty(s.SettlementDate))
                        .OrderByDescending(s => s.SettlementDate)
                        .FirstOrDefault();
                    
                    if (ultimaLiquidacao != null && DateTime.TryParse(ultimaLiquidacao.SettlementDate, out DateTime settlementDateFromArray))
                    {
                        dataPagamentoFinal = settlementDateFromArray;
                        _logger.LogInformation("📅 Data de pagamento encontrada em Settlements[]: {Data}, Tipo: {Tipo}", 
                            settlementDateFromArray, ultimaLiquidacao.SettlementType);
                    }
                }
                // 3. Se não tem data da API, manter o que já existe no banco (não sobrescrever com null)
                else if (boleto.DataPagamento != null)
                {
                    dataPagamentoFinal = boleto.DataPagamento;
                    _logger.LogInformation("📅 Mantendo DataPagamento existente: {Data}", boleto.DataPagamento);
                }
                else if (statusResponse.FoiPago && statusResponse.PaidValue > 0 && boleto.DataPagamento == null)
                {
                    // API não retorna data de liquidação - usar data atual como aproximação
                    // Isso só acontece na PRIMEIRA vez que detectamos o pagamento
                    dataPagamentoFinal = DateTime.UtcNow;
                    _logger.LogInformation("📅 Boleto {BoletoId} pago (R$ {Valor}) - Usando data atual como DataPagamento (API Santander não retorna settlementDate)", 
                        boleto.Id, statusResponse.PaidValue);
                }
                
                // Aplicar a data de pagamento se encontrada
                if (dataPagamentoFinal.HasValue)
                {
                    boleto.DataPagamento = dataPagamentoFinal.Value;
                    boleto.DataAtualizacao = dataPagamentoFinal.Value;
                    _logger.LogInformation("📅 Data de pagamento atualizada: {Data}", dataPagamentoFinal.Value);
                }
                else
                {
                    boleto.DataAtualizacao = DateTime.UtcNow;
                    // Não limpar DataPagamento se já existir
                }

                // Atualizar campos adicionais se disponíveis
                if (!string.IsNullOrEmpty(statusResponse.BarCode) && string.IsNullOrEmpty(boleto.BarCode))
                {
                    boleto.BarCode = statusResponse.BarCode;
                }

                if (!string.IsNullOrEmpty(statusResponse.DigitableLine) && string.IsNullOrEmpty(boleto.DigitableLine))
                {
                    boleto.DigitableLine = statusResponse.DigitableLine;
                }

                if (!string.IsNullOrEmpty(statusResponse.QrCodePix) && string.IsNullOrEmpty(boleto.QrCodePix))
                {
                    boleto.QrCodePix = statusResponse.QrCodePix;
                }

                if (!string.IsNullOrEmpty(statusResponse.QrCodeUrl) && string.IsNullOrEmpty(boleto.QrCodeUrl))
                {
                    boleto.QrCodeUrl = statusResponse.QrCodeUrl;
                }

                // Salvar no banco de dados
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Status do boleto ID {BoletoId} atualizado com sucesso no banco de dados. FoiPago: {FoiPago}, ValorPago: {ValorPago}",
                    boleto.Id, boleto.FoiPago, boleto.ValorPago);

                // Log especial para mudanças importantes
                if (statusAnterior != boleto.Status || foiPagoAnterior != boleto.FoiPago)
                {
                    if (boleto.FoiPago && boleto.Status == "LIQUIDADO")
                    {
                        _logger.LogInformation("🎉 BOLETO PAGO (linha digitável/código de barras)! ID: {BoletoId}, Status: {Status}, ValorPago: R$ {ValorPago}",
                            boleto.Id, boleto.Status, boleto.ValorPago);

                        // 🔔 Enviar notificação de boleto pago
                        await _notificacaoService.NotificarBoletoPagoAsync(boleto);

                        // 🔄 Processar renegociação automática se for boleto avulso pago
                        if (!boleto.NumeroParcela.HasValue)
                        {
                            await ProcessarRenegociacaoAutomaticaAsync(boleto);
                        }
                    }
                    else if (boleto.FoiPago && boleto.Status == "BAIXADO")
                    {
                        _logger.LogInformation("🎉 BOLETO PAGO (PIX)! ID: {BoletoId}, Status: {Status}, ValorPago: R$ {ValorPago}",
                            boleto.Id, boleto.Status, boleto.ValorPago);

                        // 🔔 Enviar notificação de boleto pago
                        await _notificacaoService.NotificarBoletoPagoAsync(boleto);

                        // 🔄 Processar renegociação automática se for boleto avulso pago
                        if (!boleto.NumeroParcela.HasValue)
                        {
                            await ProcessarRenegociacaoAutomaticaAsync(boleto);
                        }
                    }
                    else if (!boleto.FoiPago && boleto.Status == "BAIXADO")
                    {
                        _logger.LogInformation("📋 Boleto BAIXADO (não pago/expirado)! ID: {BoletoId}, Status: {Status}",
                            boleto.Id, boleto.Status);
                    }
                    else if (boleto.Status == "CANCELADO")
                    {
                        _logger.LogInformation("❌ Boleto CANCELADO! ID: {BoletoId}, NSU: {NsuCode}",
                            boleto.Id, boleto.NsuCode);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao atualizar status do boleto ID {BoletoId} no banco de dados", boleto.Id);
                throw;
            }
        }

        #endregion

        #region Mapas de Faturamento

        // GET: api/Boleto/mapas-faturamento
        [HttpGet("mapas-faturamento")]
        public async Task<ActionResult<object>> GetMapasFaturamento()
        {
            try
            {
                _logger.LogInformation("🗺️ GetMapasFaturamento: Iniciando busca de mapas de faturamento");

                // Obter usuário logado
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    _logger.LogWarning("❌ GetMapasFaturamento: Usuário não identificado");
                    return Unauthorized("Usuário não identificado na requisição.");
                }

                // Buscar filiais com clientes e contratos (ordenadas alfabeticamente)
                var filiaisQuery = _context.Filiais
                    .Where(f => f.Id > 0)
                    .OrderBy(f => f.Nome);

                // Aplicar filtros por permissões de usuário
                var usuario = await _context.Usuarios
                    .Include(u => u.GrupoAcesso)
                    .Include(u => u.Filial)
                    .FirstOrDefaultAsync(u => u.Id == usuarioId);

                if (usuario == null)
                {
                    return Unauthorized("Usuário não encontrado.");
                }

                IQueryable<Filial> filialsFiltradas = filiaisQuery;

                // Se usuário é Gestor de Filial, filtrar apenas sua filial
                if (usuario.GrupoAcesso?.Nome == "Gestor de Filial" && usuario.FilialId.HasValue)
                {
                    filialsFiltradas = filiaisQuery.Where(f => f.Id == usuario.FilialId.Value);
                }

                var filiais = await filialsFiltradas.ToListAsync();

                var resultado = new List<object>();

                foreach (var filial in filiais)
                {
                    // Buscar clientes da filial
                    var clientesQuery = _context.Clientes
                        .Where(c => c.FilialId == filial.Id && c.Ativo)
                        .Include(c => c.PessoaFisica)
                        .Include(c => c.PessoaJuridica);

                    var clientesTemp = await clientesQuery.ToListAsync();

                    // Ordenar alfabeticamente em memória
                    var clientes = clientesTemp.OrderBy(c =>
                        c.TipoPessoa == "Fisica"
                            ? c.PessoaFisica?.Nome ?? ""
                            : c.PessoaJuridica?.RazaoSocial ?? ""
                    ).ToList();

                    var clientesData = new List<object>();

                    foreach (var cliente in clientes)
                    {
                        // Buscar contratos ativos do cliente para pegar os IDs
                        var contratoIds = await _context.Contratos
                            .Where(co => co.ClienteId == cliente.Id && co.Ativo)
                            .Select(co => co.Id)
                            .ToListAsync();

                        if (!contratoIds.Any()) continue; // Pular clientes sem contratos ativos

                        // Buscar TODOS os boletos do cliente de todos os contratos ativos
                        var todosBoletos = await _context.Boletos
                            .Where(b => contratoIds.Contains(b.ContratoId))
                            .Include(b => b.Contrato)
                            .OrderBy(b => b.DueDate)
                            .ToListAsync();

                        if (!todosBoletos.Any()) continue; // Pular clientes sem boletos

                        // USAR O NOME DO PAGADOR DO BOLETO (fonte mais confiável)
                        // Pegar o nome do primeiro boleto (todos boletos do mesmo cliente têm o mesmo payerName)
                        var primeiroBoleto = todosBoletos.FirstOrDefault();
                        var nomeCliente = primeiroBoleto?.PayerName ??
                            (cliente.TipoPessoa == "Fisica"
                                ? cliente.PessoaFisica?.Nome
                                : cliente.PessoaJuridica?.RazaoSocial) ?? "Cliente sem nome";

                        var documentoCliente = primeiroBoleto?.PayerDocumentNumber ??
                            (cliente.TipoPessoa == "Fisica"
                                ? cliente.PessoaFisica?.Cpf
                                : cliente.PessoaJuridica?.Cnpj) ?? "Sem documento";

                        _logger.LogInformation($"👤 Cliente ID {cliente.Id}: Nome='{nomeCliente}', Documento='{documentoCliente}' (de {todosBoletos.Count} boletos)");

                        // Agrupar boletos pagos (histórico)
                        var boletosPagos = todosBoletos
                            .Where(b => b.Status == "LIQUIDADO")
                            .Select(b => new
                            {
                                Id = b.Id,
                                ContratoId = b.ContratoId,
                                NumeroContrato = $"Contrato #{b.ContratoId}",
                                NumeroPasta = b.Contrato?.NumeroPasta,
                                NsuCode = b.NsuCode,
                                DataEmissao = b.IssueDate.ToString("dd/MM/yyyy"),
                                DataVencimento = b.DueDate.ToString("dd/MM/yyyy"),
                                DataPagamento = b.EntryDate?.ToString("dd/MM/yyyy"),
                                Valor = b.NominalValue,
                                Status = b.Status
                            })
                            .OrderByDescending(b => b.DataPagamento)
                            .ToList();

                        // Agrupar boletos à pagar (ativos)
                        var boletosAPagar = todosBoletos
                            .Where(b => b.Status != "LIQUIDADO" && b.Status != "CANCELADO")
                            .Select(b => new
                            {
                                Id = b.Id,
                                ContratoId = b.ContratoId,
                                NumeroContrato = $"Contrato #{b.ContratoId}",
                                NumeroPasta = b.Contrato?.NumeroPasta,
                                NsuCode = b.NsuCode,
                                DataEmissao = b.IssueDate.ToString("dd/MM/yyyy"),
                                DataVencimento = b.DueDate.ToString("dd/MM/yyyy"),
                                Valor = b.NominalValue,
                                Status = b.Status,
                                Vencido = b.DueDate < DateTime.Now && b.Status != "LIQUIDADO"
                            })
                            .OrderBy(b => b.DataVencimento)
                            .ToList();

                        // Adicionar cliente com seus boletos
                        clientesData.Add(new
                        {
                            ClienteId = cliente.Id,
                            Nome = nomeCliente,
                            Documento = documentoCliente,
                            TipoPessoa = cliente.TipoPessoa,
                            TotalBoletos = todosBoletos.Count,
                            TotalPagos = boletosPagos.Count,
                            TotalAPagar = boletosAPagar.Count,
                            ValorTotalPago = boletosPagos.Sum(b => b.Valor),
                            ValorTotalAPagar = boletosAPagar.Sum(b => b.Valor),
                            BoletosPagos = boletosPagos,
                            BoletosAPagar = boletosAPagar
                        });
                    }

                    if (clientesData.Any())
                    {
                        resultado.Add(new
                        {
                            FilialId = filial.Id,
                            FilialNome = filial.Nome,
                            TotalClientes = clientesData.Count,
                            Clientes = clientesData
                        });
                    }
                }

                _logger.LogInformation($"✅ GetMapasFaturamento: Retornando {resultado.Count} filiais com dados");

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ GetMapasFaturamento: Erro completo: {ex.Message}");
                return StatusCode(500, new { erro = "Erro interno do servidor", detalhes = ex.Message });
            }
        }

        #endregion

        #region Geração em Lote de Boletos

        /// <summary>
        /// Preview da geração em lote - mostra quais boletos seriam gerados
        /// </summary>
        [HttpGet("gerar-lote/preview")]
        public async Task<ActionResult<PreviewGeracaoLoteDTO>> GetPreviewGeracaoLote()
        {
            try
            {
                _logger.LogInformation("📋 Iniciando preview de geração em lote de boletos");

                var hoje = DateTime.Today;
                var limiteVencimento = hoje.AddDays(7); // Janela de 7 dias

                // Buscar contratos ativos com dados de pagamento
                var contratosQuery = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.Filial)
                    .Where(c => c.Ativo &&
                                c.Situacao != null &&
                                c.Situacao.ToLower() == "cliente" &&
                                c.PrimeiroVencimento != null &&
                                c.ValorParcela != null &&
                                c.ValorParcela > 0)
                    .ToListAsync();

                _logger.LogInformation($"📊 Encontrados {contratosQuery.Count} contratos ativos com dados de pagamento");

                var contratosParaGerar = new List<ContratoParaGerarDTO>();

                foreach (var contrato in contratosQuery)
                {
                    var resultado = await CalcularProximaParcelaAsync(contrato, hoje, limiteVencimento);

                    if (resultado != null)
                    {
                        contratosParaGerar.Add(resultado);
                    }
                }

                var preview = new PreviewGeracaoLoteDTO
                {
                    TotalContratosAtivos = contratosQuery.Count,
                    ContratosParaGerar = contratosParaGerar.Count,
                    ValorTotal = contratosParaGerar.Sum(c => c.Valor),
                    Contratos = contratosParaGerar.OrderBy(c => c.DataVencimento).ToList()
                };

                _logger.LogInformation($"✅ Preview concluído: {preview.ContratosParaGerar} boletos serão gerados (R$ {preview.ValorTotal:N2})");

                return Ok(preview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao gerar preview de geração em lote");
                return StatusCode(500, new { erro = "Erro ao gerar preview", detalhes = ex.Message });
            }
        }

        /// <summary>
        /// Diagnóstico detalhado - mostra por que cada contrato não está gerando boleto
        /// </summary>
        [HttpGet("gerar-lote/diagnostico")]
        public async Task<ActionResult> GetDiagnosticoGeracaoLote()
        {
            try
            {
                _logger.LogInformation("🔍 Iniciando diagnóstico de geração em lote");

                var hoje = DateTime.Today;
                var limiteVencimento = hoje.AddDays(7);
                var diagnosticos = new List<object>();

                // Buscar TODOS os contratos ativos (sem filtros de situação/pagamento)
                var todosContratos = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Where(c => c.Ativo)
                    .ToListAsync();

                _logger.LogInformation($"📊 Total de contratos ativos: {todosContratos.Count}");

                foreach (var contrato in todosContratos.Take(50)) // Limitar a 50 para não sobrecarregar
                {
                    var clienteNome = contrato.Cliente?.PessoaFisica?.Nome ??
                                     contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";

                    var motivos = new List<string>();
                    var info = new Dictionary<string, object?>
                    {
                        ["contratoId"] = contrato.Id,
                        ["clienteNome"] = clienteNome,
                        ["situacao"] = contrato.Situacao,
                        ["primeiroVencimento"] = contrato.PrimeiroVencimento?.ToString("dd/MM/yyyy"),
                        ["valorParcela"] = contrato.ValorParcela,
                        ["numeroParcelas"] = contrato.NumeroParcelas
                    };

                    // Verificar filtros
                    if (string.IsNullOrEmpty(contrato.Situacao))
                    {
                        motivos.Add("❌ Situação não definida");
                    }
                    else if (contrato.Situacao.ToLower() != "cliente")
                    {
                        motivos.Add($"❌ Situação não é 'cliente' (atual: '{contrato.Situacao}')");
                    }

                    if (contrato.PrimeiroVencimento == null)
                    {
                        motivos.Add("❌ Primeiro vencimento não definido");
                    }

                    if (contrato.ValorParcela == null || contrato.ValorParcela <= 0)
                    {
                        motivos.Add($"❌ Valor da parcela inválido (atual: {contrato.ValorParcela})");
                    }

                    // Se passou nos filtros básicos, verificar janela de vencimento
                    if (motivos.Count == 0 && contrato.PrimeiroVencimento != null && contrato.ValorParcela > 0)
                    {
                        var primeiroVencimento = contrato.PrimeiroVencimento.Value;
                        var totalParcelas = contrato.NumeroParcelas ?? 0;
                        var isContratoCorrente = totalParcelas == 0;

                        int proximaParcela;
                        DateTime dataVencimento;

                        if (primeiroVencimento.Date >= hoje.Date)
                        {
                            proximaParcela = 1;
                            dataVencimento = primeiroVencimento;
                        }
                        else
                        {
                            // Calcular a data de vencimento do mês atual
                            var diaVencimento = primeiroVencimento.Day;
                            var ultimoDiaMesAtual = DateTime.DaysInMonth(hoje.Year, hoje.Month);

                            // Ajustar se o dia não existe no mês atual
                            if (diaVencimento > ultimoDiaMesAtual)
                            {
                                diaVencimento = ultimoDiaMesAtual;
                            }

                            var vencimentoMesAtual = new DateTime(hoje.Year, hoje.Month, diaVencimento);

                            // Se o vencimento deste mês ainda não passou, usar ele
                            if (vencimentoMesAtual.Date >= hoje.Date)
                            {
                                dataVencimento = vencimentoMesAtual;
                            }
                            else
                            {
                                // Se já passou, usar o próximo mês
                                var proximoMes = hoje.AddMonths(1);
                                var ultimoDiaProximoMes = DateTime.DaysInMonth(proximoMes.Year, proximoMes.Month);
                                diaVencimento = primeiroVencimento.Day;
                                if (diaVencimento > ultimoDiaProximoMes)
                                {
                                    diaVencimento = ultimoDiaProximoMes;
                                }
                                dataVencimento = new DateTime(proximoMes.Year, proximoMes.Month, diaVencimento);
                            }

                            // Calcular qual parcela seria esta baseado na diferença de meses
                            var mesesDesdeInicio = ((dataVencimento.Year - primeiroVencimento.Year) * 12)
                                                 + (dataVencimento.Month - primeiroVencimento.Month);
                            proximaParcela = mesesDesdeInicio + 1;

                            if (proximaParcela < 1) proximaParcela = 1;
                        }

                        info["proximaParcela"] = proximaParcela;
                        info["dataVencimentoCalculada"] = dataVencimento.ToString("dd/MM/yyyy");

                        // Verificar se parcelas finalizadas
                        if (!isContratoCorrente && proximaParcela > totalParcelas)
                        {
                            motivos.Add($"❌ Todas as {totalParcelas} parcelas já finalizadas");
                        }
                        else
                        {
                            var diasAteVencimento = (dataVencimento - hoje).Days;
                            info["diasAteVencimento"] = diasAteVencimento;

                            if (diasAteVencimento <= 0)
                            {
                                motivos.Add($"❌ Vencimento já passou ({diasAteVencimento} dias)");
                            }
                            else if (diasAteVencimento > 7)
                            {
                                motivos.Add($"❌ Fora da janela de 7 dias ({diasAteVencimento} dias até vencimento)");
                            }
                            else
                            {
                                // Verificar se já existe boleto (incluindo BAIXADOS e CANCELADOS)
                                var boletoExistente = await _context.Boletos
                                    .AnyAsync(b => b.ContratoId == contrato.Id &&
                                                  b.NumeroParcela == proximaParcela);

                                if (boletoExistente)
                                {
                                    motivos.Add($"❌ Boleto da parcela {proximaParcela} já existe (incluindo baixados)");
                                }
                                else
                                {
                                    var boletoMesmoVencimento = await _context.Boletos
                                        .AnyAsync(b => b.ContratoId == contrato.Id &&
                                                      b.DueDate.Date == dataVencimento.Date);

                                    if (boletoMesmoVencimento)
                                    {
                                        motivos.Add($"❌ Boleto com vencimento {dataVencimento:dd/MM/yyyy} já existe (incluindo baixados)");
                                    }
                                    else
                                    {
                                        // Verificar por mês/ano (para boletos manuais sem NumeroParcela)
                                        var boletoMesmoMesAno = await _context.Boletos
                                            .AnyAsync(b => b.ContratoId == contrato.Id &&
                                                          b.DueDate.Month == dataVencimento.Month &&
                                                          b.DueDate.Year == dataVencimento.Year);

                                        if (boletoMesmoMesAno)
                                        {
                                            motivos.Add($"❌ Boleto para {dataVencimento:MM/yyyy} já existe (mesmo mês)");
                                        }
                                        else
                                        {
                                            motivos.Add("✅ ELEGÍVEL PARA GERAÇÃO");
                                        }
                                    }
                                }
                            }
                        }
                    }

                    info["motivos"] = motivos;
                    info["podeGerar"] = motivos.Any(m => m.StartsWith("✅"));

                    diagnosticos.Add(info);
                }

                // Estatísticas
                var elegiveis = diagnosticos.Count(d => ((List<string>)((dynamic)d)["motivos"]).Any(m => m.StartsWith("✅")));
                var porSituacao = diagnosticos.Count(d => ((List<string>)((dynamic)d)["motivos"]).Any(m => m.Contains("Situação")));
                var porVencimento = diagnosticos.Count(d => ((List<string>)((dynamic)d)["motivos"]).Any(m => m.Contains("vencimento não definido")));
                var porValor = diagnosticos.Count(d => ((List<string>)((dynamic)d)["motivos"]).Any(m => m.Contains("Valor da parcela")));
                var foraDaJanela = diagnosticos.Count(d => ((List<string>)((dynamic)d)["motivos"]).Any(m => m.Contains("Fora da janela")));
                var jaExiste = diagnosticos.Count(d => ((List<string>)((dynamic)d)["motivos"]).Any(m => m.Contains("já existe")));

                return Ok(new
                {
                    dataAnalise = hoje.ToString("dd/MM/yyyy"),
                    janelaVencimento = $"{hoje:dd/MM/yyyy} até {limiteVencimento:dd/MM/yyyy}",
                    totalContratosAnalisados = diagnosticos.Count,
                    estatisticas = new
                    {
                        elegiveis,
                        bloqueadosPorSituacao = porSituacao,
                        bloqueadosPorVencimentoNaoDefinido = porVencimento,
                        bloqueadosPorValorInvalido = porValor,
                        bloqueadosPorForaDaJanela = foraDaJanela,
                        bloqueadosPorBoletoJaExiste = jaExiste
                    },
                    contratos = diagnosticos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro no diagnóstico de geração em lote");
                return StatusCode(500, new { erro = "Erro no diagnóstico", detalhes = ex.Message });
            }
        }

        /// <summary>
        /// Diagnóstico específico de um contrato - mostra por que não aparece para gerar boleto
        /// </summary>
        [HttpGet("gerar-lote/diagnostico/{contratoId}")]
        public async Task<ActionResult> GetDiagnosticoContrato(int contratoId)
        {
            try
            {
                _logger.LogInformation($"🔍 Diagnóstico específico do contrato #{contratoId}");

                var hoje = DateTime.Today;
                var limiteVencimento = hoje.AddDays(7);

                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.Filial)
                    .FirstOrDefaultAsync(c => c.Id == contratoId);

                if (contrato == null)
                {
                    return NotFound(new { erro = $"Contrato #{contratoId} não encontrado" });
                }

                var clienteNome = contrato.Cliente?.PessoaFisica?.Nome ??
                                 contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";

                var motivos = new List<string>();
                var info = new Dictionary<string, object?>
                {
                    ["contratoId"] = contrato.Id,
                    ["clienteNome"] = clienteNome,
                    ["filial"] = contrato.Cliente?.Filial?.Nome,
                    ["ativo"] = contrato.Ativo,
                    ["situacao"] = contrato.Situacao,
                    ["primeiroVencimento"] = contrato.PrimeiroVencimento?.ToString("dd/MM/yyyy"),
                    ["valorParcela"] = contrato.ValorParcela,
                    ["numeroParcelas"] = contrato.NumeroParcelas,
                    ["dataAnalise"] = hoje.ToString("dd/MM/yyyy"),
                    ["janelaGeracao"] = $"{hoje:dd/MM/yyyy} até {limiteVencimento:dd/MM/yyyy}"
                };

                // ============================================
                // VERIFICAÇÃO 1: Contrato Ativo
                // ============================================
                if (!contrato.Ativo)
                {
                    motivos.Add("❌ Contrato INATIVO (Ativo = false)");
                }
                else
                {
                    motivos.Add("✅ Contrato ativo");
                }

                // ============================================
                // VERIFICAÇÃO 2: Situação
                // ============================================
                if (string.IsNullOrEmpty(contrato.Situacao))
                {
                    motivos.Add("❌ Situação não definida (NULL)");
                }
                else if (contrato.Situacao.ToLower() != "cliente")
                {
                    motivos.Add($"❌ Situação = '{contrato.Situacao}' (deve ser 'cliente')");
                }
                else
                {
                    motivos.Add("✅ Situação = 'Cliente'");
                }

                // ============================================
                // VERIFICAÇÃO 3: Primeiro Vencimento
                // ============================================
                if (contrato.PrimeiroVencimento == null)
                {
                    motivos.Add("❌ Primeiro vencimento não definido (NULL)");
                    info["podeGerar"] = false;
                    info["motivos"] = motivos;
                    return Ok(info);
                }
                else
                {
                    motivos.Add($"✅ Primeiro vencimento = {contrato.PrimeiroVencimento:dd/MM/yyyy}");
                }

                // ============================================
                // VERIFICAÇÃO 4: Valor da Parcela
                // ============================================
                if (contrato.ValorParcela == null || contrato.ValorParcela <= 0)
                {
                    motivos.Add($"❌ Valor da parcela inválido: R$ {contrato.ValorParcela?.ToString("N2") ?? "NULL"}");
                    info["podeGerar"] = false;
                    info["motivos"] = motivos;
                    return Ok(info);
                }
                else
                {
                    motivos.Add($"✅ Valor da parcela = R$ {contrato.ValorParcela:N2}");
                }

                // ============================================
                // VERIFICAÇÃO 5: Boletos existentes
                // ============================================
                var boletosContrato = await _context.Boletos
                    .Where(b => b.ContratoId == contratoId)
                    .OrderByDescending(b => b.DueDate)
                    .ToListAsync();

                var boletosAtivos = boletosContrato.Where(b => b.Ativo).ToList();
                var boletosInativos = boletosContrato.Where(b => !b.Ativo).ToList();

                info["boletosAtivos"] = boletosAtivos.Select(b => new
                {
                    id = b.Id,
                    parcela = b.NumeroParcela,
                    vencimento = b.DueDate.ToString("dd/MM/yyyy"),
                    valor = b.NominalValue,
                    status = b.Status,
                    foiPago = b.FoiPago
                }).ToList();

                info["boletosInativos"] = boletosInativos.Select(b => new
                {
                    id = b.Id,
                    parcela = b.NumeroParcela,
                    vencimento = b.DueDate.ToString("dd/MM/yyyy"),
                    valor = b.NominalValue,
                    status = b.Status,
                    foiPago = b.FoiPago
                }).ToList();

                motivos.Add($"📊 Total de boletos: {boletosContrato.Count} ({boletosAtivos.Count} ativos, {boletosInativos.Count} inativos)");

                // ============================================
                // VERIFICAÇÃO 6: Boletos vencidos não pagos
                // ============================================
                var boletosVencidosNaoPagos = boletosAtivos
                    .Where(b => b.DueDate.Date < hoje.Date && 
                               !b.FoiPago && 
                               (b.Status == "ATIVO" || b.Status == "REGISTRADO" || b.Status == "VENCIDO"))
                    .ToList();

                if (boletosVencidosNaoPagos.Count >= 2)
                {
                    motivos.Add($"⚠️ {boletosVencidosNaoPagos.Count} boletos VENCIDOS não pagos → Contrato seria SUSPENSO automaticamente!");
                    info["boletosVencidosNaoPagos"] = boletosVencidosNaoPagos.Select(b => new
                    {
                        id = b.Id,
                        vencimento = b.DueDate.ToString("dd/MM/yyyy"),
                        diasVencido = (hoje - b.DueDate.Date).Days
                    }).ToList();
                }
                else if (boletosVencidosNaoPagos.Count == 1)
                {
                    motivos.Add($"⚠️ 1 boleto vencido não pago (limite para suspensão é 2)");
                }

                // ============================================
                // VERIFICAÇÃO 7: Boletos BAIXADOS não pagos
                // ============================================
                var boletosBaixadosNaoPagos = boletosAtivos
                    .Where(b => b.Status == "BAIXADO" && !b.FoiPago)
                    .ToList();

                if (boletosBaixadosNaoPagos.Count >= 2)
                {
                    motivos.Add($"⚠️ {boletosBaixadosNaoPagos.Count} boletos BAIXADOS não pagos → Contrato seria SUSPENSO automaticamente!");
                }
                else if (boletosBaixadosNaoPagos.Count == 1)
                {
                    motivos.Add($"⚠️ 1 boleto baixado não pago (limite para suspensão é 2)");
                }

                // ============================================
                // VERIFICAÇÃO 8: Cálculo da próxima parcela
                // ============================================
                var primeiroVencimento = contrato.PrimeiroVencimento.Value;
                var totalParcelas = contrato.NumeroParcelas ?? 0;
                var isContratoCorrente = totalParcelas == 0;

                info["tipoContrato"] = isContratoCorrente ? "Corrente (Indeterminado)" : $"{totalParcelas} parcelas";

                int proximaParcela;
                DateTime dataVencimento;

                // Filtrar apenas boletos COM número de parcela (ignorar avulsos/renegociações)
                // IMPORTANTE: Ignora BAIXADOS NÃO PAGOS - podem ser regenerados
                // IMPORTANTE: INCLUI BAIXADOS PAGOS (ex: PIX) - contam como parcelas cobertas
                var ultimoBoletoAtivo = boletosAtivos
                    .Where(b => b.NumeroParcela.HasValue && // Ignora boletos avulsos (parcela NULL)
                               !(b.Status == "BAIXADO" && !b.FoiPago)) // Ignora BAIXADOS não pagos
                    .OrderByDescending(b => b.NumeroParcela)
                    .FirstOrDefault();

                // Contabilizar boletos avulsos para informação
                var boletosAvulsos = boletosAtivos.Where(b => !b.NumeroParcela.HasValue).ToList();
                
                // Contabilizar boletos BAIXADOS não pagos (podem ser regenerados)
                var boletosBaixadosNaoPagosIgnorados = boletosAtivos
                    .Where(b => b.Status == "BAIXADO" && !b.FoiPago && b.NumeroParcela.HasValue)
                    .ToList();
                if (boletosBaixadosNaoPagosIgnorados.Any())
                {
                    motivos.Add($"⚠️ {boletosBaixadosNaoPagosIgnorados.Count} boleto(s) BAIXADO(s) não pago(s) ignorados (podem ser renegociados)");
                }
                if (boletosAvulsos.Any())
                {
                    motivos.Add($"📝 {boletosAvulsos.Count} boleto(s) avulso(s)/renegociação (sem número de parcela)");
                }

                if (ultimoBoletoAtivo != null)
                {
                    var ultimaParcelaGerada = ultimoBoletoAtivo.NumeroParcela!.Value;
                    proximaParcela = ultimaParcelaGerada + 1;

                    var ultimoVencimento = ultimoBoletoAtivo.DueDate;
                    var proximoMesCalc = ultimoVencimento.AddMonths(1);
                    var diaVenc = primeiroVencimento.Day;
                    var ultimoDiaMesCalc = DateTime.DaysInMonth(proximoMesCalc.Year, proximoMesCalc.Month);
                    if (diaVenc > ultimoDiaMesCalc) diaVenc = ultimoDiaMesCalc;
                    dataVencimento = new DateTime(proximoMesCalc.Year, proximoMesCalc.Month, diaVenc);

                    info["ultimoBoletoAtivo"] = new
                    {
                        id = ultimoBoletoAtivo.Id,
                        parcela = ultimaParcelaGerada,
                        vencimento = ultimoVencimento.ToString("dd/MM/yyyy")
                    };
                    motivos.Add($"📝 Último boleto ativo: #{ultimoBoletoAtivo.Id} (parcela {ultimaParcelaGerada}, venc {ultimoVencimento:dd/MM/yyyy})");
                }
                else if (primeiroVencimento.Date >= hoje.Date)
                {
                    proximaParcela = 1;
                    dataVencimento = primeiroVencimento;
                    motivos.Add("📝 Contrato novo - primeiro boleto a gerar");
                }
                else
                {
                    var diaVencimento = primeiroVencimento.Day;
                    var ultimoDiaMesAtual = DateTime.DaysInMonth(hoje.Year, hoje.Month);
                    if (diaVencimento > ultimoDiaMesAtual) diaVencimento = ultimoDiaMesAtual;

                    var vencimentoMesAtual = new DateTime(hoje.Year, hoje.Month, diaVencimento);

                    if (vencimentoMesAtual.Date >= hoje.Date)
                    {
                        dataVencimento = vencimentoMesAtual;
                    }
                    else
                    {
                        var proximoMes = hoje.AddMonths(1);
                        var ultimoDiaProximoMes = DateTime.DaysInMonth(proximoMes.Year, proximoMes.Month);
                        diaVencimento = primeiroVencimento.Day;
                        if (diaVencimento > ultimoDiaProximoMes) diaVencimento = ultimoDiaProximoMes;
                        dataVencimento = new DateTime(proximoMes.Year, proximoMes.Month, diaVencimento);
                    }

                    var mesesDesdeInicio = ((dataVencimento.Year - primeiroVencimento.Year) * 12)
                                         + (dataVencimento.Month - primeiroVencimento.Month);
                    proximaParcela = mesesDesdeInicio + 1;
                    if (proximaParcela < 1) proximaParcela = 1;

                    motivos.Add($"📝 Contrato sem boletos - calculando parcela {proximaParcela}");
                }

                info["proximaParcelaCalculada"] = proximaParcela;
                info["dataVencimentoCalculada"] = dataVencimento.ToString("dd/MM/yyyy");

                // ============================================
                // VERIFICAÇÃO 9: Parcelas finalizadas
                // ============================================
                if (!isContratoCorrente && proximaParcela > totalParcelas)
                {
                    motivos.Add($"❌ Todas as {totalParcelas} parcelas já finalizadas");
                    info["podeGerar"] = false;
                    info["motivos"] = motivos;
                    return Ok(info);
                }

                // ============================================
                // VERIFICAÇÃO 10: Janela de vencimento (CRÍTICA!)
                // ============================================
                var diasAteVencimento = (dataVencimento - hoje).Days;
                info["diasAteVencimento"] = diasAteVencimento;

                if (diasAteVencimento <= 0)
                {
                    motivos.Add($"❌ Data de vencimento já passou! ({dataVencimento:dd/MM/yyyy} - há {Math.Abs(diasAteVencimento)} dias)");
                }
                else if (diasAteVencimento > 7)
                {
                    motivos.Add($"❌ FORA DA JANELA DE 7 DIAS! Faltam {diasAteVencimento} dias para {dataVencimento:dd/MM/yyyy}");
                    motivos.Add($"💡 O boleto só aparecerá para geração quando faltar 7 dias ou menos para o vencimento");
                    
                    var dataInicioJanela = dataVencimento.AddDays(-7);
                    info["dataInicioJanela"] = dataInicioJanela.ToString("dd/MM/yyyy");
                    motivos.Add($"📅 Aguarde até {dataInicioJanela:dd/MM/yyyy} para gerar este boleto");
                }
                else
                {
                    motivos.Add($"✅ Dentro da janela de geração ({diasAteVencimento} dias até {dataVencimento:dd/MM/yyyy})");

                    // ============================================
                    // VERIFICAÇÃO 11: Boleto já existe para esta parcela
                    // IMPORTANTE: Ignora boletos AVULSOS (NumeroParcela = NULL) - são renegociações
                    // IMPORTANTE: Ignora BAIXADOS NÃO PAGOS - podem ser renegociados
                    // IMPORTANTE: INCLUI BAIXADOS PAGOS (ex: PIX) - parcela já coberta!
                    // ============================================
                    var boletosComParcela = boletosAtivos
                        .Where(b => b.NumeroParcela.HasValue && 
                                   !(b.Status == "BAIXADO" && !b.FoiPago)) // Ignora BAIXADOS não pagos
                        .ToList();
                    var boletoExistenteParcela = boletosComParcela.Any(b => b.NumeroParcela == proximaParcela);
                    var boletoExistenteData = boletosComParcela.Any(b => b.DueDate.Date == dataVencimento.Date);
                    var boletoExistenteMesAno = boletosComParcela.Any(b => 
                        b.DueDate.Month == dataVencimento.Month && 
                        b.DueDate.Year == dataVencimento.Year);

                    if (boletoExistenteParcela)
                    {
                        var boletoEncontrado = boletosComParcela.First(b => b.NumeroParcela == proximaParcela);
                        var statusDisplay = boletoEncontrado.FoiPago ? "PAGO" : boletoEncontrado.Status;
                        motivos.Add($"❌ Já existe boleto {statusDisplay} para a parcela {proximaParcela}");
                    }
                    else if (boletoExistenteData)
                    {
                        var boletoEncontrado = boletosComParcela.First(b => b.DueDate.Date == dataVencimento.Date);
                        var statusDisplay = boletoEncontrado.FoiPago ? "PAGO" : boletoEncontrado.Status;
                        motivos.Add($"❌ Já existe boleto {statusDisplay} com vencimento {dataVencimento:dd/MM/yyyy}");
                    }
                    else if (boletoExistenteMesAno)
                    {
                        var boletoEncontrado = boletosComParcela.First(b => b.DueDate.Month == dataVencimento.Month && b.DueDate.Year == dataVencimento.Year);
                        var statusDisplay = boletoEncontrado.FoiPago ? "PAGO" : boletoEncontrado.Status;
                        motivos.Add($"❌ Já existe boleto {statusDisplay} para {dataVencimento:MM/yyyy}");
                    }
                    else
                    {
                        motivos.Add("✅ ELEGÍVEL PARA GERAÇÃO DE BOLETO!");
                    }
                }

                var podeGerar = motivos.Any(m => m.Contains("ELEGÍVEL"));
                info["podeGerar"] = podeGerar;
                info["motivos"] = motivos;

                // Resumo final
                if (!podeGerar)
                {
                    var motivosNegados = motivos.Where(m => m.StartsWith("❌")).ToList();
                    info["resumo"] = $"Contrato não aparece na geração em lote devido a: {string.Join("; ", motivosNegados)}";
                }
                else
                {
                    info["resumo"] = "Contrato está elegível para geração de boleto!";
                }

                return Ok(info);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro no diagnóstico do contrato #{contratoId}");
                return StatusCode(500, new { erro = "Erro no diagnóstico", detalhes = ex.Message });
            }
        }

        /// <summary>
        /// Executa a geração em lote de boletos
        /// </summary>
        [HttpPost("gerar-lote")]
        public async Task<ActionResult<ResultadoGeracaoLoteDTO>> PostGerarLote()
        {
            var inicio = DateTime.Now;
            var boletosGerados = new List<BoletoGeradoDTO>();
            var erros = new List<ErroGeracaoDTO>();

            try
            {
                _logger.LogInformation("🚀 Iniciando geração em lote de boletos");

                // Obter usuário logado
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    return Unauthorized("Usuário não identificado na requisição.");
                }

                var hoje = DateTime.Today;
                var limiteVencimento = hoje.AddDays(7);

                // Buscar contratos ativos com dados de pagamento
                var contratos = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                            .ThenInclude(pf => pf.Endereco)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                            .ThenInclude(pj => pj.Endereco)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.Filial)
                    .Where(c => c.Ativo &&
                                c.Situacao != null &&
                                c.Situacao.ToLower() == "cliente" &&
                                c.PrimeiroVencimento != null &&
                                c.ValorParcela != null &&
                                c.ValorParcela > 0)
                    .ToListAsync();

                _logger.LogInformation($"📊 Processando {contratos.Count} contratos ativos");

                foreach (var contrato in contratos)
                {
                    try
                    {
                        var parcelaInfo = await CalcularProximaParcelaAsync(contrato, hoje, limiteVencimento);

                        if (parcelaInfo == null)
                        {
                            continue; // Não está na janela de geração ou já existe boleto
                        }

                        _logger.LogInformation($"📝 Gerando boleto para contrato #{contrato.Id} - Parcela {parcelaInfo.NumeroParcela}/{parcelaInfo.TotalParcelas}");

                        // Gerar NSU Code único
                        var nsuCode = await _santanderService.GerarProximoNsuCodeAsync();
                        var nsuDate = DateTime.Today;

                        // Criar DTO para geração
                        var createDto = new CreateBoletoDTO
                        {
                            ContratoId = contrato.Id,
                            DueDate = parcelaInfo.DataVencimento,
                            NominalValue = parcelaInfo.Valor
                        };

                        // Criar boleto
                        var boleto = await CriarBoletoFromDTO(createDto, contrato, nsuCode, nsuDate);
                        boleto.NumeroParcela = parcelaInfo.NumeroParcela;

                        // Verificar se é PIX ou Boleto
                        if (contrato.MetodoPagamento == "Pix")
                        {
                            // PIX: Não chamar Santander, apenas criar registro para controle
                            boleto.TipoPagamento = "Pix";
                            boleto.Status = "PENDENTE";
                            boleto.BarCode = null;
                            boleto.DigitableLine = null;
                            
                            _logger.LogInformation($"✅ Parcela PIX criada para contrato #{contrato.Id} (sem registro Santander)");
                        }
                        else
                        {
                            // BOLETO: Registrar na API Santander (fluxo normal)
                            boleto.TipoPagamento = "Boleto";
                            
                            try
                            {
                                var santanderResponse = await _santanderService.RegistrarBoletoAsync(boleto);
                                AtualizarBoletoComResposta(boleto, santanderResponse);
                                boleto.Status = "REGISTRADO";

                                _logger.LogInformation($"✅ Boleto registrado no Santander para contrato #{contrato.Id}");
                            }
                            catch (Exception apiEx)
                            {
                                _logger.LogError(apiEx, $"❌ Erro na API Santander para contrato #{contrato.Id}");
                                boleto.Status = "ERRO";
                                boleto.ErrorMessage = apiEx.Message;
                                boleto.ErrorCode = "API_ERROR";

                                erros.Add(new ErroGeracaoDTO
                                {
                                    ContratoId = contrato.Id,
                                    ClienteNome = parcelaInfo.ClienteNome,
                                    Erro = $"Erro API Santander: {apiEx.Message}"
                                });

                                // Salvar boleto com erro no banco para rastreamento
                                _context.Boletos.Add(boleto);
                                await _context.SaveChangesAsync();

                                continue;
                            }
                        }

                        // Salvar boleto no banco
                        _context.Boletos.Add(boleto);
                        await _context.SaveChangesAsync();

                        _logger.LogInformation($"✅ Boleto ID {boleto.Id} salvo para contrato #{contrato.Id}");

                        // Enviar email automaticamente
                        string? emailStatus = null;
                        string? emailDestino = null;
                        var enviarAutomaticamente = _configuration.GetValue<bool>("Email:EnviarBoletoAutomaticamente", true);

                        if (enviarAutomaticamente && boleto.Status == "REGISTRADO")
                        {
                            emailDestino = contrato.Cliente?.PessoaFisica?.EmailEmpresarial
                                        ?? contrato.Cliente?.PessoaJuridica?.Email;

                            if (!string.IsNullOrWhiteSpace(emailDestino))
                            {
                                try
                                {
                                    var resultadoEmail = await EnviarBoletoEmailInternoAsync(boleto, emailDestino);
                                    if (resultadoEmail.Sucesso)
                                    {
                                        emailStatus = "ENVIADO";
                                        _logger.LogInformation($"📧 Email enviado para: {emailDestino}");
                                    }
                                    else
                                    {
                                        emailStatus = $"FALHOU: {resultadoEmail.Erro}";
                                        _logger.LogWarning($"⚠️ Falha ao enviar email: {resultadoEmail.Erro}");
                                    }
                                }
                                catch (Exception emailEx)
                                {
                                    emailStatus = $"ERRO: {emailEx.Message}";
                                    _logger.LogError(emailEx, $"❌ Erro ao enviar email para boleto {boleto.Id}");
                                }
                            }
                            else
                            {
                                emailStatus = "SEM_EMAIL";
                                _logger.LogWarning($"⚠️ Contrato #{contrato.Id} não possui email cadastrado");
                            }
                        }

                        boletosGerados.Add(new BoletoGeradoDTO
                        {
                            BoletoId = boleto.Id,
                            ContratoId = contrato.Id,
                            ClienteNome = parcelaInfo.ClienteNome,
                            NumeroParcela = parcelaInfo.NumeroParcela,
                            TotalParcelas = parcelaInfo.TotalParcelas,
                            DataVencimento = parcelaInfo.DataVencimento,
                            Valor = parcelaInfo.Valor,
                            NsuCode = boleto.NsuCode,
                            Status = boleto.Status,
                            EmailStatus = emailStatus,
                            EmailDestino = emailDestino
                        });

                        // Verificar se é a última parcela e todas estão pagas
                        await VerificarQuitacaoContratoAsync(contrato);
                    }
                    catch (Exception contratoEx)
                    {
                        var clienteNome = contrato.Cliente?.PessoaFisica?.Nome ??
                                         contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";

                        _logger.LogError(contratoEx, $"❌ Erro ao processar contrato #{contrato.Id}");

                        erros.Add(new ErroGeracaoDTO
                        {
                            ContratoId = contrato.Id,
                            ClienteNome = clienteNome,
                            Erro = contratoEx.Message
                        });
                    }
                }

                var fim = DateTime.Now;
                var duracao = (int)(fim - inicio).TotalSeconds;

                // Determinar status geral
                string statusGeral;
                if (erros.Count == 0 && boletosGerados.Count > 0)
                    statusGeral = "SUCESSO";
                else if (erros.Count > 0 && boletosGerados.Count > 0)
                    statusGeral = "PARCIAL";
                else if (boletosGerados.Count == 0 && erros.Count == 0)
                    statusGeral = "NENHUM"; // Nada para gerar
                else
                    statusGeral = "ERRO";

                // Salvar log de execução
                var log = new LogGeracaoBoleto
                {
                    DataExecucao = inicio,
                    UsuarioId = usuarioId,
                    TotalContratosProcessados = contratos.Count,
                    TotalBoletosGerados = boletosGerados.Count,
                    TotalErros = erros.Count,
                    ValorTotalGerado = boletosGerados.Sum(b => b.Valor),
                    DuracaoSegundos = duracao,
                    Status = statusGeral,
                    DataFinalizacao = fim,
                    Detalhes = JsonSerializer.Serialize(new
                    {
                        BoletosGerados = boletosGerados,
                        Erros = erros
                    })
                };

                _context.LogsGeracaoBoletos.Add(log);
                await _context.SaveChangesAsync();

                // Calcular resumo de emails
                var emailsEnviados = boletosGerados.Count(b => b.EmailStatus == "ENVIADO");
                var emailsFalharam = boletosGerados.Count(b => b.EmailStatus != null && b.EmailStatus.StartsWith("FALHOU"));
                var semEmail = boletosGerados.Count(b => b.EmailStatus == "SEM_EMAIL");
                var clientesSemEmail = boletosGerados
                    .Where(b => b.EmailStatus == "SEM_EMAIL")
                    .Select(b => b.ClienteNome)
                    .Distinct()
                    .ToList();

                var resultado = new ResultadoGeracaoLoteDTO
                {
                    Iniciado = inicio,
                    Finalizado = fim,
                    DuracaoSegundos = duracao,
                    TotalProcessados = contratos.Count,
                    TotalSucesso = boletosGerados.Count,
                    TotalErros = erros.Count,
                    ValorTotalGerado = boletosGerados.Sum(b => b.Valor),
                    Status = statusGeral,
                    BoletosGerados = boletosGerados,
                    Erros = erros,
                    LogId = log.Id,
                    ResumoEmail = new ResumoEnvioEmailDTO
                    {
                        TotalEnviados = emailsEnviados,
                        TotalFalharam = emailsFalharam,
                        TotalSemEmail = semEmail,
                        ClientesSemEmail = clientesSemEmail
                    }
                };

                _logger.LogInformation($"✅ Geração em lote concluída. Status: {statusGeral}, Gerados: {boletosGerados.Count}, Erros: {erros.Count}");
                _logger.LogInformation($"📧 Emails: Enviados={emailsEnviados}, Falharam={emailsFalharam}, SemEmail={semEmail}");

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro crítico na geração em lote");
                return StatusCode(500, new { erro = "Erro na geração em lote", detalhes = ex.Message });
            }
        }

        /// <summary>
        /// Lista histórico de logs de geração em lote
        /// </summary>
        [HttpGet("logs-geracao")]
        public async Task<ActionResult<IEnumerable<LogGeracaoListDTO>>> GetLogsGeracao(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = 20)
        {
            try
            {
                var logs = await _context.LogsGeracaoBoletos
                    .Include(l => l.Usuario)
                    .OrderByDescending(l => l.DataExecucao)
                    .Skip((pagina - 1) * tamanhoPagina)
                    .Take(tamanhoPagina)
                    .Select(l => new LogGeracaoListDTO
                    {
                        Id = l.Id,
                        DataExecucao = l.DataExecucao,
                        UsuarioNome = l.Usuario.Login,
                        TotalContratosProcessados = l.TotalContratosProcessados,
                        TotalBoletosGerados = l.TotalBoletosGerados,
                        TotalErros = l.TotalErros,
                        ValorTotalGerado = l.ValorTotalGerado,
                        DuracaoSegundos = l.DuracaoSegundos,
                        Status = l.Status
                    })
                    .ToListAsync();

                var total = await _context.LogsGeracaoBoletos.CountAsync();

                return Ok(new
                {
                    Dados = logs,
                    Pagina = pagina,
                    TamanhoPagina = tamanhoPagina,
                    TotalRegistros = total,
                    TotalPaginas = (int)Math.Ceiling((double)total / tamanhoPagina)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao buscar logs de geração");
                return StatusCode(500, new { erro = "Erro ao buscar logs", detalhes = ex.Message });
            }
        }

        /// <summary>
        /// Busca detalhes de um log de geração específico
        /// </summary>
        [HttpGet("logs-geracao/{id}")]
        public async Task<ActionResult<LogGeracaoBoleto>> GetLogGeracao(int id)
        {
            try
            {
                var log = await _context.LogsGeracaoBoletos
                    .Include(l => l.Usuario)
                    .FirstOrDefaultAsync(l => l.Id == id);

                if (log == null)
                {
                    return NotFound($"Log de geração com ID {id} não encontrado");
                }

                return Ok(new
                {
                    log.Id,
                    log.DataExecucao,
                    UsuarioNome = log.Usuario?.Login ?? "N/A",
                    log.TotalContratosProcessados,
                    log.TotalBoletosGerados,
                    log.TotalErros,
                    log.ValorTotalGerado,
                    log.DuracaoSegundos,
                    log.Status,
                    log.DataFinalizacao,
                    Detalhes = !string.IsNullOrEmpty(log.Detalhes)
                        ? JsonSerializer.Deserialize<object>(log.Detalhes)
                        : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao buscar log de geração ID: {Id}", id);
                return StatusCode(500, new { erro = "Erro ao buscar log", detalhes = ex.Message });
            }
        }

        /// <summary>
        /// Calcula qual é a próxima parcela a ser gerada para um contrato
        /// </summary>
        private async Task<ContratoParaGerarDTO?> CalcularProximaParcelaAsync(
            Contrato contrato, DateTime hoje, DateTime limiteVencimento)
        {
            if (contrato.PrimeiroVencimento == null || contrato.ValorParcela == null)
            {
                return null;
            }

            var primeiroVencimento = contrato.PrimeiroVencimento.Value;
            var totalParcelas = contrato.NumeroParcelas ?? 0; // 0 = contrato corrente (sem fim)
            var valorParcela = contrato.ValorParcela.Value;
            var isContratoCorrente = totalParcelas == 0; // Contrato corrente: cobrança mensal sem fim

            int proximaParcela;
            DateTime dataVencimento;

            // ========================================================================
            // VERIFICAR BOLETOS BAIXADOS (EXPIRADOS) NÃO PAGOS
            // Se tiver 2+ boletos BAIXADOS não pagos → SUSPENDER AUTOMATICAMENTE
            // Se tiver BAIXADOS mas contrato foi REATIVADO (Cliente) → REGENERAR
            // ========================================================================
            var listaBoletosBaixadosNaoPagos = await _context.Boletos
                .Where(b => b.ContratoId == contrato.Id &&
                           b.Ativo &&
                           b.Status == "BAIXADO" &&
                           !b.FoiPago &&
                           b.NumeroParcela.HasValue) // Ignora boletos avulsos/renegociados
                .OrderBy(b => b.NumeroParcela)
                .ThenBy(b => b.DueDate)
                .ToListAsync();

            // Contar por MESES ÚNICOS em atraso (não por quantidade de boletos)
            // Ex: 3 boletos de Dezembro = 1 mês, mas 1 de Novembro + 1 de Dezembro = 2 meses
            var mesesBaixadosEmAtraso = listaBoletosBaixadosNaoPagos
                .Select(b => new { b.DueDate.Year, b.DueDate.Month })
                .Distinct()
                .Count();

            // Se tem 2+ MESES DIFERENTES em atraso e contrato NÃO está suspenso → SUSPENDER
            if (mesesBaixadosEmAtraso >= 2 && 
                contrato.Situacao?.ToLower() != "suspenso com débito")
            {
                _logger.LogWarning($"⚠️ Contrato #{contrato.Id}: {mesesBaixadosEmAtraso} MESES em atraso ({listaBoletosBaixadosNaoPagos.Count} boletos BAIXADOS). Suspendendo contrato automaticamente.");
                
                contrato.Situacao = "Suspenso com Débito";
                contrato.DataAtualizacao = DateTime.Now;
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"🚫 Contrato #{contrato.Id} alterado para 'Suspenso com Débito' - Boletos baixados: {string.Join(", ", listaBoletosBaixadosNaoPagos.Select(b => $"#{b.Id} (parcela {b.NumeroParcela}, {b.DueDate:dd/MM/yyyy})"))}");
                
                return null; // Não gerar novo boleto
            }

            // Se tem MESES em atraso e contrato ESTÁ suspenso → não fazer nada (aguardar reativação)
            if (mesesBaixadosEmAtraso > 0 && 
                contrato.Situacao?.ToLower() == "suspenso com débito")
            {
                _logger.LogDebug($"Contrato #{contrato.Id}: Aguardando reativação manual para regenerar boletos BAIXADOS.");
                return null;
            }

            // Se tem BAIXADOS não pagos e contrato é "Cliente":
            // - 1 MÊS em atraso: pode gerar próxima parcela normalmente (tolerância)
            // - 2+ MESES em atraso: contrato voltou de suspenso, geração manual necessária
            if (mesesBaixadosEmAtraso > 0 && 
                contrato.Situacao?.ToLower() == "cliente")
            {
                if (mesesBaixadosEmAtraso == 1)
                {
                    // 1 mês em atraso: pode gerar próxima parcela normalmente
                    _logger.LogInformation($"📝 Contrato #{contrato.Id}: 1 MÊS em atraso ({listaBoletosBaixadosNaoPagos.Count} boletos BAIXADOS). Tolerância - continuando com geração normal.");
                    // Continua o fluxo normal - não bloqueia
                }
                else
                {
                    // 2+ meses em atraso: contrato voltou de suspenso, geração manual necessária
                    _logger.LogInformation($"⚠️ Contrato #{contrato.Id}: {mesesBaixadosEmAtraso} MESES em atraso. Contrato reativado - geração manual necessária para regularizar.");
                    // Não gerar automaticamente - precisa regularizar manualmente
                    return null;
                }
            }

            // ========================================================================
            // VERIFICAR BOLETOS VENCIDOS NÃO PAGOS (ATIVO/REGISTRADO/VENCIDO)
            // Se tiver 2+ MESES DIFERENTES vencidos não pagos → SUSPENDER AUTOMATICAMENTE
            // Isso acontece ANTES de virarem BAIXADOS (30 dias após vencimento)
            // ========================================================================
            var boletosVencidosNaoPagos = await _context.Boletos
                .Where(b => b.ContratoId == contrato.Id &&
                           b.Ativo &&
                           b.DueDate.Date < hoje.Date &&
                           !b.FoiPago &&
                           b.NumeroParcela.HasValue && // Ignora boletos avulsos/renegociados
                           (b.Status == "ATIVO" || b.Status == "REGISTRADO" || b.Status == "VENCIDO"))
                .OrderBy(b => b.DueDate)
                .ToListAsync();

            // Contar por MESES ÚNICOS em atraso
            var mesesVencidosEmAtraso = boletosVencidosNaoPagos
                .Select(b => new { b.DueDate.Year, b.DueDate.Month })
                .Distinct()
                .Count();

            if (mesesVencidosEmAtraso >= 2)
            {
                _logger.LogWarning($"⚠️ Contrato #{contrato.Id}: {mesesVencidosEmAtraso} MESES vencidos em atraso ({boletosVencidosNaoPagos.Count} boletos).");
                
                // SUSPENDER AUTOMATICAMENTE se ainda não estiver suspenso
                if (contrato.Situacao?.ToLower() != "suspenso com débito")
                {
                    contrato.Situacao = "Suspenso com Débito";
                    contrato.DataAtualizacao = DateTime.Now;
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"🚫 Contrato #{contrato.Id} alterado para 'Suspenso com Débito' - Boletos vencidos: {string.Join(", ", boletosVencidosNaoPagos.Select(b => $"#{b.Id} ({b.DueDate:dd/MM/yyyy})"))}");
                }
                
                return null; // Não gerar novo boleto
            }

            // ========================================================================
            // VERIFICAR PARCELA DE REFERÊNCIA JÁ COBERTA NO CONTRATO
            // Considera:
            // - NumeroParcela dos boletos válidos
            // - ParcelasCobertas (JSON) de renegociação/antecipação múltiplas
            // Ignora BAIXADOS NÃO PAGOS com parcela (podem ser renegociados manualmente)
            // ========================================================================
            var boletosReferencia = await _context.Boletos
                .Where(b => b.ContratoId == contrato.Id &&
                           b.Ativo &&
                           b.Status != "ERRO" &&
                           b.Status != "CANCELADO" &&
                           !(b.Status == "BAIXADO" && !b.FoiPago && b.NumeroParcela.HasValue))
                .Select(b => new { b.NumeroParcela, b.ParcelasCobertas })
                .ToListAsync();

            var maiorParcelaComNumero = boletosReferencia
                .Where(b => b.NumeroParcela.HasValue)
                .Select(b => b.NumeroParcela!.Value)
                .DefaultIfEmpty(0)
                .Max();

            var maiorParcelaCoberta = boletosReferencia
                .Select(b => ExtrairMaiorParcelaCoberta(b.ParcelasCobertas) ?? 0)
                .DefaultIfEmpty(0)
                .Max();

            var maiorParcelaReferencia = Math.Max(maiorParcelaComNumero, maiorParcelaCoberta);

            if (maiorParcelaReferencia > 0)
            {
                // Ex.: renegociação cobrindo parcelas [1,2,3] => próxima deve ser 4
                proximaParcela = maiorParcelaReferencia + 1;
                dataVencimento = CalcularDataVencimentoPorParcela(primeiroVencimento, proximaParcela);

                _logger.LogDebug($"Contrato #{contrato.Id}: Maior referência de parcela = {maiorParcelaReferencia} (NumeroParcela={maiorParcelaComNumero}, ParcelasCobertas={maiorParcelaCoberta}). Próxima: parcela {proximaParcela}, venc {dataVencimento:dd/MM/yyyy}");
            }
            // CASO 1: Primeiro vencimento ainda não passou (contrato novo SEM boletos)
            else if (primeiroVencimento.Date >= hoje.Date)
            {
                proximaParcela = 1;
                dataVencimento = primeiroVencimento;
                _logger.LogDebug($"Contrato #{contrato.Id}: Contrato novo, primeiro vencimento em {primeiroVencimento:dd/MM/yyyy}");
            }
            // CASO 2: Primeiro vencimento já passou (contrato importado SEM boletos)
            else
            {
                // Calcular a data de vencimento do mês atual
                var diaVencimento = primeiroVencimento.Day;
                var ultimoDiaMesAtual = DateTime.DaysInMonth(hoje.Year, hoje.Month);

                // Ajustar se o dia não existe no mês atual
                if (diaVencimento > ultimoDiaMesAtual)
                {
                    diaVencimento = ultimoDiaMesAtual;
                }

                var vencimentoMesAtual = new DateTime(hoje.Year, hoje.Month, diaVencimento);

                // Se o vencimento deste mês ainda não passou, usar ele
                if (vencimentoMesAtual.Date >= hoje.Date)
                {
                    dataVencimento = vencimentoMesAtual;
                }
                else
                {
                    // Se já passou, usar o próximo mês
                    var proximoMes = hoje.AddMonths(1);
                    var ultimoDiaProximoMes = DateTime.DaysInMonth(proximoMes.Year, proximoMes.Month);
                    diaVencimento = primeiroVencimento.Day;
                    if (diaVencimento > ultimoDiaProximoMes)
                    {
                        diaVencimento = ultimoDiaProximoMes;
                    }
                    dataVencimento = new DateTime(proximoMes.Year, proximoMes.Month, diaVencimento);
                }

                // Calcular qual parcela seria esta baseado na diferença de meses
                var mesesDesdeInicio = ((dataVencimento.Year - primeiroVencimento.Year) * 12)
                                     + (dataVencimento.Month - primeiroVencimento.Month);
                proximaParcela = mesesDesdeInicio + 1;

                // Garantir que a parcela seja pelo menos 1
                if (proximaParcela < 1)
                {
                    proximaParcela = 1;
                }

                _logger.LogDebug($"Contrato #{contrato.Id}: Vencimento calculado {dataVencimento:dd/MM/yyyy}, Parcela {proximaParcela}");
            }

            // Verificar se ainda tem parcelas disponíveis (apenas para contratos com parcelas definidas)
            if (!isContratoCorrente && proximaParcela > totalParcelas)
            {
                _logger.LogInformation($"Contrato #{contrato.Id}: Parcela calculada ({proximaParcela}) excede total de parcelas ({totalParcelas}).");

                // ========================================================================
                // CORREÇÃO: Só marcar como quitado se TODAS as parcelas foram PAGAS
                // Não basta o tempo ter passado - precisam estar liquidadas!
                // ========================================================================
                var boletosLiquidados = await _context.Boletos
                    .CountAsync(b => b.ContratoId == contrato.Id &&
                                    (b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)) &&
                                    b.Ativo);

                if (boletosLiquidados >= totalParcelas)
                {
                    _logger.LogInformation($"✅ Contrato #{contrato.Id}: {boletosLiquidados}/{totalParcelas} parcelas LIQUIDADAS. Atualizando para QUITADO.");
                    
                    contrato.Situacao = "quitado";
                    contrato.DataAtualizacao = DateTime.Now;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    _logger.LogWarning($"⚠️ Contrato #{contrato.Id}: Apenas {boletosLiquidados}/{totalParcelas} parcelas liquidadas. NÃO marcando como quitado.");
                }

                return null;
            }

            // Ajustar se o dia não existe no mês (ex: 31 de fevereiro → último dia)
            var ultimoDiaMes = DateTime.DaysInMonth(dataVencimento.Year, dataVencimento.Month);
            if (primeiroVencimento.Day > ultimoDiaMes)
            {
                dataVencimento = new DateTime(dataVencimento.Year, dataVencimento.Month, ultimoDiaMes);
            }

            // Calcular dias até o vencimento
            var diasAteVencimento = (dataVencimento - hoje).Days;

            // ========================================================================
            // Se a parcela calculada já venceu E tem EXATAMENTE 1 mês com boleto BAIXADO NÃO PAGO,
            // avançar para a próxima parcela (o BAIXADO será renegociado manualmente)
            // IMPORTANTE: Se tiver 2+ MESES em atraso, já foi bloqueado anteriormente (suspensão)
            // ========================================================================
            if (diasAteVencimento <= 0 && mesesBaixadosEmAtraso == 1)
            {
                // Verificar se existe boleto BAIXADO NÃO PAGO para esta parcela específica
                var temBoletoBaixadoNaoPago = await _context.Boletos
                    .AnyAsync(b => b.ContratoId == contrato.Id &&
                                  b.NumeroParcela == proximaParcela &&
                                  b.Ativo &&
                                  b.Status == "BAIXADO" &&
                                  !b.FoiPago);

                if (temBoletoBaixadoNaoPago)
                {
                    // Avançar para a próxima parcela (somente porque tem 1 BAIXADO que será renegociado)
                    _logger.LogInformation($"Contrato #{contrato.Id}: Parcela {proximaParcela} tem boleto BAIXADO NÃO PAGO vencido (1 mês em atraso - tolerância). Avançando para parcela {proximaParcela + 1}.");
                    
                    proximaParcela++;
                    var proximoMes = dataVencimento.AddMonths(1);
                    var diaVenc = primeiroVencimento.Day;
                    var ultimoDiaProxMes = DateTime.DaysInMonth(proximoMes.Year, proximoMes.Month);
                    if (diaVenc > ultimoDiaProxMes) diaVenc = ultimoDiaProxMes;
                    dataVencimento = new DateTime(proximoMes.Year, proximoMes.Month, diaVenc);
                    diasAteVencimento = (dataVencimento - hoje).Days;

                    // Verificar se ainda tem parcelas disponíveis
                    if (!isContratoCorrente && proximaParcela > totalParcelas)
                    {
                        _logger.LogDebug($"Contrato #{contrato.Id}: Nova parcela {proximaParcela} excede total ({totalParcelas})");
                        return null;
                    }
                }
            }

            // Verificar se está na janela de 7 dias (> 0 e <= 7)
            if (diasAteVencimento <= 0 || diasAteVencimento > 7)
            {
                _logger.LogDebug($"Contrato #{contrato.Id}: Parcela {proximaParcela} fora da janela ({diasAteVencimento} dias)");
                return null;
            }

            // Verificar se já existe boleto ATIVO para esta parcela
            // IMPORTANTE: Ignora BAIXADOS NÃO PAGOS - podem ser regenerados via renegociação manual
            // IMPORTANTE: INCLUI boletos BAIXADOS que foram PAGOS (ex: PIX)
            // IMPORTANTE: Ignora boletos com dia de vencimento fora do dia original (são avulsos antigos mal cadastrados)
            var boletosParcelaExistente = await _context.Boletos
                .Where(b => b.ContratoId == contrato.Id &&
                           b.NumeroParcela == proximaParcela &&
                           b.Ativo &&
                           b.Status != "ERRO" &&
                           b.Status != "CANCELADO" &&
                           !(b.Status == "BAIXADO" && !b.FoiPago))
                .Select(b => new { b.Id, b.DueDate, b.NumeroParcela })
                .ToListAsync();

            // Filtrar apenas boletos onde o dia do vencimento corresponde ao dia original
            const int TOLERANCIA_DIAS_PARCELA = 5;
            var diaOriginal = contrato.PrimeiroVencimento?.Day ?? dataVencimento.Day;
            
            var boletoExistenteValido = boletosParcelaExistente.FirstOrDefault(b => {
                var diaBoleto = b.DueDate.Day;
                var diferencaDias = Math.Abs(diaOriginal - diaBoleto);
                
                // Considerar virada de mês (ex: dia 29 vs dia 2)
                var ultimoDiaMes = DateTime.DaysInMonth(b.DueDate.Year, b.DueDate.Month);
                if (diaOriginal > ultimoDiaMes)
                {
                    diferencaDias = Math.Abs(ultimoDiaMes - diaBoleto);
                }
                
                return diferencaDias <= TOLERANCIA_DIAS_PARCELA;
            });

            if (boletoExistenteValido != null)
            {
                _logger.LogDebug($"Contrato #{contrato.Id}: Boleto #{boletoExistenteValido.Id} da parcela {proximaParcela} já existe (dia {boletoExistenteValido.DueDate.Day} dentro da tolerância)");
                return null;
            }
            else if (boletosParcelaExistente.Any())
            {
                // Existe boleto com mesma parcela, mas dia diferente - é avulso mal cadastrado
                var boletoIgnorado = boletosParcelaExistente.First();
                _logger.LogInformation($"Contrato #{contrato.Id}: Boleto #{boletoIgnorado.Id} (parcela {proximaParcela}, dia {boletoIgnorado.DueDate.Day}) ignorado - dia fora da tolerância do original (dia {diaOriginal})");
            }

            // Também verificar por data de vencimento EXATA (para boletos sem NumeroParcela)
            // IMPORTANTE: Ignora BAIXADOS NÃO PAGOS - podem ser regenerados via renegociação manual
            // IMPORTANTE: INCLUI boletos BAIXADOS que foram PAGOS (ex: PIX)
            var boletoMesmoVencimento = await _context.Boletos
                .AnyAsync(b => b.ContratoId == contrato.Id &&
                              b.DueDate.Date == dataVencimento.Date &&
                              b.Ativo &&
                              b.Status != "ERRO" &&
                              b.Status != "CANCELADO" &&
                              !(b.Status == "BAIXADO" && !b.FoiPago)); // Ignora apenas BAIXADOS não pagos

            if (boletoMesmoVencimento)
            {
                _logger.LogDebug($"Contrato #{contrato.Id}: Boleto com vencimento {dataVencimento:dd/MM/yyyy} já existe (pode ser PAGO ou ATIVO)");
                return null;
            }

            // Verificar por mês/ano de vencimento (para boletos manuais que podem ter NumeroParcela null)
            // Isso evita gerar boleto duplicado se já existe um boleto ATIVO no mesmo mês
            // IMPORTANTE: Ignora boletos AVULSOS (NumeroParcela = NULL) - são renegociações
            // IMPORTANTE: Ignora boletos BAIXADOS NÃO PAGOS - serão regenerados manualmente
            // IMPORTANTE: INCLUI boletos BAIXADOS que foram PAGOS (ex: PIX)
            // IMPORTANTE: Ignora boletos onde o DIA do vencimento não corresponde ao dia original (são avulsos antigos)
            var boletosMesmoMesAno = await _context.Boletos
                .Where(b => b.ContratoId == contrato.Id &&
                           b.DueDate.Month == dataVencimento.Month &&
                           b.DueDate.Year == dataVencimento.Year &&
                           b.Ativo &&
                           b.Status != "ERRO" &&
                           b.Status != "CANCELADO" &&
                           b.NumeroParcela.HasValue && // Ignora boletos avulsos
                           !(b.Status == "BAIXADO" && !b.FoiPago)) // Ignora apenas BAIXADOS não pagos
                .Select(b => new { b.Id, b.DueDate, b.NumeroParcela, b.Status })
                .ToListAsync();

            // Filtrar boletos que realmente correspondem ao dia original do contrato
            // Boletos com dia diferente do esperado são tratados como "avulsos antigos"
            const int TOLERANCIA_DIAS_GERACAO = 5;
            // Reutiliza diaOriginal já declarado acima
            
            var boletoMesmoMesAnoValido = boletosMesmoMesAno.FirstOrDefault(b => {
                var diaBoleto = b.DueDate.Day;
                var diferencaDias = Math.Abs(diaOriginal - diaBoleto);
                
                // Considerar virada de mês (ex: dia 29 vs dia 2)
                var ultimoDiaMes = DateTime.DaysInMonth(b.DueDate.Year, b.DueDate.Month);
                if (diaOriginal > ultimoDiaMes)
                {
                    diferencaDias = Math.Abs(ultimoDiaMes - diaBoleto);
                }
                
                return diferencaDias <= TOLERANCIA_DIAS_GERACAO;
            });

            if (boletoMesmoMesAnoValido != null)
            {
                _logger.LogDebug($"Contrato #{contrato.Id}: Boleto #{boletoMesmoMesAnoValido.Id} para {dataVencimento:MM/yyyy} já existe (dia {boletoMesmoMesAnoValido.DueDate.Day} dentro da tolerância do dia {diaOriginal})");
                return null;
            }
            else if (boletosMesmoMesAno.Any())
            {
                // Existe boleto no mesmo mês, mas com dia diferente - é avulso/renegociação antiga
                var boletoIgnorado = boletosMesmoMesAno.First();
                _logger.LogInformation($"Contrato #{contrato.Id}: Boleto #{boletoIgnorado.Id} (venc. dia {boletoIgnorado.DueDate.Day}) ignorado - dia fora da tolerância do original (dia {diaOriginal}). Parcela {dataVencimento:MM/yyyy} será gerada normalmente.");
            }

            // Dados do cliente
            var clienteNome = contrato.Cliente?.PessoaFisica?.Nome ??
                             contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";

            var clienteDoc = contrato.Cliente?.PessoaFisica?.Cpf ??
                            contrato.Cliente?.PessoaJuridica?.Cnpj ?? "N/A";

            return new ContratoParaGerarDTO
            {
                ContratoId = contrato.Id,
                ClienteId = contrato.ClienteId,
                ClienteNome = clienteNome,
                ClienteDocumento = clienteDoc,
                NumeroPasta = contrato.NumeroPasta ?? "",
                NumeroParcela = proximaParcela,
                TotalParcelas = totalParcelas,
                ParcelaDescricao = isContratoCorrente ? $"{proximaParcela}/∞ (corrente)" : $"{proximaParcela}/{totalParcelas}",
                DataVencimento = dataVencimento,
                Valor = valorParcela,
                DiasAteVencimento = diasAteVencimento,
                FilialNome = contrato.Cliente?.Filial?.Nome
            };
        }

        /// <summary>
        /// Verifica se todas as parcelas do contrato foram pagas e atualiza status para "quitado"
        /// </summary>
        private async Task VerificarQuitacaoContratoAsync(Contrato contrato)
        {
            try
            {
                // Contratos correntes (sem número definido de parcelas) nunca são quitados automaticamente
                if (contrato.NumeroParcelas == null || contrato.NumeroParcelas == 0)
                    return;

                var totalParcelas = contrato.NumeroParcelas.Value;

                // Contar boletos LIQUIDADOS/PAGOS do contrato
                // Inclui LIQUIDADO (pagamento por boleto) e BAIXADO com FoiPago=true (pagamento por PIX)
                var boletosLiquidados = await _context.Boletos
                    .CountAsync(b => b.ContratoId == contrato.Id &&
                                    (b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)) &&
                                    b.Ativo);

                _logger.LogDebug($"Contrato #{contrato.Id}: {boletosLiquidados}/{totalParcelas} parcelas liquidadas");

                // Se todas as parcelas foram liquidadas, atualizar status do contrato E cliente para "quitado"
                if (boletosLiquidados >= totalParcelas)
                {
                    // Atualizar o CONTRATO para quitado
                    if (contrato.Situacao != "quitado")
                    {
                        contrato.Situacao = "quitado";
                        contrato.DataAtualizacao = DateTime.Now;
                        _logger.LogInformation($"🎉 Contrato #{contrato.Id} atualizado para status 'quitado' - {boletosLiquidados}/{totalParcelas} parcelas liquidadas!");
                    }

                    // Atualizar o CLIENTE para quitado
                    var cliente = await _context.Clientes.FindAsync(contrato.ClienteId);
                    if (cliente != null && cliente.Status != "quitado")
                    {
                        cliente.Status = "quitado";
                        cliente.DataAtualizacao = DateTime.Now;
                        _logger.LogInformation($"🎉 Cliente #{cliente.Id} atualizado para status 'quitado' - Contrato #{contrato.Id} quitado!");
                    }

                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao verificar quitação do contrato #{contrato.Id}");
                // Não propagar exceção para não afetar o fluxo principal
            }
        }

        /// <summary>
        /// Processa automaticamente renegociação quando um boleto avulso é pago.
        /// Calcula quantas parcelas o valor pago cobre e marca os boletos BAIXADOS correspondentes.
        /// </summary>
        /// <param name="boletoPago">O boleto de renegociação que foi pago</param>
        private async Task ProcessarRenegociacaoAutomaticaAsync(Boleto boletoPago)
        {
            try
            {
                // Só processa se:
                // 1. O boleto foi realmente pago
                // 2. O boleto é avulso/renegociação (NumeroParcela = NULL)
                if (!boletoPago.FoiPago || boletoPago.NumeroParcela.HasValue)
                {
                    return;
                }

                var valorPago = boletoPago.ValorPago ?? boletoPago.NominalValue;
                if (valorPago <= 0)
                {
                    return;
                }

                // Buscar o contrato
                var contrato = await _context.Contratos.FindAsync(boletoPago.ContratoId);
                if (contrato == null || !contrato.ValorParcela.HasValue || contrato.ValorParcela <= 0)
                {
                    _logger.LogDebug($"Contrato #{boletoPago.ContratoId} não tem valor de parcela definido. Renegociação automática ignorada.");
                    return;
                }

                var valorParcela = contrato.ValorParcela.Value;

                // Calcular quantas parcelas o valor cobre
                // Tolerância de R$ 20,00 para taxa de renegociação
                var tolerancia = 20.0m;
                var parcelasCobertas = (int)Math.Round((valorPago + tolerancia) / valorParcela);

                if (parcelasCobertas <= 0)
                {
                    _logger.LogDebug($"Boleto #{boletoPago.Id}: Valor pago R$ {valorPago:N2} não cobre nenhuma parcela (valor parcela: R$ {valorParcela:N2})");
                    return;
                }

                _logger.LogInformation($"🔄 RENEGOCIAÇÃO AUTOMÁTICA: Boleto #{boletoPago.Id} pago R$ {valorPago:N2} cobre aproximadamente {parcelasCobertas} parcela(s) de R$ {valorParcela:N2}");

                // Buscar boletos BAIXADOS não pagos do mesmo contrato (ordenados por parcela/data)
                var boletosBaixadosNaoPagos = await _context.Boletos
                    .Where(b => b.ContratoId == boletoPago.ContratoId &&
                               b.Id != boletoPago.Id && // Não incluir o próprio boleto
                               b.Ativo &&
                               b.Status == "BAIXADO" &&
                               !b.FoiPago)
                    .OrderBy(b => b.NumeroParcela ?? int.MaxValue)
                    .ThenBy(b => b.DueDate)
                    .Take(parcelasCobertas) // Pegar apenas a quantidade calculada
                    .ToListAsync();

                if (!boletosBaixadosNaoPagos.Any())
                {
                    _logger.LogInformation($"Boleto #{boletoPago.Id}: Nenhum boleto BAIXADO não pago encontrado para marcar como coberto.");
                    return;
                }

                // Marcar os boletos como cobertos pela renegociação
                var parcelasMarcadas = new List<string>();
                foreach (var boletoBaixado in boletosBaixadosNaoPagos)
                {
                    boletoBaixado.FoiPago = true;
                    boletoBaixado.DataPagamento = boletoPago.DataPagamento ?? DateTime.Now;
                    boletoBaixado.DataAtualizacao = DateTime.Now;
                    // Opcional: Adicionar referência ao boleto de renegociação (se tiver campo)
                    // boletoBaixado.RenegociadoPorBoletoId = boletoPago.Id;

                    var parcelaInfo = boletoBaixado.NumeroParcela.HasValue 
                        ? $"parcela {boletoBaixado.NumeroParcela}" 
                        : $"venc. {boletoBaixado.DueDate:dd/MM/yyyy}";
                    parcelasMarcadas.Add($"#{boletoBaixado.Id} ({parcelaInfo})");
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ RENEGOCIAÇÃO PROCESSADA: Boleto #{boletoPago.Id} cobriu {boletosBaixadosNaoPagos.Count} boleto(s) BAIXADO(s): {string.Join(", ", parcelasMarcadas)}");

                // Verificar quitação do contrato após marcar parcelas como pagas
                if (contrato != null)
                {
                    await VerificarQuitacaoContratoAsync(contrato);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao processar renegociação automática do boleto #{boletoPago.Id}");
                // Não propagar exceção para não afetar o fluxo principal
            }
        }

        #endregion

        #region Endpoints para Boleto Manual (Renegociação/Antecipação/Avulso)

        /// <summary>
        /// DTO para parcelas disponíveis para seleção
        /// </summary>
        public class ParcelaDisponivelDTO
        {
            public int? BoletoId { get; set; }
            public int NumeroParcela { get; set; }
            public decimal ValorOriginal { get; set; }
            public DateTime VencimentoOriginal { get; set; }
            public string Status { get; set; } = string.Empty;
            public string Descricao { get; set; } = string.Empty;
        }

        /// <summary>
        /// Resposta do endpoint de parcelas disponíveis
        /// </summary>
        public class ParcelasDisponiveisResponseDTO
        {
            /// <summary>
            /// Parcelas em atraso (BAIXADO_NAO_PAGO) disponíveis para renegociação
            /// </summary>
            public List<ParcelaDisponivelDTO> ParcelasRenegociacao { get; set; } = new();
            
            /// <summary>
            /// Próximas parcelas disponíveis para antecipação
            /// </summary>
            public List<ParcelaDisponivelDTO> ParcelasAntecipacao { get; set; } = new();
            
            /// <summary>
            /// Valor da parcela padrão do contrato
            /// </summary>
            public decimal ValorParcela { get; set; }
            
            /// <summary>
            /// Total de parcelas do contrato
            /// </summary>
            public int TotalParcelas { get; set; }
            
            /// <summary>
            /// Parcela atual (próxima a vencer ou vencendo)
            /// </summary>
            public int? ParcelaAtual { get; set; }
            
            /// <summary>
            /// Quantidade de parcelas em atraso
            /// </summary>
            public int ParcelasEmAtraso { get; set; }
        }

        /// <summary>
        /// Busca as parcelas disponíveis para renegociação e antecipação de um contrato.
        /// Usado no frontend quando o usuário seleciona tipo de boleto manual = RENEGOCIACAO ou ANTECIPACAO
        /// </summary>
        /// <param name="contratoId">ID do contrato</param>
        /// <returns>Lista de parcelas para renegociação e antecipação</returns>
        [HttpGet("contrato/{contratoId}/parcelas-disponiveis")]
        public async Task<ActionResult<ParcelasDisponiveisResponseDTO>> GetParcelasDisponiveis(int contratoId)
        {
            try
            {
                _logger.LogInformation("📋 Buscando parcelas disponíveis para contrato #{ContratoId}", contratoId);

                var contrato = await _context.Contratos
                    .FirstOrDefaultAsync(c => c.Id == contratoId);

                if (contrato == null)
                {
                    return NotFound(new { mensagem = $"Contrato #{contratoId} não encontrado" });
                }

                var response = new ParcelasDisponiveisResponseDTO
                {
                    ValorParcela = contrato.ValorParcela ?? 0,
                    TotalParcelas = contrato.NumeroParcelas ?? 0
                };

                var hoje = DateTime.Today;

                // ========================================================================
                // PARCELAS PARA RENEGOCIAÇÃO: Boletos BAIXADO_NAO_PAGO
                // ========================================================================
                var boletosBaixadosNaoPagos = await _context.Boletos
                    .Where(b => b.ContratoId == contratoId &&
                               b.Ativo &&
                               b.Status == "BAIXADO" &&
                               !b.FoiPago &&
                               b.NumeroParcela.HasValue)
                    .OrderBy(b => b.NumeroParcela)
                    .ThenBy(b => b.DueDate)
                    .ToListAsync();

                foreach (var boleto in boletosBaixadosNaoPagos)
                {
                    response.ParcelasRenegociacao.Add(new ParcelaDisponivelDTO
                    {
                        BoletoId = boleto.Id,
                        NumeroParcela = boleto.NumeroParcela ?? 0,
                        ValorOriginal = boleto.NominalValue,
                        VencimentoOriginal = boleto.DueDate,
                        Status = "BAIXADO_NAO_PAGO",
                        Descricao = $"Parcela {boleto.NumeroParcela} - Vencida em {boleto.DueDate:dd/MM/yyyy} - R$ {boleto.NominalValue:N2}"
                    });
                }

                response.ParcelasEmAtraso = boletosBaixadosNaoPagos.Count;

                // ========================================================================
                // PARCELAS PARA ANTECIPAÇÃO: Parcelas futuras que ainda não têm boleto
                // ========================================================================
                if (contrato.PrimeiroVencimento.HasValue && contrato.NumeroParcelas.HasValue)
                {
                    var primeiroVencimento = contrato.PrimeiroVencimento.Value;
                    var totalParcelas = contrato.NumeroParcelas.Value;
                    var valorParcela = contrato.ValorParcela ?? 0;

                    // Buscar boletos existentes do contrato (não cancelados, não erro)
                    var boletosExistentes = await _context.Boletos
                        .Where(b => b.ContratoId == contratoId &&
                                   b.Ativo &&
                                   b.Status != "ERRO" && b.Status != "CANCELADO" &&
                                   b.NumeroParcela.HasValue)
                        .Select(b => new { b.NumeroParcela, b.Status, b.FoiPago })
                        .ToListAsync();

                    // Calcular a parcela atual baseado na data
                    var mesesDesdeInicio = ((hoje.Year - primeiroVencimento.Year) * 12) + (hoje.Month - primeiroVencimento.Month);
                    var parcelaAtual = Math.Max(1, mesesDesdeInicio + 1);
                    response.ParcelaAtual = Math.Min(parcelaAtual, totalParcelas);

                    // Buscar parcelas futuras para antecipação
                    // Começamos da próxima parcela não gerada ou não paga
                    for (int parcela = (int)response.ParcelaAtual; parcela <= totalParcelas; parcela++)
                    {
                        var boletoExistente = boletosExistentes
                            .FirstOrDefault(b => b.NumeroParcela == parcela);

                        // Se já existe boleto ativo (não baixado não pago), pula
                        if (boletoExistente != null)
                        {
                            // Se é REGISTRADO, ATIVO ou LIQUIDADO/BAIXADO+PAGO, não está disponível
                            if (boletoExistente.Status != "BAIXADO" || boletoExistente.FoiPago)
                            {
                                continue;
                            }
                        }

                        // Calcular data de vencimento desta parcela
                        var dataVencimento = primeiroVencimento.AddMonths(parcela - 1);
                        
                        // Ajustar se o dia não existe no mês
                        var ultimoDiaMes = DateTime.DaysInMonth(dataVencimento.Year, dataVencimento.Month);
                        if (primeiroVencimento.Day > ultimoDiaMes)
                        {
                            dataVencimento = new DateTime(dataVencimento.Year, dataVencimento.Month, ultimoDiaMes);
                        }

                        // Só adiciona se é uma parcela FUTURA (vencimento > hoje)
                        if (dataVencimento > hoje)
                        {
                            response.ParcelasAntecipacao.Add(new ParcelaDisponivelDTO
                            {
                                BoletoId = null, // Parcela ainda não tem boleto
                                NumeroParcela = parcela,
                                ValorOriginal = valorParcela,
                                VencimentoOriginal = dataVencimento,
                                Status = "FUTURA",
                                Descricao = $"Parcela {parcela}/{totalParcelas} - Vence em {dataVencimento:dd/MM/yyyy} - R$ {valorParcela:N2}"
                            });
                        }
                    }
                }

                _logger.LogInformation("✅ Parcelas disponíveis para contrato #{ContratoId}: {Renegociacao} para renegociação, {Antecipacao} para antecipação",
                    contratoId, response.ParcelasRenegociacao.Count, response.ParcelasAntecipacao.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao buscar parcelas disponíveis para contrato #{ContratoId}", contratoId);
                return StatusCode(500, new { mensagem = "Erro interno ao buscar parcelas disponíveis", erro = ex.Message });
            }
        }

        #endregion
    }

    // DTO para marcação manual de PIX como pago
    public class MarcarPagoManualDTO
    {
        /// <summary>
        /// Valor efetivamente pago (opcional, se não informado usa o valor nominal da parcela)
        /// </summary>
        public decimal? ValorPago { get; set; }

        /// <summary>
        /// Data do pagamento (opcional, se não informado usa a data/hora atual)
        /// </summary>
        public DateTime? DataPagamento { get; set; }

        /// <summary>
        /// Observação sobre o pagamento (opcional)
        /// </summary>
        public string? Observacao { get; set; }
    }
}

