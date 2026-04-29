using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class EstatisticasController : ControllerBase
  {
    private readonly CrmArrighiContext _context;
    private readonly IAuthorizationService _authorizationService;
    private readonly ILogger<EstatisticasController> _logger;

    public EstatisticasController(
        CrmArrighiContext context,
        IAuthorizationService authorizationService,
        ILogger<EstatisticasController> logger)
    {
      _context = context;
      _authorizationService = authorizationService;
      _logger = logger;
    }

    // GET: api/Estatisticas/receita
    [HttpGet("receita")]
    public async Task<ActionResult<object>> GetReceita()
    {
      try
      {
        Console.WriteLine("🔍 GetReceita: Iniciando busca de receita");

        // Obter ID do usuário logado
        var usuarioId = GetCurrentUserId();
        if (usuarioId == null)
        {
          Console.WriteLine("❌ GetReceita: Usuário não identificado");
          return Unauthorized("Usuário não autenticado");
        }

        Console.WriteLine($"🔍 GetReceita: Usuário identificado: {usuarioId}");

        var hoje = DateTime.Today;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
        var inicioAno = new DateTime(hoje.Year, 1, 1);
        var mesAnterior = inicioMes.AddMonths(-1);
        var anoAnterior = new DateTime(hoje.Year - 1, 1, 1);

        // Calcular receita baseada nos contratos (LUCRO = ValorNegociado - Comissao)
        var receitaContratos = await _context.Contratos
            .Where(c => c.Ativo)
            .GroupBy(c => 1)
            .Select(g => new
            {
              // Receita total dos contratos (LUCRO LÍQUIDO)
              ReceitaTotal = g.Sum(c => (c.ValorNegociado ?? 0) - (c.Comissao ?? 0)),
              ReceitaEntrada = g.Sum(c => c.ValorEntrada ?? 0),
              ReceitaParcelas = g.Sum(c => (c.ValorParcela ?? 0) * (c.NumeroParcelas ?? 0)),
              ComissaoTotal = g.Sum(c => c.Comissao ?? 0),

              // Receita do mês atual (LUCRO do mês)
              ReceitaMesAtual = g.Where(c => c.DataCadastro >= inicioMes && c.DataCadastro < inicioMes.AddMonths(1))
                                  .Sum(c => (c.ValorNegociado ?? 0) - (c.Comissao ?? 0)),
              ReceitaEntradaMesAtual = g.Where(c => c.DataCadastro >= inicioMes).Sum(c => c.ValorEntrada ?? 0),

              // Receita do ano atual (LUCRO do ano)
              ReceitaAnoAtual = g.Where(c => c.DataCadastro >= inicioAno).Sum(c => (c.ValorNegociado ?? 0) - (c.Comissao ?? 0)),

              // Receita do mês anterior para comparação (LUCRO do mês anterior)
              ReceitaMesAnterior = g.Where(c => c.DataCadastro >= mesAnterior && c.DataCadastro < inicioMes)
                                     .Sum(c => (c.ValorNegociado ?? 0) - (c.Comissao ?? 0)),

              // Contratos por situação
              ContratosLeed = g.Count(c => c.Situacao == "Leed"),
              ContratosProspecto = g.Count(c => c.Situacao == "Prospecto"),
              ContratosEnviado = g.Count(c => c.Situacao == "Contrato Enviado"),
              ContratosAssinado = g.Count(c => c.Situacao == "Contrato Assinado"),
              ContratosFechados = g.Count(c => c.Situacao == "Contrato Assinado" && c.DataFechamentoContrato.HasValue),

              // Contratos do mês
              ContratosMesAtual = g.Count(c => c.DataCadastro >= inicioMes),
              ContratosAnoAtual = g.Count(c => c.DataCadastro >= inicioAno)
            })
            .FirstOrDefaultAsync();

        // Calcular receita baseada nos boletos
        // Considerar LIQUIDADO ou (BAIXADO com FoiPago = true) como pagos
        var receitaBoletos = await _context.Boletos
            .Where(b => b.Ativo)
            .GroupBy(b => 1)
            .Select(g => new
            {
              // Valores dos boletos
              ValorTotalBoletos = g.Sum(b => b.NominalValue),
              ValorBoletosLiquidados = g.Where(b => b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)).Sum(b => b.NominalValue),
              ValorBoletosPendentes = g.Where(b => b.Status == "PENDENTE" || b.Status == "REGISTRADO").Sum(b => b.NominalValue),
              ValorBoletosVencidos = g.Where(b => b.Status == "VENCIDO").Sum(b => b.NominalValue),

              // Boletos do mês (todos)
              BoletosMesAtual = g.Count(b => b.DataCadastro >= inicioMes),
              ValorBoletosMesAtual = g.Where(b => b.DataCadastro >= inicioMes).Sum(b => b.NominalValue),

              // Receita REAL do mês (boletos PAGOS no mês)
              ReceitaMesAtual = g.Where(b =>
                  (b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)) &&
                  b.DataCadastro >= inicioMes
              ).Sum(b => b.NominalValue),

              // Receita REAL do mês anterior (boletos PAGOS no mês anterior)
              ReceitaMesAnterior = g.Where(b =>
                  (b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)) &&
                  b.DataCadastro >= mesAnterior && b.DataCadastro < inicioMes
              ).Sum(b => b.NominalValue),

              // Boletos do ano
              BoletosAnoAtual = g.Count(b => b.DataCadastro >= inicioAno),
              ValorBoletosAnoAtual = g.Where(b => b.DataCadastro >= inicioAno).Sum(b => b.NominalValue),

              // Receita REAL do ano (boletos PAGOS no ano)
              ReceitaAnoAtual = g.Where(b =>
                  (b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)) &&
                  b.DataCadastro >= inicioAno
              ).Sum(b => b.NominalValue)
            })
            .FirstOrDefaultAsync();

        // Calcular crescimento baseado em receita REAL (boletos pagos)
        var crescimentoMes = 0m;

        if (receitaBoletos?.ReceitaMesAnterior > 0)
        {
          crescimentoMes = ((receitaBoletos.ReceitaMesAtual - receitaBoletos.ReceitaMesAnterior) / receitaBoletos.ReceitaMesAnterior) * 100;
        }

        // Calcular métricas de performance
        var taxaConversao = 0m;
        if (receitaContratos?.ContratosLeed > 0)
        {
          taxaConversao = (decimal)receitaContratos.ContratosFechados / (receitaContratos.ContratosLeed + receitaContratos.ContratosProspecto) * 100;
        }

        var resultado = new
        {
          // Receita geral - RECEITA TOTAL = Valor dos boletos LIQUIDADOS (dinheiro que entrou)
          ReceitaTotal = receitaBoletos?.ValorBoletosLiquidados ?? 0,
          // Lucro dos contratos (ValorNegociado - Comissão) - mantido para referência
          LucroContratos = receitaContratos?.ReceitaTotal ?? 0,
          ReceitaEntrada = receitaContratos?.ReceitaEntrada ?? 0,
          ReceitaParcelas = receitaContratos?.ReceitaParcelas ?? 0,
          ComissaoTotal = receitaContratos?.ComissaoTotal ?? 0,

          // Receita REAL por período (boletos pagos)
          ReceitaMesAtual = receitaBoletos?.ReceitaMesAtual ?? 0,
          ReceitaAnoAtual = receitaBoletos?.ReceitaAnoAtual ?? 0,
          CrescimentoMes = Math.Round(crescimentoMes, 2),

          // Boletos
          ValorTotalBoletos = receitaBoletos?.ValorTotalBoletos ?? 0,
          ValorBoletosLiquidados = receitaBoletos?.ValorBoletosLiquidados ?? 0,
          ValorBoletosPendentes = receitaBoletos?.ValorBoletosPendentes ?? 0,
          ValorBoletosVencidos = receitaBoletos?.ValorBoletosVencidos ?? 0,

          // Contratos
          TotalContratos = (receitaContratos?.ContratosLeed ?? 0) +
                           (receitaContratos?.ContratosProspecto ?? 0) +
                           (receitaContratos?.ContratosEnviado ?? 0) +
                           (receitaContratos?.ContratosAssinado ?? 0),
          ContratosFechados = receitaContratos?.ContratosFechados ?? 0,
          ContratosMesAtual = receitaContratos?.ContratosMesAtual ?? 0,
          ContratosAnoAtual = receitaContratos?.ContratosAnoAtual ?? 0,

          // Boletos por período
          BoletosMesAtual = receitaBoletos?.BoletosMesAtual ?? 0,
          BoletosAnoAtual = receitaBoletos?.BoletosAnoAtual ?? 0,
          ValorBoletosMesAtual = receitaBoletos?.ValorBoletosMesAtual ?? 0,
          ValorBoletosAnoAtual = receitaBoletos?.ValorBoletosAnoAtual ?? 0,

          // Métricas de performance
          TaxaConversao = Math.Round(taxaConversao, 2),
          ReceitaMediaPorContrato = receitaContratos?.ContratosAnoAtual > 0 ?
                Math.Round((receitaContratos.ReceitaAnoAtual / receitaContratos.ContratosAnoAtual), 2) : 0,

          // Status dos contratos
          ContratosPorSituacao = new
          {
            Leed = receitaContratos?.ContratosLeed ?? 0,
            Prospecto = receitaContratos?.ContratosProspecto ?? 0,
            Enviado = receitaContratos?.ContratosEnviado ?? 0,
            Assinado = receitaContratos?.ContratosAssinado ?? 0
          }
        };

        _logger.LogInformation($"💰 Receita REAL (Boletos Pagos): Total={resultado.ReceitaTotal:C2}, Mês={resultado.ReceitaMesAtual:C2}, Ano={resultado.ReceitaAnoAtual:C2}");

        return Ok(resultado);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Erro ao calcular receita");
        return StatusCode(500, "Erro interno do servidor");
      }
    }

    // GET: api/Estatisticas/test
    [HttpGet("test")]
    public ActionResult<object> GetTest()
    {
      try
      {
        Console.WriteLine("🔍 GetTest: Testando autenticação");

        var usuarioId = GetCurrentUserId();
        var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());

        return Ok(new
        {
          UsuarioId = usuarioId,
          Headers = headers,
          Message = usuarioId.HasValue ? "Usuário autenticado" : "Usuário não autenticado",
          Timestamp = DateTime.UtcNow
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Erro no teste de autenticação");
        return StatusCode(500, "Erro interno do servidor");
      }
    }

    // GET: api/Estatisticas/debug-contratos
    [HttpGet("debug-contratos")]
    public async Task<ActionResult<object>> GetDebugContratos()
    {
      try
      {
        var usuarioId = GetCurrentUserId();
        if (usuarioId == null)
        {
          return Unauthorized("Usuário não autenticado");
        }

        _logger.LogInformation("🔍 DEBUG: Verificando contratos no banco...");

        var contratos = await _context.Contratos
            .Where(c => c.Ativo)
            .Select(c => new
            {
              c.Id,
              c.ValorNegociado,
              c.Comissao,
              Lucro = (c.ValorNegociado ?? 0) - (c.Comissao ?? 0),
              c.DataCadastro,
              c.Situacao
            })
            .Take(10)
            .ToListAsync();

        var total = await _context.Contratos.Where(c => c.Ativo).CountAsync();
        var comValor = await _context.Contratos.Where(c => c.Ativo && c.ValorNegociado.HasValue && c.ValorNegociado > 0).CountAsync();

        var resultado = new
        {
          TotalContratos = total,
          ContratosComValor = comValor,
          ContratosSemValor = total - comValor,
          ExemplosContratos = contratos,
          LucroTotal = contratos.Sum(c => c.Lucro)
        };

        _logger.LogInformation($"🔍 DEBUG: Total={total}, ComValor={comValor}, LucroExemplo={resultado.LucroTotal}");

        return Ok(resultado);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Erro ao buscar debug de contratos");
        return StatusCode(500, new { error = ex.Message });
      }
    }

    // GET: api/Estatisticas/dashboard
    [HttpGet("dashboard")]
    public async Task<ActionResult<object>> GetDashboardCompleto()
    {
      try
      {
        var usuarioId = GetCurrentUserId();
        if (usuarioId == null)
        {
          return Unauthorized("Usuário não autenticado");
        }

        var hoje = DateTime.Today;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);

        // Estatísticas gerais (LUCRO = ValorNegociado - Comissao)
        var stats = await _context.Contratos
            .Where(c => c.Ativo)
            .GroupBy(c => 1)
            .Select(g => new
            {
              TotalContratos = g.Count(),
              ContratosMesAtual = g.Count(c => c.DataCadastro >= inicioMes),
              ReceitaTotal = g.Sum(c => (c.ValorNegociado ?? 0) - (c.Comissao ?? 0)),
              ReceitaMesAtual = g.Where(c => c.DataCadastro >= inicioMes && c.DataCadastro < inicioMes.AddMonths(1))
                                  .Sum(c => (c.ValorNegociado ?? 0) - (c.Comissao ?? 0)),
              ContratosFechados = g.Count(c => c.Situacao == "Contrato Assinado" && c.DataFechamentoContrato.HasValue),
              ContratosPendentes = g.Count(c => c.Situacao != "Contrato Assinado" && c.Situacao != "Sem Interesse")
            })
            .FirstOrDefaultAsync();

        // Estatísticas de boletos
        var boletosStats = await _context.Boletos
            .Where(b => b.Ativo)
            .GroupBy(b => 1)
            .Select(g => new
            {
              TotalBoletos = g.Count(),
              BoletosLiquidados = g.Count(b => b.Status == "LIQUIDADO"),
              ValorLiquidado = g.Where(b => b.Status == "LIQUIDADO").Sum(b => b.NominalValue),
              ValorPendente = g.Where(b => b.Status == "PENDENTE" || b.Status == "REGISTRADO").Sum(b => b.NominalValue)
            })
            .FirstOrDefaultAsync();

        var resultado = new
        {
          Contratos = stats ?? new { TotalContratos = 0, ContratosMesAtual = 0, ReceitaTotal = 0m, ReceitaMesAtual = 0m, ContratosFechados = 0, ContratosPendentes = 0 },
          Boletos = boletosStats ?? new { TotalBoletos = 0, BoletosLiquidados = 0, ValorLiquidado = 0m, ValorPendente = 0m },
          DataAtualizacao = DateTime.UtcNow
        };

        return Ok(resultado);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Erro ao gerar dashboard completo");
        return StatusCode(500, "Erro interno do servidor");
      }
    }

    // GET: api/Estatisticas/alertas
    [HttpGet("alertas")]
    public async Task<ActionResult<object>> GetAlertasInteligentes()
    {
      try
      {
        _logger.LogInformation("🔔 GetAlertasInteligentes: Iniciando busca de alertas");

        var usuarioId = GetCurrentUserId();
        if (usuarioId == null)
        {
          return Unauthorized("Usuário não autenticado");
        }

        var hoje = DateTime.Today;
        var alertas = new List<object>();

        // 🔴 CRÍTICO: Contratos com próximo contato HOJE
        var contatosHoje = await _context.Contratos
            .Include(c => c.Cliente)
                .ThenInclude(cl => cl.PessoaFisica)
            .Include(c => c.Cliente)
                .ThenInclude(cl => cl.PessoaJuridica)
            .Where(c => c.Ativo &&
                   c.DataProximoContato.HasValue &&
                   c.DataProximoContato.Value.Date == hoje)
            .OrderBy(c => c.DataProximoContato)
            .Take(10)
            .ToListAsync();

        if (contatosHoje.Any())
        {
          var nomeClientes = contatosHoje.Select(c =>
              c.Cliente?.PessoaFisica?.Nome ??
              c.Cliente?.PessoaJuridica?.RazaoSocial ??
              "Cliente"
          ).Take(3).ToList();

          var mensagem = contatosHoje.Count == 1
              ? $"1 cliente precisa ser contatado HOJE: {nomeClientes[0]}"
              : contatosHoje.Count <= 3
                  ? $"{contatosHoje.Count} clientes precisam ser contatados HOJE: {string.Join(", ", nomeClientes)}"
                  : $"{contatosHoje.Count} clientes precisam ser contatados HOJE";

          alertas.Add(new
          {
            Id = "contatos-hoje",
            Tipo = "critico",
            Titulo = "Contatos Urgentes",
            Mensagem = mensagem,
            Quantidade = contatosHoje.Count,
            Acao = "Ver Contratos",
            Link = "/contratos",
            Timestamp = DateTime.UtcNow
          });
        }

        // 🟡 ATENÇÃO: Boletos vencidos há mais de 15 dias
        var dataLimiteVencido = hoje.AddDays(-15);
        var boletosAtrasados = await _context.Boletos
            .Where(b => b.Ativo &&
                   b.Status == "VENCIDO" &&
                   b.DueDate < dataLimiteVencido)
            .CountAsync();

        if (boletosAtrasados > 0)
        {
          var valorAtrasado = await _context.Boletos
              .Where(b => b.Ativo &&
                     b.Status == "VENCIDO" &&
                     b.DueDate < dataLimiteVencido)
              .SumAsync(b => b.NominalValue);

          alertas.Add(new
          {
            Id = "boletos-atrasados",
            Tipo = "atencao",
            Titulo = "Boletos Atrasados",
            Mensagem = $"{boletosAtrasados} boleto(s) vencido(s) há mais de 15 dias (R$ {valorAtrasado:N2})",
            Quantidade = boletosAtrasados,
            Acao = "Ver Boletos",
            Link = "/boletos",
            Timestamp = DateTime.UtcNow
          });
        }

        // 🟡 ATENÇÃO: Clientes sem contato há mais de 60 dias
        var dataLimiteSemContato = hoje.AddDays(-60);
        var clientesSemContato = await _context.Contratos
            .Include(c => c.Cliente)
                .ThenInclude(cl => cl.PessoaFisica)
            .Include(c => c.Cliente)
                .ThenInclude(cl => cl.PessoaJuridica)
            .Where(c => c.Ativo &&
                   c.Situacao != "Contrato Assinado" &&
                   c.Situacao != "Sem Interesse" &&
                   c.DataUltimoContato < dataLimiteSemContato)
            .Take(5)
            .ToListAsync();

        if (clientesSemContato.Any())
        {
          alertas.Add(new
          {
            Id = "clientes-sem-contato",
            Tipo = "atencao",
            Titulo = "Clientes Inativos",
            Mensagem = $"{clientesSemContato.Count} cliente(s) sem contato há mais de 60 dias",
            Quantidade = clientesSemContato.Count,
            Acao = "Ver Contratos",
            Link = "/contratos",
            Timestamp = DateTime.UtcNow
          });
        }

        // 🟡 ATENÇÃO: Próximo contato esta semana
        var proximaSemana = hoje.AddDays(7);
        var contatosEstaSemana = await _context.Contratos
            .Where(c => c.Ativo &&
                   c.DataProximoContato.HasValue &&
                   c.DataProximoContato.Value > hoje &&
                   c.DataProximoContato.Value <= proximaSemana)
            .CountAsync();

        if (contatosEstaSemana > 0)
        {
          alertas.Add(new
          {
            Id = "contatos-semana",
            Tipo = "atencao",
            Titulo = "Próximos Contatos",
            Mensagem = $"{contatosEstaSemana} contato(s) agendado(s) para os próximos 7 dias",
            Quantidade = contatosEstaSemana,
            Acao = "Ver Contratos",
            Link = "/contratos",
            Timestamp = DateTime.UtcNow
          });
        }

        // 🟢 SUCESSO: Contratos assinados esta semana
        var inicioSemana = hoje.AddDays(-(int)hoje.DayOfWeek);
        var contratosAssinados = await _context.Contratos
            .Where(c => c.Ativo &&
                   c.Situacao == "Contrato Assinado" &&
                   c.DataFechamentoContrato >= inicioSemana)
            .CountAsync();

        if (contratosAssinados > 0)
        {
          var valorAssinados = await _context.Contratos
              .Where(c => c.Ativo &&
                     c.Situacao == "Contrato Assinado" &&
                     c.DataFechamentoContrato >= inicioSemana)
              .SumAsync(c => c.ValorNegociado ?? 0);

          alertas.Add(new
          {
            Id = "contratos-assinados",
            Tipo = "sucesso",
            Titulo = "Novos Contratos",
            Mensagem = $"{contratosAssinados} contrato(s) assinado(s) esta semana (R$ {valorAssinados:N2})!",
            Quantidade = contratosAssinados,
            Acao = "Ver Contratos",
            Link = "/contratos",
            Timestamp = DateTime.UtcNow
          });
        }

        // 🔵 INFO: Contratos aguardando retorno (Enviado)
        var contratosAguardando = await _context.Contratos
            .Where(c => c.Ativo && c.Situacao == "Contrato Enviado")
            .CountAsync();

        if (contratosAguardando > 0)
        {
          alertas.Add(new
          {
            Id = "contratos-aguardando",
            Tipo = "info",
            Titulo = "Aguardando Retorno",
            Mensagem = $"{contratosAguardando} contrato(s) enviado(s) aguardando assinatura",
            Quantidade = contratosAguardando,
            Acao = "Ver Contratos",
            Link = "/contratos",
            Timestamp = DateTime.UtcNow
          });
        }

        _logger.LogInformation($"🔔 GetAlertasInteligentes: {alertas.Count} alertas encontrados");

        return Ok(new
        {
          Alertas = alertas,
          Total = alertas.Count,
          DataAtualizacao = DateTime.UtcNow
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Erro ao buscar alertas inteligentes");
        return StatusCode(500, "Erro interno do servidor");
      }
    }

    // GET: api/Estatisticas/ultimos-boletos-pagos
    [HttpGet("ultimos-boletos-pagos")]
    public async Task<ActionResult<object>> GetUltimosBoletosPagos()
    {
      try
      {
        var usuarioId = GetCurrentUserId();
        if (usuarioId == null)
        {
          return Unauthorized("Usuário não autenticado");
        }

        _logger.LogInformation("🔍 GetUltimosBoletosPagos: Buscando últimos 5 boletos pagos");

        // Buscar últimos 5 boletos pagos (LIQUIDADO ou BAIXADO com FoIPago = true)
        var ultimosBoletos = await _context.Boletos
            .Where(b => b.Ativo &&
                       (b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)))
            .Include(b => b.Contrato)
                .ThenInclude(c => c.Cliente)
                    .ThenInclude(cl => cl.PessoaFisica)
            .Include(b => b.Contrato)
                .ThenInclude(c => c.Cliente)
                    .ThenInclude(cl => cl.PessoaJuridica)
            .OrderByDescending(b => b.DataCadastro)
            .Take(5)
            .Select(b => new
            {
              Id = b.Id,
              NsuCode = b.NsuCode,
              BankNumber = b.BankNumber,
              ClientNumber = b.ClientNumber,
              NominalValue = b.NominalValue,
              DueDate = b.DueDate,
              IssueDate = b.IssueDate,
              Status = b.Status,
              DataCadastro = b.DataCadastro,
              FoiPago = b.FoiPago,
              BarCode = b.BarCode,
              DigitableLine = b.DigitableLine,
              Cliente = new
              {
                Id = b.Contrato != null && b.Contrato.Cliente != null ? b.Contrato.Cliente.Id : 0,
                Nome = b.Contrato != null && b.Contrato.Cliente != null && b.Contrato.Cliente.PessoaFisica != null
                        ? b.Contrato.Cliente.PessoaFisica.Nome
                        : b.Contrato != null && b.Contrato.Cliente != null && b.Contrato.Cliente.PessoaJuridica != null
                        ? b.Contrato.Cliente.PessoaJuridica.RazaoSocial
                        : "Cliente",
                Tipo = b.Contrato != null && b.Contrato.Cliente != null && b.Contrato.Cliente.PessoaFisica != null ? "PF" : "PJ"
              },
              Contrato = new
              {
                Id = b.Contrato != null ? b.Contrato.Id : 0,
                NumeroPasta = b.Contrato != null ? b.Contrato.NumeroPasta : null
              }
            })
            .ToListAsync();

        _logger.LogInformation($"✅ GetUltimosBoletosPagos: {ultimosBoletos.Count} boletos encontrados");

        return Ok(new
        {
          UltimosBoletosPagos = ultimosBoletos,
          Total = ultimosBoletos.Count,
          DataAtualizacao = DateTime.UtcNow
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Erro ao buscar últimos boletos pagos");
        return StatusCode(500, "Erro interno do servidor");
      }
    }

    private int? GetCurrentUserId()
    {
      // Obter ID do usuário do header (conforme implementação do sistema)
      var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
      if (int.TryParse(usuarioIdHeader, out int usuarioId))
      {
        Console.WriteLine($"🔍 GetCurrentUserId: Usuário identificado via header: {usuarioId}");
        return usuarioId;
      }

      // Fallback: tentar obter do JWT token se disponível
      var userIdClaim = User.FindFirst("userId");
      if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userIdFromClaim))
      {
        Console.WriteLine($"🔍 GetCurrentUserId: Usuário identificado via JWT: {userIdFromClaim}");
        return userIdFromClaim;
      }

      // Fallback: tentar obter do NameIdentifier
      var nameIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
      if (nameIdClaim != null && int.TryParse(nameIdClaim.Value, out int nameId))
      {
        Console.WriteLine($"🔍 GetCurrentUserId: Usuário identificado via NameIdentifier: {nameId}");
        return nameId;
      }

      Console.WriteLine($"❌ GetCurrentUserId: Nenhum usuário identificado. Headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");
      return null;
    }
  }
}
