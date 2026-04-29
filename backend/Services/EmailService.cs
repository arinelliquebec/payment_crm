using System.Net;
using System.Net.Mail;

namespace CrmArrighi.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendPasswordResetEmail(string toEmail, string userName, string resetLink)
        {
            string subject = "Reset de Senha - CRM Arrighi Tributário";
            string htmlBody = $@"
                <!DOCTYPE html>
                <html lang='pt-BR'>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <style>
                        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #1a1a1a;
                            background-color: #f5f7fa;
                            padding: 20px;
                        }}
                        .email-container {{
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                            border: 1px solid #e5e7eb;
                        }}
                        .header {{
                            background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
                            padding: 32px 24px;
                            text-align: center;
                            border-bottom: 3px solid #1e40af;
                        }}
                        .header h1 {{
                            color: #ffffff;
                            font-size: 26px;
                            font-weight: 700;
                            margin: 0;
                            letter-spacing: -0.5px;
                        }}
                        .header p {{
                            color: #bfdbfe;
                            font-size: 14px;
                            margin-top: 8px;
                        }}
                        .content {{
                            background-color: #ffffff;
                            padding: 40px 32px;
                        }}
                        .greeting {{
                            color: #1e3a5f;
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 24px;
                        }}
                        .content p {{
                            color: #374151;
                            font-size: 15px;
                            margin-bottom: 16px;
                            line-height: 1.7;
                        }}
                        .content strong {{
                            color: #1e40af;
                            font-weight: 600;
                        }}
                        .button-container {{
                            text-align: center;
                            margin: 32px 0;
                        }}
                        .button {{
                            display: inline-block;
                            padding: 16px 40px;
                            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                            color: #ffffff !important;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            font-size: 16px;
                            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
                            letter-spacing: 0.3px;
                        }}
                        .link-box {{
                            background-color: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            padding: 16px;
                            margin: 24px 0;
                            word-break: break-all;
                            font-family: 'Courier New', monospace;
                            font-size: 13px;
                            color: #2563eb;
                            text-align: center;
                            line-height: 1.6;
                        }}
                        .warning-box {{
                            background-color: #fef3c7;
                            border-left: 4px solid #f59e0b;
                            padding: 16px;
                            margin: 24px 0;
                            border-radius: 0 6px 6px 0;
                        }}
                        .warning-box p {{
                            color: #92400e;
                            font-size: 14px;
                            margin: 0;
                        }}
                        .info-box {{
                            background-color: #f1f5f9;
                            border-left: 4px solid #64748b;
                            padding: 16px;
                            margin: 24px 0;
                            border-radius: 0 6px 6px 0;
                        }}
                        .info-box p {{
                            color: #475569;
                            font-size: 14px;
                            margin: 0;
                        }}
                        .footer {{
                            text-align: center;
                            padding: 24px 32px;
                            background-color: #1e3a5f;
                            font-size: 12px;
                            color: #ffffff;
                        }}
                        .footer p {{
                            margin: 4px 0;
                            color: #bfdbfe;
                        }}
                        .footer strong {{
                            color: #ffffff;
                        }}
                        .logo {{
                            display: inline-block;
                            width: 48px;
                            height: 48px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            margin-bottom: 16px;
                            line-height: 48px;
                            font-size: 24px;
                            color: #1e3a5f;
                            font-weight: bold;
                        }}
                        @media only screen and (max-width: 600px) {{
                            .email-container {{
                                border-radius: 0;
                            }}
                            .content {{
                                padding: 24px 20px;
                            }}
                            .header {{
                                padding: 24px 20px;
                            }}
                            .button {{
                                padding: 14px 32px;
                                font-size: 15px;
                            }}
                        }}
                    </style>
                </head>
                <body>
                    <div class='email-container'>
                        <div class='header'>
                            <div class='logo'>⚖</div>
                            <h1>Reset de Senha</h1>
                            <p>CRM Arrighi Tributário</p>
                        </div>
                        <div class='content'>
                            <p class='greeting'>Olá, <strong>{userName}</strong>!</p>
                            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>CRM Arrighi Tributário</strong>.</p>
                            <p>Para criar uma nova senha, clique no botão abaixo:</p>
                            <div class='button-container'>
                                <a href='{resetLink}' class='button'>Redefinir Senha</a>
                            </div>
                            <div class='info-box'>
                                <p><strong>Ou copie e cole o link abaixo no seu navegador:</strong></p>
                            </div>
                            <div class='link-box'>
                                {resetLink}
                            </div>
                            <div class='warning-box'>
                                <p><strong>⏰ Importante:</strong> Este link expira em 24 horas.</p>
                            </div>
                            <div class='info-box'>
                                <p>Se você não solicitou esta redefinição de senha, ignore este e-mail. Sua senha permanecerá inalterada.</p>
                            </div>
                        </div>
                        <div class='footer'>
                            <p><strong>© 2025 Arrighi Advogados</strong></p>
                            <p>CRM Judiciário v2.0</p>
                            <p style='margin-top: 12px; font-size: 11px; color: #93c5fd;'>Este é um e-mail automático, por favor não responda.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            return await SendEmail(toEmail, subject, htmlBody);
        }

        public async Task<bool> SendEmail(string toEmail, string subject, string htmlBody)
        {
            try
            {
                // Configurações do SMTP - Resend
                var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.resend.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpUsername = _configuration["Email:Username"] ?? "";
                var smtpPassword = _configuration["Email:Password"] ?? "";
                var fromEmail = _configuration["Email:FromEmail"] ?? smtpUsername;
                var fromName = _configuration["Email:FromName"] ?? "Arrighi Advogados";
                var replyTo = _configuration["Email:ReplyTo"] ?? fromEmail;

                if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
                {
                    _logger.LogWarning("⚠️ Email não configurado (Resend). Simulando envio para: {Email}", toEmail);
                    _logger.LogInformation("📧 Assunto: {Subject}", subject);
                    _logger.LogInformation("🔗 Link de reset seria enviado para: {Email}", toEmail);
                    // Em desenvolvimento, apenas loga o email
                    return true;
                }

                using var mail = new MailMessage();
                mail.From = new MailAddress(fromEmail, fromName);
                mail.To.Add(toEmail);
                mail.Subject = subject;
                mail.Body = htmlBody;
                mail.IsBodyHtml = true;

                // Adicionar Reply-To
                if (!string.IsNullOrWhiteSpace(replyTo))
                {
                    mail.ReplyToList.Add(new MailAddress(replyTo));
                }

                using var smtp = new SmtpClient(smtpHost, smtpPort);
                smtp.EnableSsl = true;
                smtp.Credentials = new NetworkCredential(smtpUsername, smtpPassword);

                await smtp.SendMailAsync(mail);
                _logger.LogInformation("✅ Email enviado com sucesso via Resend para: {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao enviar email via Resend para: {Email}", toEmail);
                return false;
            }
        }

        /// <summary>
        /// Envia email com boleto em anexo
        /// </summary>
        public async Task<EnvioEmailBoletoResult> SendBoletoEmail(
            string toEmail,
            string clienteNome,
            decimal valor,
            DateTime vencimento,
            int numeroParcela,
            int? totalParcelas,
            string? linhaDigitavel,
            string? codigoPix,
            byte[] pdfBytes,
            string nomeArquivoPdf)
        {
            try
            {
                // Validar email
                if (string.IsNullOrWhiteSpace(toEmail))
                {
                    _logger.LogWarning("⚠️ Email não informado para cliente: {Cliente}", clienteNome);
                    return new EnvioEmailBoletoResult
                    {
                        Sucesso = false,
                        Erro = "Email não cadastrado",
                        EmailDestino = null
                    };
                }

                // Configurações do SMTP - Resend
                var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.resend.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpUsername = _configuration["Email:Username"] ?? "";
                var smtpPassword = _configuration["Email:Password"] ?? "";
                var fromEmail = _configuration["Email:FromEmail"] ?? smtpUsername;
                var fromName = _configuration["Email:FromName"] ?? "Arrighi Advogados";
                var replyTo = _configuration["Email:ReplyTo"] ?? fromEmail;

                // Mensagem padrão configurável
                var mensagemPadrao = _configuration["Email:MensagemBoletoPadrao"] ??
                    "Em caso de dúvidas, entre em contato conosco pelo email reply@arrighiadvogados.com.br";

                // Formatar parcela
                var parcelaTexto = totalParcelas.HasValue && totalParcelas > 0
                    ? $"{numeroParcela}/{totalParcelas}"
                    : $"{numeroParcela}";

                // Montar assunto
                var subject = $"Boleto - Arrighi Advogados - Vencimento {vencimento:dd/MM/yyyy}";

                // Montar corpo do email
                var htmlBody = MontarHtmlBoleto(
                    clienteNome,
                    valor,
                    vencimento,
                    parcelaTexto,
                    linhaDigitavel,
                    codigoPix,
                    mensagemPadrao);

                if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
                {
                    _logger.LogWarning("⚠️ Resend não configurado. Simulando envio de boleto para: {Email}", toEmail);
                    _logger.LogInformation("📧 Assunto: {Subject}", subject);
                    _logger.LogInformation("📎 Anexo: {Arquivo} ({Size} bytes)", nomeArquivoPdf, pdfBytes.Length);
                    return new EnvioEmailBoletoResult
                    {
                        Sucesso = true,
                        Erro = null,
                        EmailDestino = toEmail
                    };
                }

                using var mail = new MailMessage();
                mail.From = new MailAddress(fromEmail, fromName);
                mail.To.Add(toEmail);
                mail.Subject = subject;
                mail.Body = htmlBody;
                mail.IsBodyHtml = true;

                // Adicionar Reply-To
                if (!string.IsNullOrWhiteSpace(replyTo))
                {
                    mail.ReplyToList.Add(new MailAddress(replyTo));
                }

                // Adicionar PDF como anexo
                using var pdfStream = new MemoryStream(pdfBytes);
                var attachment = new Attachment(pdfStream, nomeArquivoPdf, "application/pdf");
                mail.Attachments.Add(attachment);

                using var smtp = new SmtpClient(smtpHost, smtpPort);
                smtp.EnableSsl = true;
                smtp.Credentials = new NetworkCredential(smtpUsername, smtpPassword);

                await smtp.SendMailAsync(mail);

                _logger.LogInformation("✅ Email de boleto enviado via Resend para: {Email} - Cliente: {Cliente}",
                    toEmail, clienteNome);

                return new EnvioEmailBoletoResult
                {
                    Sucesso = true,
                    Erro = null,
                    EmailDestino = toEmail
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao enviar email de boleto para: {Email} - Cliente: {Cliente}",
                    toEmail, clienteNome);
                return new EnvioEmailBoletoResult
                {
                    Sucesso = false,
                    Erro = ex.Message,
                    EmailDestino = toEmail
                };
            }
        }

        /// <summary>
        /// Monta o HTML do email de boleto
        /// </summary>
        private string MontarHtmlBoleto(
            string clienteNome,
            decimal valor,
            DateTime vencimento,
            string parcelaTexto,
            string? linhaDigitavel,
            string? codigoPix,
            string mensagemPadrao)
        {
            var pixSection = !string.IsNullOrWhiteSpace(codigoPix) ? $@"
                        <div class='info-section'>
                            <h3>📱 PIX (Copia e Cola)</h3>
                            <div class='code-box pix-box'>
                                {codigoPix}
                            </div>
                            <p class='hint'>Copie o código acima e cole no aplicativo do seu banco</p>
                        </div>" : "";

            var linhaDigitavelSection = !string.IsNullOrWhiteSpace(linhaDigitavel) ? $@"
                        <div class='info-section'>
                            <h3>📋 Linha Digitável</h3>
                            <div class='code-box'>
                                {linhaDigitavel}
                            </div>
                            <p class='hint'>Use para pagamento em caixas eletrônicos ou internet banking</p>
                        </div>" : "";

            return $@"
                <!DOCTYPE html>
                <html lang='pt-BR'>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <style>
                        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #1a1a1a;
                            background-color: #f5f7fa;
                            padding: 20px;
                        }}
                        .email-container {{
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                            border: 1px solid #e5e7eb;
                        }}
                        .header {{
                            background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
                            padding: 32px 24px;
                            text-align: center;
                            border-bottom: 3px solid #1e40af;
                        }}
                        .header h1 {{
                            color: #ffffff;
                            font-size: 26px;
                            font-weight: 700;
                            margin: 0;
                        }}
                        .header p {{
                            color: #bfdbfe;
                            font-size: 14px;
                            margin-top: 8px;
                        }}
                        .content {{
                            padding: 32px;
                            background-color: #ffffff;
                        }}
                        .greeting {{
                            color: #1e3a5f;
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 16px;
                        }}
                        .message {{
                            color: #374151;
                            font-size: 15px;
                            margin-bottom: 24px;
                        }}
                        .message strong {{
                            color: #1e40af;
                        }}
                        .boleto-info {{
                            background-color: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            padding: 24px;
                            margin-bottom: 24px;
                        }}
                        .boleto-info-row {{
                            display: flex;
                            justify-content: space-between;
                            padding: 12px 0;
                            border-bottom: 1px solid #e2e8f0;
                        }}
                        .boleto-info-row:last-child {{
                            border-bottom: none;
                        }}
                        .boleto-info-label {{
                            color: #64748b;
                            font-size: 14px;
                        }}
                        .boleto-info-value {{
                            color: #1e293b;
                            font-size: 14px;
                            font-weight: 600;
                        }}
                        .boleto-info-value.destaque {{
                            color: #1e40af;
                            font-size: 20px;
                        }}
                        .info-section {{
                            background-color: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            padding: 20px;
                            margin-bottom: 16px;
                        }}
                        .info-section h3 {{
                            color: #1e3a5f;
                            font-size: 14px;
                            font-weight: 600;
                            margin-bottom: 12px;
                        }}
                        .code-box {{
                            background-color: #ffffff;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            padding: 16px;
                            font-family: 'Courier New', monospace;
                            font-size: 13px;
                            color: #059669;
                            word-break: break-all;
                            text-align: center;
                        }}
                        .pix-box {{
                            font-size: 11px;
                            color: #2563eb;
                        }}
                        .hint {{
                            color: #6b7280;
                            font-size: 12px;
                            margin-top: 8px;
                            text-align: center;
                        }}
                        .mensagem-padrao {{
                            background-color: #eff6ff;
                            border-left: 4px solid #2563eb;
                            padding: 16px;
                            margin: 24px 0;
                            border-radius: 0 6px 6px 0;
                            color: #1e40af;
                            font-size: 14px;
                        }}
                        .anexo-info {{
                            background-color: #ecfdf5;
                            border: 1px solid #10b981;
                            border-radius: 6px;
                            padding: 16px;
                            text-align: center;
                            margin-top: 24px;
                        }}
                        .anexo-info p {{
                            color: #047857;
                            font-size: 14px;
                            margin: 0;
                            font-weight: 500;
                        }}
                        .footer {{
                            text-align: center;
                            padding: 24px;
                            background-color: #1e3a5f;
                            font-size: 12px;
                            color: #ffffff;
                        }}
                        .footer p {{
                            margin: 4px 0;
                            color: #bfdbfe;
                        }}
                        .footer strong {{
                            color: #ffffff;
                        }}
                        .logo {{
                            display: inline-block;
                            width: 48px;
                            height: 48px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            margin-bottom: 16px;
                            line-height: 48px;
                            font-size: 24px;
                            color: #1e3a5f;
                            font-weight: bold;
                        }}
                    </style>
                </head>
                <body>
                    <div class='email-container'>
                        <div class='header'>
                            <div class='logo'>⚖</div>
                            <h1>Boleto Disponível</h1>
                            <p>Arrighi Advogados</p>
                        </div>
                        <div class='content'>
                            <p class='greeting'>Prezado(a) {clienteNome},</p>
                            <p class='message'>Segue em anexo o boleto referente à parcela <strong>{parcelaTexto}</strong>.</p>

                            <div class='boleto-info'>
                                <div class='boleto-info-row'>
                                    <span class='boleto-info-label'>📅 Vencimento</span>
                                    <span class='boleto-info-value'>{vencimento:dd/MM/yyyy}</span>
                                </div>
                                <div class='boleto-info-row'>
                                    <span class='boleto-info-label'>📋 Parcela</span>
                                    <span class='boleto-info-value'>{parcelaTexto}</span>
                                </div>
                                <div class='boleto-info-row'>
                                    <span class='boleto-info-label'>💰 Valor</span>
                                    <span class='boleto-info-value destaque'>R$ {valor:N2}</span>
                                </div>
                            </div>

                            {pixSection}
                            {linhaDigitavelSection}

                            <div class='mensagem-padrao'>
                                {mensagemPadrao}
                            </div>

                            <div class='anexo-info'>
                                <p>📎 O boleto em PDF está anexado a este e-mail</p>
                            </div>
                        </div>
                        <div class='footer'>
                            <p><strong>© 2025 Arrighi Advogados</strong></p>
                            <p style='margin-top: 8px; font-size: 11px; color: #93c5fd;'>Dúvidas? Responda este e-mail ou entre em contato: noreply@arrighiadvogados.com.br</p>
                        </div>
                    </div>
                </body>
                </html>
            ";
        }
    }
}

