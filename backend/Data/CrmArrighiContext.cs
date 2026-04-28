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
        public DbSet<HistoricoConsultor> HistoricoConsultores { get; set; }
        public DbSet<Filial> Filiais { get; set; }
        public DbSet<Consultor> Consultores { get; set; }
        public DbSet<Parceiro> Parceiros { get; set; }
        public DbSet<Contrato> Contratos { get; set; }
        public DbSet<HistoricoSituacaoContrato> HistoricoSituacaoContratos { get; set; }

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
                .HasIndex(p => p.Email)
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

            modelBuilder.Entity<PessoaJuridica>()
                .HasIndex(p => p.Email)
                .IsUnique();

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

            // Configurar precisão para ValorContrato
            modelBuilder.Entity<Cliente>()
                .Property(c => c.ValorContrato)
                .HasPrecision(18, 2); // 18 dígitos total, 2 casas decimais

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
        }
    }
}