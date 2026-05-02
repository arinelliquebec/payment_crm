using Microsoft.EntityFrameworkCore;
using CrmArrighi.Models;

namespace CrmArrighi.Data
{
    public class CrmArrighiContext : DbContext
    {
        public CrmArrighiContext(DbContextOptions<CrmArrighiContext> options)
            : base(options)
        {
        }

        public DbSet<PessoaFisica> PessoasFisicas { get; set; }
        public DbSet<PessoaJuridica> PessoasJuridicas { get; set; }
        public DbSet<Endereco> Enderecos { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<HistoricoCliente> HistoricoClientes { get; set; }
        public DbSet<HistoricoConsultor> HistoricoConsultores { get; set; }
        public DbSet<Filial> Filiais { get; set; }
        public DbSet<Consultor> Consultores { get; set; }
        public DbSet<Parceiro> Parceiros { get; set; }
        public DbSet<Contrato> Contratos { get; set; }
        public DbSet<HistoricoSituacaoContrato> HistoricoSituacaoContratos { get; set; }
        public DbSet<Boleto> Boletos { get; set; }
        public DbSet<GrupoAcesso> GruposAcesso { get; set; }
        public DbSet<Permissao> Permissoes { get; set; }
        public DbSet<PermissaoGrupo> PermissoesGrupos { get; set; }
        public DbSet<SessaoAtiva> SessoesAtivas { get; set; }
        public DbSet<PasswordReset> PasswordResets { get; set; }
        public DbSet<LogAtividade> LogsAtividades { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<LogGeracaoBoleto> LogsGeracaoBoletos { get; set; }
        public DbSet<Notificacao> Notificacoes { get; set; }
        public DbSet<Lead> Leads { get; set; }
        public DbSet<LeadInteracao> LeadInteracoes { get; set; }
        public DbSet<IdempotencyKey> IdempotencyKeys { get; set; }

        // Portal do Cliente
        public DbSet<CredencialPortalCliente> CredenciaisPortalCliente { get; set; }
        public DbSet<ConvitePortal> ConvitesPortal { get; set; }

        // Documentos do Portal
        public DbSet<DocumentoPortal> DocumentosPortal { get; set; }

        // Funcionários
        public DbSet<PessoaFuncionario> PessoasFuncionarios { get; set; }
        public DbSet<Funcionario> Funcionarios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurações para PessoaFisica
            modelBuilder.Entity<PessoaFisica>()
                .HasOne(p => p.Endereco)
                .WithMany()
                .HasForeignKey(p => p.EnderecoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PessoaFisica>()
                .HasIndex(p => p.Cpf)
                .IsUnique();

            modelBuilder.Entity<PessoaFisica>()
                .HasIndex(p => p.EmailEmpresarial)
                .IsUnique();

            // Configurações para PessoaJuridica
            modelBuilder.Entity<PessoaJuridica>()
                .HasOne(p => p.Endereco)
                .WithMany()
                .HasForeignKey(p => p.EnderecoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PessoaJuridica>()
                .HasOne(p => p.ResponsavelTecnico)
                .WithMany()
                .HasForeignKey(p => p.ResponsavelTecnicoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PessoaJuridica>()
                .HasIndex(p => p.Cnpj)
                .IsUnique();

            // ✅ E-mail de PJ NÃO é mais único para permitir grupos empresariais
            // Empresas do mesmo grupo podem compartilhar o mesmo e-mail corporativo
            // CNPJ continua sendo único (identificação fiscal)
            // Segurança: E-mail de PJ não é usado para autenticação (Usuario tem login próprio)
            modelBuilder.Entity<PessoaJuridica>()
                .HasIndex(p => p.Email);
            // .IsUnique(); // ❌ REMOVIDO - permite múltiplas empresas com mesmo e-mail

            // Configurações para Usuario
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Login)
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Relacionamento Usuario com PessoaFisica
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.PessoaFisica)
                .WithMany()
                .HasForeignKey(u => u.PessoaFisicaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacionamento Usuario com PessoaJuridica
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.PessoaJuridica)
                .WithMany()
                .HasForeignKey(u => u.PessoaJuridicaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configurações para Endereco
            modelBuilder.Entity<Endereco>()
                .Property(e => e.Cep)
                .HasMaxLength(9);

            // Configurações para Cliente
            modelBuilder.Entity<Cliente>()
                .HasOne(c => c.PessoaFisica)
                .WithMany()
                .HasForeignKey(c => c.PessoaFisicaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cliente>()
                .HasOne(c => c.PessoaJuridica)
                .WithMany()
                .HasForeignKey(c => c.PessoaJuridicaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cliente>()
                .HasOne(c => c.Filial)
                .WithMany()
                .HasForeignKey(c => c.FilialId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false); // Permitir null temporariamente

            // Configurações para HistoricoCliente
            modelBuilder.Entity<HistoricoCliente>()
                .HasOne(h => h.Cliente)
                .WithMany()
                .HasForeignKey(h => h.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HistoricoCliente>()
                .HasOne(h => h.Usuario)
                .WithMany()
                .HasForeignKey(h => h.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HistoricoCliente>()
                .HasIndex(h => h.ClienteId);

            modelBuilder.Entity<HistoricoCliente>()
                .HasIndex(h => h.UsuarioId);

            modelBuilder.Entity<HistoricoCliente>()
                .HasIndex(h => h.DataHora);

            // Configurações para HistoricoConsultor
            modelBuilder.Entity<HistoricoConsultor>()
                .HasOne(h => h.Cliente)
                .WithMany()
                .HasForeignKey(h => h.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configurações para Filial
            modelBuilder.Entity<Filial>()
                .HasIndex(f => f.Nome)
                .IsUnique();

            // Configurações para Consultor
            modelBuilder.Entity<Consultor>()
                .HasOne(c => c.PessoaFisica)
                .WithMany()
                .HasForeignKey(c => c.PessoaFisicaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Consultor>()
                .HasOne(c => c.Filial)
                .WithMany()
                .HasForeignKey(c => c.FilialId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Consultor>()
                .HasIndex(c => c.PessoaFisicaId)
                .IsUnique();

            // Configurações para Parceiro
            modelBuilder.Entity<Parceiro>()
                .HasOne(p => p.PessoaFisica)
                .WithMany()
                .HasForeignKey(p => p.PessoaFisicaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Parceiro>()
                .HasOne(p => p.Filial)
                .WithMany()
                .HasForeignKey(p => p.FilialId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Parceiro>()
                .HasIndex(p => p.PessoaFisicaId)
                .IsUnique();

            // Configurações para Contrato
            modelBuilder.Entity<Contrato>()
                .HasOne(c => c.Cliente)
                .WithMany()
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Contrato>()
                .HasOne(c => c.Consultor)
                .WithMany()
                .HasForeignKey(c => c.ConsultorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configurações para HistoricoSituacaoContrato
            modelBuilder.Entity<HistoricoSituacaoContrato>()
                .HasOne(h => h.Contrato)
                .WithMany()
                .HasForeignKey(h => h.ContratoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configurações para Boleto
            modelBuilder.Entity<Boleto>()
                .HasOne(b => b.Contrato)
                .WithMany()
                .HasForeignKey(b => b.ContratoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Índice único para NSU Code + NSU Date (um boleto por dia por NSU)
            modelBuilder.Entity<Boleto>()
                .HasIndex(b => new { b.NsuCode, b.NsuDate })
                .IsUnique();

            // Configurar precisão para valores monetários
            modelBuilder.Entity<Boleto>()
                .Property(b => b.NominalValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Boleto>()
                .Property(b => b.FinePercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<Boleto>()
                .Property(b => b.InterestPercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<Boleto>()
                .Property(b => b.DeductionValue)
                .HasPrecision(18, 2);

            // Configurações para GrupoAcesso
            modelBuilder.Entity<GrupoAcesso>()
                .HasIndex(g => g.Nome)
                .IsUnique();

            // Configurações para Permissao
            modelBuilder.Entity<Permissao>()
                .HasIndex(p => new { p.Modulo, p.Acao })
                .IsUnique();

            // Configurações para PermissaoGrupo
            modelBuilder.Entity<PermissaoGrupo>()
                .HasIndex(pg => new { pg.GrupoAcessoId, pg.PermissaoId })
                .IsUnique();

            modelBuilder.Entity<PermissaoGrupo>()
                .HasOne(pg => pg.GrupoAcesso)
                .WithMany(g => g.Permissoes)
                .HasForeignKey(pg => pg.GrupoAcessoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PermissaoGrupo>()
                .HasOne(pg => pg.Permissao)
                .WithMany(p => p.PermissaoGrupos)
                .HasForeignKey(pg => pg.PermissaoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configurações adicionais para Usuario
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.GrupoAcesso)
                .WithMany(g => g.Usuarios)
                .HasForeignKey(u => u.GrupoAcessoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Filial)
                .WithMany()
                .HasForeignKey(u => u.FilialId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Consultor)
                .WithMany()
                .HasForeignKey(u => u.ConsultorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configurações para PasswordReset
            modelBuilder.Entity<PasswordReset>()
                .HasOne(pr => pr.Usuario)
                .WithMany()
                .HasForeignKey(pr => pr.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PasswordReset>()
                .HasIndex(pr => pr.Token)
                .IsUnique();

            // Configurações para LogGeracaoBoleto
            modelBuilder.Entity<LogGeracaoBoleto>()
                .HasOne(l => l.Usuario)
                .WithMany()
                .HasForeignKey(l => l.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LogGeracaoBoleto>()
                .Property(l => l.ValorTotalGerado)
                .HasPrecision(18, 2);

            modelBuilder.Entity<LogGeracaoBoleto>()
                .HasIndex(l => l.DataExecucao);

            // Configurações para Notificacao
            modelBuilder.Entity<Notificacao>()
                .HasOne(n => n.Usuario)
                .WithMany()
                .HasForeignKey(n => n.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notificacao>()
                .HasOne(n => n.Boleto)
                .WithMany()
                .HasForeignKey(n => n.BoletoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notificacao>()
                .HasOne(n => n.Contrato)
                .WithMany()
                .HasForeignKey(n => n.ContratoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notificacao>()
                .HasOne(n => n.Cliente)
                .WithMany()
                .HasForeignKey(n => n.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notificacao>()
                .HasIndex(n => n.UsuarioId);

            modelBuilder.Entity<Notificacao>()
                .HasIndex(n => n.DataCriacao);

            modelBuilder.Entity<Notificacao>()
                .HasIndex(n => n.Lida);

            // ── Portal do Cliente: CredenciaisPortalCliente ──────────────────
            modelBuilder.Entity<CredencialPortalCliente>()
                .ToTable("CredenciaisPortalCliente");

            modelBuilder.Entity<CredencialPortalCliente>()
                .HasIndex(c => c.Documento)
                .IsUnique();

            modelBuilder.Entity<CredencialPortalCliente>()
                .HasIndex(c => c.ClienteId);

            modelBuilder.Entity<CredencialPortalCliente>()
                .HasIndex(c => c.TokenAcesso)
                .HasFilter("[TokenAcesso] IS NOT NULL");

            modelBuilder.Entity<CredencialPortalCliente>()
                .HasOne(c => c.Cliente)
                .WithMany()
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Documentos do Portal ──────────────────────────────────────────
            modelBuilder.Entity<DocumentoPortal>()
                .ToTable("DocumentosPortal");

            modelBuilder.Entity<DocumentoPortal>()
                .HasIndex(d => d.ClienteId);

            modelBuilder.Entity<DocumentoPortal>()
                .HasIndex(d => d.Tipo);

            modelBuilder.Entity<DocumentoPortal>()
                .HasIndex(d => d.DataUpload);

            modelBuilder.Entity<DocumentoPortal>()
                .HasOne(d => d.Cliente)
                .WithMany()
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Funcionários ────────────────────────────────────────────
            modelBuilder.Entity<PessoaFuncionario>()
                .ToTable("PessoasFuncionarios");

            modelBuilder.Entity<Funcionario>()
                .ToTable("Funcionarios");

            modelBuilder.Entity<Funcionario>()
                .HasOne(c => c.PessoaFisica)
                .WithMany()
                .HasForeignKey(c => c.PessoaFisicaId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── AuditLogs ──────────────────────────────────────────────
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.UsuarioId);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.DataHora);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Acao);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Entidade);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Severidade);

            // Ignorar navigation property - sem FK restritiva para permitir UsuarioId=0 em logs de login falho
            modelBuilder.Entity<AuditLog>()
                .Ignore(a => a.Usuario);
        }
    }
}