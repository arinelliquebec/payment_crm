using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using System.Text.Json;

namespace CrmArrighi.Services
{
    public interface INotificacaoService
    {
        Task<Notificacao> CriarNotificacaoAsync(string tipo, string titulo, string mensagem, int? usuarioId = null, int? boletoId = null, int? contratoId = null, int? clienteId = null, string prioridade = "Normal", string? link = null, object? dadosAdicionais = null);
        Task<List<Notificacao>> GetNotificacoesUsuarioAsync(int usuarioId, bool apenasNaoLidas = false, int limite = 50);
        Task<int> GetCountNaoLidasAsync(int usuarioId);
        Task MarcarComoLidaAsync(int notificacaoId);
        Task MarcarTodasComoLidasAsync(int usuarioId);
        Task NotificarBoletoPagoAsync(Boleto boleto);
        Task NotificarBoletoVencidoAsync(Boleto boleto);
        Task NotificarAdministradoresAsync(string tipo, string titulo, string mensagem, string prioridade = "Normal", int? boletoId = null, int? contratoId = null, int? clienteId = null, string? link = null);
    }

    public class NotificacaoService : INotificacaoService
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<NotificacaoService> _logger;

        public NotificacaoService(CrmArrighiContext context, ILogger<NotificacaoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Cria uma nova notificação
        /// </summary>
        public async Task<Notificacao> CriarNotificacaoAsync(
            string tipo,
            string titulo,
            string mensagem,
            int? usuarioId = null,
            int? boletoId = null,
            int? contratoId = null,
            int? clienteId = null,
            string prioridade = "Normal",
            string? link = null,
            object? dadosAdicionais = null)
        {
            var notificacao = new Notificacao
            {
                Tipo = tipo,
                Titulo = titulo,
                Mensagem = mensagem,
                UsuarioId = usuarioId,
                BoletoId = boletoId,
                ContratoId = contratoId,
                ClienteId = clienteId,
                Prioridade = prioridade,
                Link = link,
                DadosAdicionais = dadosAdicionais != null ? JsonSerializer.Serialize(dadosAdicionais) : null,
                DataCriacao = DateTime.UtcNow,
                Lida = false
            };

            _context.Notificacoes.Add(notificacao);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"🔔 Notificação criada: {tipo} - {titulo} (ID: {notificacao.Id})");

            return notificacao;
        }

        /// <summary>
        /// Busca notificações de um usuário
        /// </summary>
        public async Task<List<Notificacao>> GetNotificacoesUsuarioAsync(int usuarioId, bool apenasNaoLidas = false, int limite = 50)
        {
            var query = _context.Notificacoes
                .Where(n => n.UsuarioId == usuarioId || n.UsuarioId == null) // null = notificação global
                .Include(n => n.Boleto)
                .Include(n => n.Contrato)
                .Include(n => n.Cliente)
                    .ThenInclude(c => c.PessoaFisica)
                .Include(n => n.Cliente)
                    .ThenInclude(c => c.PessoaJuridica)
                .AsQueryable();

            if (apenasNaoLidas)
            {
                query = query.Where(n => !n.Lida);
            }

            return await query
                .OrderByDescending(n => n.DataCriacao)
                .Take(limite)
                .ToListAsync();
        }

        /// <summary>
        /// Conta notificações não lidas de um usuário
        /// </summary>
        public async Task<int> GetCountNaoLidasAsync(int usuarioId)
        {
            return await _context.Notificacoes
                .Where(n => (n.UsuarioId == usuarioId || n.UsuarioId == null) && !n.Lida)
                .CountAsync();
        }

