using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using System.Text;

namespace CrmArrighi.Services.RAG;

/// <summary>
/// Contexto recuperado do banco de dados
/// </summary>
public class RetrievedContext
{
    public string Summary { get; set; } = string.Empty;
    public List<ContextChunk> Chunks { get; set; } = new();
    public Dictionary<string, object> Metrics { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
    public int TotalRecords { get; set; }
    public string DataSource { get; set; } = string.Empty;
}

/// <summary>
/// Pedaço de contexto individual
/// </summary>
public class ContextChunk
{
    public string Type { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public double Relevance { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Serviço para recuperar contexto do banco de dados baseado na intenção
/// </summary>
public class ContextRetriever : IContextRetriever
{
    private readonly CrmArrighiContext _context;
    private readonly ILogger<ContextRetriever> _logger;

    public ContextRetriever(CrmArrighiContext context, ILogger<ContextRetriever> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Recupera contexto relevante baseado na intenção analisada
    /// </summary>
    public async Task<RetrievedContext> RetrieveAsync(IntentResult intent)
    {
        _logger.LogInformation("📚 Recuperando contexto para intenção: {Intent}", intent.PrimaryIntent);

        var context = new RetrievedContext();

        try
        {
            // Buscar dados baseado na intenção principal
            switch (intent.PrimaryIntent)
            {
                case IntentType.ConsultaBoletos:
                    await RetrieveBoletoContextAsync(context, intent);
                    break;

                case IntentType.ConsultaClientes:
                    await RetrieveClienteContextAsync(context, intent);
                    break;

                case IntentType.ConsultaContratos:
                    await RetrieveContratoContextAsync(context, intent);
                    break;

                case IntentType.ConsultaFaturamento:
                    await RetrieveFaturamentoContextAsync(context, intent);
                    break;

                case IntentType.ConsultaInadimplencia:
                    await RetrieveInadimplenciaContextAsync(context, intent);
                    break;

                case IntentType.ConsultaComissoes:
                    await RetrieveComissoesContextAsync(context, intent);
                    break;

                case IntentType.ConsultaConsultores:
                    await RetrieveConsultoresContextAsync(context, intent);
                    break;

                case IntentType.ConsultaFiliais:
                    await RetrieveFiliaisContextAsync(context, intent);
                    break;

                case IntentType.EstatisticasGerais:
                case IntentType.EstatisticasMensais:
                case IntentType.EstatisticasAnuais:
                    await RetrieveEstatisticasContextAsync(context, intent);
                    break;

                case IntentType.Comparativos:
                    await RetrieveComparativosContextAsync(context, intent);
                    break;

                default:
                    // Para outras intenções, buscar contexto geral
                    await RetrieveGeneralContextAsync(context);
                    break;
            }

            _logger.LogInformation("✅ Contexto recuperado: {Chunks} chunks, {Records} registros",
                context.Chunks.Count, context.TotalRecords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao recuperar contexto");
            context.Summary = "Erro ao buscar dados do sistema.";
        }

        return context;
    }

    #region Métodos de Recuperação Específicos

    private async Task RetrieveBoletoContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Boletos";
        var hoje = DateTime.Today;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
        var fimMes = inicioMes.AddMonths(1).AddDays(-1);

        // Estatísticas gerais de boletos
        var totalBoletos = await _context.Boletos.CountAsync();
        var boletosAtivos = await _context.Boletos.Where(b => b.Ativo).CountAsync();

        // Boletos vencidos
        var boletosVencidos = await _context.Boletos
            .Where(b => b.Ativo && b.DueDate < hoje && !b.FoiPago)
            .ToListAsync();

        var valorVencido = boletosVencidos.Sum(b => b.NominalValue);

        // Boletos pagos no mês
        var boletosPagosMes = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioMes && b.DataPagamento <= fimMes)
            .ToListAsync();

        var valorPagoMes = boletosPagosMes.Sum(b => b.ValorPago ?? b.NominalValue);

        // Boletos a vencer
        var boletosAVencer = await _context.Boletos
            .Where(b => b.Ativo && b.DueDate >= hoje && b.DueDate <= hoje.AddDays(30) && !b.FoiPago)
            .CountAsync();

        // Métricas
        context.Metrics["total_boletos"] = totalBoletos;
        context.Metrics["boletos_ativos"] = boletosAtivos;
        context.Metrics["boletos_vencidos_qtd"] = boletosVencidos.Count;
        context.Metrics["boletos_vencidos_valor"] = valorVencido;
        context.Metrics["boletos_pagos_mes_qtd"] = boletosPagosMes.Count;
        context.Metrics["boletos_pagos_mes_valor"] = valorPagoMes;
        context.Metrics["boletos_a_vencer_30dias"] = boletosAVencer;

        // Resumo textual
        var sb = new StringBuilder();
        sb.AppendLine($"📊 DADOS DE BOLETOS (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de boletos no sistema: {totalBoletos:N0}");
        sb.AppendLine($"• Boletos ativos: {boletosAtivos:N0}");
        sb.AppendLine($"• Boletos vencidos não pagos: {boletosVencidos.Count:N0} (R$ {valorVencido:N2})");
        sb.AppendLine($"• Boletos pagos este mês: {boletosPagosMes.Count:N0} (R$ {valorPagoMes:N2})");
        sb.AppendLine($"• Boletos a vencer nos próximos 30 dias: {boletosAVencer:N0}");

        // Top 5 maiores boletos vencidos
        if (boletosVencidos.Any())
        {
            sb.AppendLine("\n📋 TOP 5 MAIORES BOLETOS VENCIDOS:");
            var topVencidos = boletosVencidos
                .OrderByDescending(b => b.NominalValue)
                .Take(5)
                .ToList();

            foreach (var boleto in topVencidos)
            {
                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                    .ThenInclude(cl => cl!.PessoaFisica)
                    .Include(c => c.Cliente)
                    .ThenInclude(cl => cl!.PessoaJuridica)
                    .FirstOrDefaultAsync(c => c.Id == boleto.ContratoId);

                var nomeCliente = contrato?.Cliente?.PessoaFisica?.Nome ??
                                  contrato?.Cliente?.PessoaJuridica?.RazaoSocial ??
                                  "N/A";

                var diasVencido = (hoje - boleto.DueDate).Days;
                sb.AppendLine($"  - {nomeCliente}: R$ {boleto.NominalValue:N2} (vencido há {diasVencido} dias)");
            }
        }

        context.Summary = sb.ToString();
        context.TotalRecords = totalBoletos;

        // Chunk detalhado
        context.Chunks.Add(new ContextChunk
        {
            Type = "boletos_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveClienteContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Clientes";

        var totalClientes = await _context.Clientes.CountAsync();
        var clientesAtivos = await _context.Clientes.Where(c => c.Ativo).CountAsync();
        var clientesPF = await _context.Clientes.Where(c => c.TipoPessoa == "PF").CountAsync();
        var clientesPJ = await _context.Clientes.Where(c => c.TipoPessoa == "PJ").CountAsync();

        // Clientes por filial
        var clientesPorFilial = await _context.Clientes
            .Where(c => c.Ativo && c.FilialId != null)
            .GroupBy(c => c.Filial!.Nome)
            .Select(g => new { Filial = g.Key, Quantidade = g.Count() })
            .OrderByDescending(x => x.Quantidade)
            .Take(10)
            .ToListAsync();

        // Novos clientes este mês
        var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        var novosClientesMes = await _context.Clientes
            .Where(c => c.DataCadastro >= inicioMes)
            .CountAsync();

        context.Metrics["total_clientes"] = totalClientes;
        context.Metrics["clientes_ativos"] = clientesAtivos;
        context.Metrics["clientes_pf"] = clientesPF;
        context.Metrics["clientes_pj"] = clientesPJ;
        context.Metrics["novos_clientes_mes"] = novosClientesMes;

        var sb = new StringBuilder();
        sb.AppendLine($"👥 DADOS DE CLIENTES (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de clientes: {totalClientes:N0}");
        sb.AppendLine($"• Clientes ativos: {clientesAtivos:N0}");
        sb.AppendLine($"• Pessoas Físicas: {clientesPF:N0}");
        sb.AppendLine($"• Pessoas Jurídicas: {clientesPJ:N0}");
        sb.AppendLine($"• Novos clientes este mês: {novosClientesMes:N0}");

        if (clientesPorFilial.Any())
        {
            sb.AppendLine("\n📍 CLIENTES POR FILIAL:");
            foreach (var item in clientesPorFilial)
            {
                sb.AppendLine($"  - {item.Filial ?? "Sem filial"}: {item.Quantidade:N0}");
            }
        }

        context.Summary = sb.ToString();
        context.TotalRecords = totalClientes;

        context.Chunks.Add(new ContextChunk
        {
            Type = "clientes_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveContratoContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Contratos";

        var totalContratos = await _context.Contratos.CountAsync();
        var contratosAtivos = await _context.Contratos.Where(c => c.Ativo).CountAsync();

        // Por situação
        var contratosPorSituacao = await _context.Contratos
            .Where(c => c.Ativo)
            .GroupBy(c => c.Situacao)
            .Select(g => new { Situacao = g.Key, Quantidade = g.Count(), ValorTotal = g.Sum(c => c.ValorNegociado) })
            .ToListAsync();

        // Valor total negociado
        var valorTotalNegociado = await _context.Contratos
            .Where(c => c.Ativo)
            .SumAsync(c => c.ValorNegociado);

        // Contratos fechados este mês
        var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        var contratosFechadosMes = await _context.Contratos
            .Where(c => c.DataFechamentoContrato >= inicioMes)
            .CountAsync();

        var valorFechadoMes = await _context.Contratos
            .Where(c => c.DataFechamentoContrato >= inicioMes)
            .SumAsync(c => c.ValorNegociado);

        context.Metrics["total_contratos"] = totalContratos;
        context.Metrics["contratos_ativos"] = contratosAtivos;
        context.Metrics["valor_total_negociado"] = valorTotalNegociado;
        context.Metrics["contratos_fechados_mes"] = contratosFechadosMes;
        context.Metrics["valor_fechado_mes"] = valorFechadoMes;

        var sb = new StringBuilder();
        sb.AppendLine($"📄 DADOS DE CONTRATOS (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de contratos: {totalContratos:N0}");
        sb.AppendLine($"• Contratos ativos: {contratosAtivos:N0}");
        sb.AppendLine($"• Valor total negociado: R$ {valorTotalNegociado:N2}");
        sb.AppendLine($"• Contratos fechados este mês: {contratosFechadosMes:N0} (R$ {valorFechadoMes:N2})");

        sb.AppendLine("\n📊 POR SITUAÇÃO:");
        foreach (var item in contratosPorSituacao.OrderByDescending(x => x.Quantidade))
        {
            sb.AppendLine($"  - {item.Situacao ?? "N/A"}: {item.Quantidade:N0} contratos (R$ {item.ValorTotal:N2})");
        }

        context.Summary = sb.ToString();
        context.TotalRecords = totalContratos;

        context.Chunks.Add(new ContextChunk
        {
            Type = "contratos_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveFaturamentoContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Faturamento";
        var hoje = DateTime.Today;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
        var inicioAno = new DateTime(hoje.Year, 1, 1);
        var inicioMesPassado = inicioMes.AddMonths(-1);
        var fimMesPassado = inicioMes.AddDays(-1);

        // Receita do mês atual (boletos pagos)
        var receitaMesAtual = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioMes)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        // Receita do mês passado
        var receitaMesPassado = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioMesPassado && b.DataPagamento <= fimMesPassado)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        // Receita do ano
        var receitaAnoAtual = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioAno)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        // Receita total histórica
        var receitaTotal = await _context.Boletos
            .Where(b => b.FoiPago)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        // Valor a receber (boletos pendentes)
        var valorAReceber = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago)
            .SumAsync(b => b.NominalValue);

        // Variação mensal
        var variacaoMensal = receitaMesPassado > 0
            ? ((receitaMesAtual - receitaMesPassado) / receitaMesPassado) * 100
            : 0;

        context.Metrics["receita_mes_atual"] = receitaMesAtual;
        context.Metrics["receita_mes_passado"] = receitaMesPassado;
        context.Metrics["receita_ano_atual"] = receitaAnoAtual;
        context.Metrics["receita_total"] = receitaTotal;
        context.Metrics["valor_a_receber"] = valorAReceber;
        context.Metrics["variacao_mensal_percentual"] = variacaoMensal;

        var sb = new StringBuilder();
        sb.AppendLine($"💰 DADOS DE FATURAMENTO (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Receita este mês: R$ {receitaMesAtual:N2}");
        sb.AppendLine($"• Receita mês passado: R$ {receitaMesPassado:N2}");
        sb.AppendLine($"• Variação mensal: {variacaoMensal:+0.0;-0.0;0.0}%");
        sb.AppendLine($"• Receita este ano: R$ {receitaAnoAtual:N2}");
        sb.AppendLine($"• Receita total histórica: R$ {receitaTotal:N2}");
        sb.AppendLine($"• Valor a receber (pendente): R$ {valorAReceber:N2}");

        // Faturamento por mês (últimos 6 meses)
        sb.AppendLine("\n📈 FATURAMENTO ÚLTIMOS 6 MESES:");
        for (int i = 5; i >= 0; i--)
        {
            var inicioMesRef = inicioMes.AddMonths(-i);
            var fimMesRef = inicioMesRef.AddMonths(1).AddDays(-1);
            var receitaMes = await _context.Boletos
                .Where(b => b.FoiPago && b.DataPagamento >= inicioMesRef && b.DataPagamento <= fimMesRef)
                .SumAsync(b => b.ValorPago ?? b.NominalValue);

            sb.AppendLine($"  - {inicioMesRef:MMM/yyyy}: R$ {receitaMes:N2}");
        }

        context.Summary = sb.ToString();
        context.TotalRecords = await _context.Boletos.Where(b => b.FoiPago).CountAsync();

        context.Chunks.Add(new ContextChunk
        {
            Type = "faturamento_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveInadimplenciaContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Inadimplência";
        var hoje = DateTime.Today;

        // Boletos vencidos por faixa de dias
        var vencidosAte30 = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje && b.DueDate >= hoje.AddDays(-30))
            .ToListAsync();

        var vencidos31a60 = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje.AddDays(-30) && b.DueDate >= hoje.AddDays(-60))
            .ToListAsync();

        var vencidos61a90 = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje.AddDays(-60) && b.DueDate >= hoje.AddDays(-90))
            .ToListAsync();

        var vencidosMais90 = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje.AddDays(-90))
            .ToListAsync();

        var totalVencido = vencidosAte30.Count + vencidos31a60.Count + vencidos61a90.Count + vencidosMais90.Count;
        var valorTotalVencido = vencidosAte30.Sum(b => b.NominalValue) +
                                vencidos31a60.Sum(b => b.NominalValue) +
                                vencidos61a90.Sum(b => b.NominalValue) +
                                vencidosMais90.Sum(b => b.NominalValue);

        // Clientes inadimplentes
        var clientesInadimplentes = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje)
            .Include(b => b.Contrato)
            .Select(b => b.Contrato!.ClienteId)
            .Distinct()
            .CountAsync();

        context.Metrics["boletos_vencidos_total"] = totalVencido;
        context.Metrics["valor_vencido_total"] = valorTotalVencido;
        context.Metrics["vencidos_ate_30_dias"] = vencidosAte30.Count;
        context.Metrics["vencidos_31_60_dias"] = vencidos31a60.Count;
        context.Metrics["vencidos_61_90_dias"] = vencidos61a90.Count;
        context.Metrics["vencidos_mais_90_dias"] = vencidosMais90.Count;
        context.Metrics["clientes_inadimplentes"] = clientesInadimplentes;

        var sb = new StringBuilder();
        sb.AppendLine($"⚠️ ANÁLISE DE INADIMPLÊNCIA (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de boletos vencidos: {totalVencido:N0}");
        sb.AppendLine($"• Valor total em atraso: R$ {valorTotalVencido:N2}");
        sb.AppendLine($"• Clientes inadimplentes: {clientesInadimplentes:N0}");

        sb.AppendLine("\n📊 POR FAIXA DE ATRASO:");
        sb.AppendLine($"  - Até 30 dias: {vencidosAte30.Count:N0} boletos (R$ {vencidosAte30.Sum(b => b.NominalValue):N2})");
        sb.AppendLine($"  - 31 a 60 dias: {vencidos31a60.Count:N0} boletos (R$ {vencidos31a60.Sum(b => b.NominalValue):N2})");
        sb.AppendLine($"  - 61 a 90 dias: {vencidos61a90.Count:N0} boletos (R$ {vencidos61a90.Sum(b => b.NominalValue):N2})");
        sb.AppendLine($"  - Mais de 90 dias: {vencidosMais90.Count:N0} boletos (R$ {vencidosMais90.Sum(b => b.NominalValue):N2})");

        // Top devedores
        sb.AppendLine("\n🔴 TOP 10 MAIORES DEVEDORES:");
        var topDevedores = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje)
            .Include(b => b.Contrato)
            .ThenInclude(c => c!.Cliente)
            .ThenInclude(cl => cl!.PessoaFisica)
            .Include(b => b.Contrato)
            .ThenInclude(c => c!.Cliente)
            .ThenInclude(cl => cl!.PessoaJuridica)
            .GroupBy(b => b.Contrato!.ClienteId)
            .Select(g => new
            {
                ClienteId = g.Key,
                ValorTotal = g.Sum(b => b.NominalValue),
                Quantidade = g.Count(),
                Cliente = g.First().Contrato!.Cliente
            })
            .OrderByDescending(x => x.ValorTotal)
            .Take(10)
            .ToListAsync();

        foreach (var devedor in topDevedores)
        {
            var nome = devedor.Cliente?.PessoaFisica?.Nome ??
                       devedor.Cliente?.PessoaJuridica?.RazaoSocial ??
                       "N/A";
            sb.AppendLine($"  - {nome}: R$ {devedor.ValorTotal:N2} ({devedor.Quantidade} boletos)");
        }

        context.Summary = sb.ToString();
        context.TotalRecords = totalVencido;

        context.Chunks.Add(new ContextChunk
        {
            Type = "inadimplencia_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveComissoesContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Comissões";
        var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);

        // Total de comissões
        var totalComissoes = await _context.Contratos
            .Where(c => c.Ativo)
            .SumAsync(c => c.Comissao);

        // Comissões do mês (contratos fechados este mês)
        var comissoesMes = await _context.Contratos
            .Where(c => c.DataFechamentoContrato >= inicioMes)
            .SumAsync(c => c.Comissao);

        // Comissões por parceiro
        var comissoesPorParceiro = await _context.Contratos
            .Where(c => c.Ativo && c.ParceiroId != null)
            .Include(c => c.Parceiro)
            .ThenInclude(p => p!.PessoaFisica)
            .GroupBy(c => c.Parceiro!.PessoaFisica!.Nome)
            .Select(g => new { Parceiro = g.Key, Total = g.Sum(c => c.Comissao), Contratos = g.Count() })
            .OrderByDescending(x => x.Total)
            .Take(10)
            .ToListAsync();

        context.Metrics["total_comissoes"] = totalComissoes;
        context.Metrics["comissoes_mes"] = comissoesMes;

        var sb = new StringBuilder();
        sb.AppendLine($"💼 DADOS DE COMISSÕES (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de comissões acumuladas: R$ {totalComissoes:N2}");
        sb.AppendLine($"• Comissões este mês: R$ {comissoesMes:N2}");

        if (comissoesPorParceiro.Any())
        {
            sb.AppendLine("\n🤝 COMISSÕES POR PARCEIRO:");
            foreach (var item in comissoesPorParceiro)
            {
                sb.AppendLine($"  - {item.Parceiro ?? "N/A"}: R$ {item.Total:N2} ({item.Contratos} contratos)");
            }
        }

        context.Summary = sb.ToString();
        context.TotalRecords = await _context.Contratos.Where(c => c.Comissao > 0).CountAsync();

        context.Chunks.Add(new ContextChunk
        {
            Type = "comissoes_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveConsultoresContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Consultores";
        var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);

        var totalConsultores = await _context.Consultores.CountAsync();
        var consultoresAtivos = await _context.Consultores.Where(c => c.Ativo).CountAsync();

        // Performance por consultor (contratos fechados este mês)
        var performanceConsultores = await _context.Contratos
            .Where(c => c.DataFechamentoContrato >= inicioMes && c.ConsultorId != null)
            .Include(c => c.Consultor)
            .ThenInclude(cons => cons!.PessoaFisica)
            .GroupBy(c => c.Consultor!.PessoaFisica!.Nome)
            .Select(g => new
            {
                Consultor = g.Key,
                Contratos = g.Count(),
                Valor = g.Sum(c => c.ValorNegociado)
            })
            .OrderByDescending(x => x.Valor)
            .Take(10)
            .ToListAsync();

        context.Metrics["total_consultores"] = totalConsultores;
        context.Metrics["consultores_ativos"] = consultoresAtivos;

        var sb = new StringBuilder();
        sb.AppendLine($"👔 DADOS DE CONSULTORES (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de consultores: {totalConsultores:N0}");
        sb.AppendLine($"• Consultores ativos: {consultoresAtivos:N0}");

        if (performanceConsultores.Any())
        {
            sb.AppendLine("\n🏆 RANKING CONSULTORES (este mês):");
            var rank = 1;
            foreach (var item in performanceConsultores)
            {
                sb.AppendLine($"  {rank}º {item.Consultor ?? "N/A"}: {item.Contratos} contratos (R$ {item.Valor:N2})");
                rank++;
            }
        }

        context.Summary = sb.ToString();
        context.TotalRecords = totalConsultores;

        context.Chunks.Add(new ContextChunk
        {
            Type = "consultores_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveFiliaisContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Filiais";

        var filiais = await _context.Filiais.ToListAsync();

        // Estatísticas por filial
        var sb = new StringBuilder();
        sb.AppendLine($"🏢 DADOS DE FILIAIS (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine($"• Total de filiais: {filiais.Count:N0}");

        sb.AppendLine("\n📊 ESTATÍSTICAS POR FILIAL:");
        foreach (var filial in filiais)
        {
            var clientesFilial = await _context.Clientes.Where(c => c.FilialId == filial.Id && c.Ativo).CountAsync();
            var contratosFilial = await _context.Contratos
                .Where(c => c.Cliente!.FilialId == filial.Id && c.Ativo)
                .SumAsync(c => c.ValorNegociado);

            sb.AppendLine($"  - {filial.Nome}: {clientesFilial:N0} clientes, R$ {contratosFilial:N2} em contratos");
        }

        context.Metrics["total_filiais"] = filiais.Count;

        context.Summary = sb.ToString();
        context.TotalRecords = filiais.Count;

        context.Chunks.Add(new ContextChunk
        {
            Type = "filiais_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveEstatisticasContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Estatísticas Gerais";
        var hoje = DateTime.Today;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
        var inicioAno = new DateTime(hoje.Year, 1, 1);

        // Métricas gerais
        var totalClientes = await _context.Clientes.Where(c => c.Ativo).CountAsync();
        var totalContratos = await _context.Contratos.Where(c => c.Ativo).CountAsync();
        var totalBoletos = await _context.Boletos.Where(b => b.Ativo).CountAsync();

        // Faturamento
        var faturamentoMes = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioMes)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        var faturamentoAno = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioAno)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        // Inadimplência
        var valorInadimplente = await _context.Boletos
            .Where(b => b.Ativo && !b.FoiPago && b.DueDate < hoje)
            .SumAsync(b => b.NominalValue);

        // Novos este mês
        var novosClientesMes = await _context.Clientes.Where(c => c.DataCadastro >= inicioMes).CountAsync();
        var novosContratosMes = await _context.Contratos.Where(c => c.DataCadastro >= inicioMes).CountAsync();

        context.Metrics["total_clientes"] = totalClientes;
        context.Metrics["total_contratos"] = totalContratos;
        context.Metrics["total_boletos"] = totalBoletos;
        context.Metrics["faturamento_mes"] = faturamentoMes;
        context.Metrics["faturamento_ano"] = faturamentoAno;
        context.Metrics["valor_inadimplente"] = valorInadimplente;
        context.Metrics["novos_clientes_mes"] = novosClientesMes;
        context.Metrics["novos_contratos_mes"] = novosContratosMes;

        var sb = new StringBuilder();
        sb.AppendLine($"📊 ESTATÍSTICAS GERAIS DO SISTEMA (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine();
        sb.AppendLine("📈 VISÃO GERAL:");
        sb.AppendLine($"  • Clientes ativos: {totalClientes:N0}");
        sb.AppendLine($"  • Contratos ativos: {totalContratos:N0}");
        sb.AppendLine($"  • Boletos ativos: {totalBoletos:N0}");
        sb.AppendLine();
        sb.AppendLine("💰 FATURAMENTO:");
        sb.AppendLine($"  • Este mês: R$ {faturamentoMes:N2}");
        sb.AppendLine($"  • Este ano: R$ {faturamentoAno:N2}");
        sb.AppendLine();
        sb.AppendLine("⚠️ INADIMPLÊNCIA:");
        sb.AppendLine($"  • Valor em atraso: R$ {valorInadimplente:N2}");
        sb.AppendLine();
        sb.AppendLine("🆕 NOVOS ESTE MÊS:");
        sb.AppendLine($"  • Clientes: {novosClientesMes:N0}");
        sb.AppendLine($"  • Contratos: {novosContratosMes:N0}");

        context.Summary = sb.ToString();
        context.TotalRecords = totalClientes + totalContratos + totalBoletos;

        context.Chunks.Add(new ContextChunk
        {
            Type = "estatisticas_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveComparativosContextAsync(RetrievedContext context, IntentResult intent)
    {
        context.DataSource = "Comparativos";
        var hoje = DateTime.Today;
        var inicioMesAtual = new DateTime(hoje.Year, hoje.Month, 1);
        var inicioMesPassado = inicioMesAtual.AddMonths(-1);
        var fimMesPassado = inicioMesAtual.AddDays(-1);

        // Comparativo mensal - Faturamento
        var faturamentoMesAtual = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioMesAtual)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        var faturamentoMesPassado = await _context.Boletos
            .Where(b => b.FoiPago && b.DataPagamento >= inicioMesPassado && b.DataPagamento <= fimMesPassado)
            .SumAsync(b => b.ValorPago ?? b.NominalValue);

        var variacaoFaturamento = faturamentoMesPassado > 0
            ? ((faturamentoMesAtual - faturamentoMesPassado) / faturamentoMesPassado) * 100
            : 0;

        // Comparativo - Novos clientes
        var clientesMesAtual = await _context.Clientes.Where(c => c.DataCadastro >= inicioMesAtual).CountAsync();
        var clientesMesPassado = await _context.Clientes
            .Where(c => c.DataCadastro >= inicioMesPassado && c.DataCadastro <= fimMesPassado)
            .CountAsync();

        // Comparativo - Contratos fechados
        var contratosMesAtual = await _context.Contratos.Where(c => c.DataFechamentoContrato >= inicioMesAtual).CountAsync();
        var contratosMesPassado = await _context.Contratos
            .Where(c => c.DataFechamentoContrato >= inicioMesPassado && c.DataFechamentoContrato <= fimMesPassado)
            .CountAsync();

        context.Metrics["faturamento_mes_atual"] = faturamentoMesAtual;
        context.Metrics["faturamento_mes_passado"] = faturamentoMesPassado;
        context.Metrics["variacao_faturamento"] = variacaoFaturamento;
        context.Metrics["clientes_mes_atual"] = clientesMesAtual;
        context.Metrics["clientes_mes_passado"] = clientesMesPassado;
        context.Metrics["contratos_mes_atual"] = contratosMesAtual;
        context.Metrics["contratos_mes_passado"] = contratosMesPassado;

        var sb = new StringBuilder();
        sb.AppendLine($"📊 COMPARATIVO MENSAL (atualizado em {DateTime.Now:dd/MM/yyyy HH:mm}):");
        sb.AppendLine();
        sb.AppendLine("💰 FATURAMENTO:");
        sb.AppendLine($"  • Mês atual: R$ {faturamentoMesAtual:N2}");
        sb.AppendLine($"  • Mês passado: R$ {faturamentoMesPassado:N2}");
        sb.AppendLine($"  • Variação: {variacaoFaturamento:+0.0;-0.0;0.0}% {(variacaoFaturamento >= 0 ? "📈" : "📉")}");
        sb.AppendLine();
        sb.AppendLine("👥 NOVOS CLIENTES:");
        sb.AppendLine($"  • Mês atual: {clientesMesAtual:N0}");
        sb.AppendLine($"  • Mês passado: {clientesMesPassado:N0}");
        sb.AppendLine();
        sb.AppendLine("📄 CONTRATOS FECHADOS:");
        sb.AppendLine($"  • Mês atual: {contratosMesAtual:N0}");
        sb.AppendLine($"  • Mês passado: {contratosMesPassado:N0}");

        context.Summary = sb.ToString();

        context.Chunks.Add(new ContextChunk
        {
            Type = "comparativos_resumo",
            Content = context.Summary,
            Relevance = 1.0,
            Metadata = new Dictionary<string, object>(context.Metrics)
        });
    }

    private async Task RetrieveGeneralContextAsync(RetrievedContext context)
    {
        context.DataSource = "Geral";

        var totalClientes = await _context.Clientes.Where(c => c.Ativo).CountAsync();
        var totalContratos = await _context.Contratos.Where(c => c.Ativo).CountAsync();
        var totalBoletos = await _context.Boletos.Where(b => b.Ativo).CountAsync();

        var sb = new StringBuilder();
        sb.AppendLine($"📊 RESUMO DO SISTEMA:");
        sb.AppendLine($"• Clientes ativos: {totalClientes:N0}");
        sb.AppendLine($"• Contratos ativos: {totalContratos:N0}");
        sb.AppendLine($"• Boletos ativos: {totalBoletos:N0}");

        context.Summary = sb.ToString();
        context.TotalRecords = totalClientes + totalContratos + totalBoletos;

        context.Chunks.Add(new ContextChunk
        {
            Type = "geral_resumo",
            Content = context.Summary,
            Relevance = 0.5
        });
    }

    #endregion
}

/// <summary>
/// Interface para o recuperador de contexto
/// </summary>
public interface IContextRetriever
{
    Task<RetrievedContext> RetrieveAsync(IntentResult intent);
}