        /// <summary>
        /// Marca uma notificação como lida
        /// </summary>
        public async Task MarcarComoLidaAsync(int notificacaoId)
        {
            var notificacao = await _context.Notificacoes.FindAsync(notificacaoId);
            if (notificacao != null && !notificacao.Lida)
            {
                notificacao.Lida = true;
                notificacao.DataLeitura = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Marca todas as notificações de um usuário como lidas
        /// </summary>
        public async Task MarcarTodasComoLidasAsync(int usuarioId)
        {
            var notificacoes = await _context.Notificacoes
                .Where(n => (n.UsuarioId == usuarioId || n.UsuarioId == null) && !n.Lida)
                .ToListAsync();

            foreach (var notificacao in notificacoes)
            {
                notificacao.Lida = true;
                notificacao.DataLeitura = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Notifica quando um boleto é pago
        /// </summary>
        public async Task NotificarBoletoPagoAsync(Boleto boleto)
        {
            try
            {
                // Buscar informações do boleto
                var boletoCompleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Consultor)
                    .FirstOrDefaultAsync(b => b.Id == boleto.Id);

                if (boletoCompleto == null) return;

                var nomeCliente = boletoCompleto.Contrato?.Cliente?.PessoaFisica?.Nome
                    ?? boletoCompleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial
                    ?? boletoCompleto.PayerName;

                var valor = boletoCompleto.NominalValue;

                // Notificar administradores
                await NotificarAdministradoresAsync(
                    tipo: "BoletoPago",
                    titulo: "💰 Boleto Pago",
                    mensagem: $"Boleto de {nomeCliente} no valor de R$ {valor:N2} foi pago.",
                    prioridade: "Alta",
                    boletoId: boleto.Id,
                    contratoId: boletoCompleto.ContratoId,
                    clienteId: boletoCompleto.Contrato?.ClienteId,
                    link: $"/boletos?id={boleto.Id}"
                );

                // Notificar o consultor responsável (se houver)
                if (boletoCompleto.Contrato?.Consultor != null)
                {
                    // Buscar usuário associado ao consultor através da PessoaFisica
                    var usuarioConsultor = await _context.Usuarios
                        .FirstOrDefaultAsync(u => u.PessoaFisicaId == boletoCompleto.Contrato.Consultor.PessoaFisicaId && u.Ativo);

                    if (usuarioConsultor != null)
                    {
                        await CriarNotificacaoAsync(
                            tipo: "BoletoPago",
                            titulo: "💰 Boleto Pago",
                            mensagem: $"Seu cliente {nomeCliente} pagou o boleto de R$ {valor:N2}.",
                            usuarioId: usuarioConsultor.Id,
                            boletoId: boleto.Id,
                            contratoId: boletoCompleto.ContratoId,
                            clienteId: boletoCompleto.Contrato.ClienteId,
                            prioridade: "Alta",
                            link: $"/boletos?id={boleto.Id}"
                        );
                    }
                }

                _logger.LogInformation($"✅ Notificações de boleto pago enviadas (Boleto ID: {boleto.Id})");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao criar notificação de boleto pago (ID: {boleto.Id})");
            }
        }

        /// <summary>
        /// Notifica quando um boleto vence
        /// </summary>
        public async Task NotificarBoletoVencidoAsync(Boleto boleto)
        {
            try
            {
                var boletoCompleto = await _context.Boletos
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaFisica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Cliente)
                            .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(b => b.Contrato)
                        .ThenInclude(c => c.Consultor)
                    .FirstOrDefaultAsync(b => b.Id == boleto.Id);

                if (boletoCompleto == null) return;

                var nomeCliente = boletoCompleto.Contrato?.Cliente?.PessoaFisica?.Nome
                    ?? boletoCompleto.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial
                    ?? boletoCompleto.PayerName;

                var valor = boletoCompleto.NominalValue;
                var diasAtraso = (DateTime.UtcNow.Date - boletoCompleto.DueDate.Date).Days;

                // Notificar administradores
                await NotificarAdministradoresAsync(
                    tipo: "BoletoVencido",
                    titulo: "⚠️ Boleto Vencido",
                    mensagem: $"Boleto de {nomeCliente} (R$ {valor:N2}) está vencido há {diasAtraso} dia(s).",
                    prioridade: diasAtraso > 30 ? "Urgente" : "Alta",
                    boletoId: boleto.Id,
                    contratoId: boletoCompleto.ContratoId,
                    clienteId: boletoCompleto.Contrato?.ClienteId,
                    link: $"/boletos?id={boleto.Id}"
                );

                // Notificar o consultor responsável
                if (boletoCompleto.Contrato?.Consultor != null)
                {
                    // Buscar usuário associado ao consultor através da PessoaFisica
                    var usuarioConsultor = await _context.Usuarios
                        .FirstOrDefaultAsync(u => u.PessoaFisicaId == boletoCompleto.Contrato.Consultor.PessoaFisicaId && u.Ativo);

                    if (usuarioConsultor != null)
                    {
                        await CriarNotificacaoAsync(
                            tipo: "BoletoVencido",
                            titulo: "⚠️ Boleto Vencido",
                            mensagem: $"Boleto do cliente {nomeCliente} (R$ {valor:N2}) está vencido há {diasAtraso} dia(s).",
                            usuarioId: usuarioConsultor.Id,
                            boletoId: boleto.Id,
                            contratoId: boletoCompleto.ContratoId,
                            clienteId: boletoCompleto.Contrato.ClienteId,
                            prioridade: diasAtraso > 30 ? "Urgente" : "Alta",
                            link: $"/boletos?id={boleto.Id}"
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao criar notificação de boleto vencido (ID: {boleto.Id})");
            }
        }

        /// <summary>
        /// Notifica todos os administradores
        /// </summary>
        public async Task NotificarAdministradoresAsync(
            string tipo,
            string titulo,
            string mensagem,
            string prioridade = "Normal",
            int? boletoId = null,
            int? contratoId = null,
            int? clienteId = null,
            string? link = null)
        {
            // Buscar todos os usuários administradores
            var administradores = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .Where(u => u.Ativo && u.GrupoAcesso != null && u.GrupoAcesso.Nome == "Administrador")
                .ToListAsync();

            foreach (var admin in administradores)
            {
                await CriarNotificacaoAsync(
                    tipo: tipo,
                    titulo: titulo,
                    mensagem: mensagem,
                    usuarioId: admin.Id,
                    boletoId: boletoId,
                    contratoId: contratoId,
                    clienteId: clienteId,
                    prioridade: prioridade,
                    link: link
                );
            }

            _logger.LogInformation($"📢 Notificação enviada para {administradores.Count} administrador(es)");
        }
    }
}
