using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Utils
{
    /// <summary>
    /// Helper para garantir que o grupo Administrador esteja configurado corretamente
    /// </summary>
    public static class AdminGroupHelper
    {
        /// <summary>
        /// Garante que o grupo Administrador existe e está configurado corretamente
        /// </summary>
        public static async Task EnsureAdminGroupIsCorrectAsync(CrmArrighiContext context)
        {
            try
            {
                Console.WriteLine("🔍 Verificando configuração do grupo Administrador...");

                // 1. Verificar se existe algum grupo com nome parecido com "Administrador"
                var gruposAdmin = await context.GruposAcesso
                    .Where(g => EF.Functions.Like(g.Nome, "%Admin%"))
                    .ToListAsync();

                if (gruposAdmin.Count == 0)
                {
                    // Criar grupo Administrador se não existir
                    Console.WriteLine("⚠️ Grupo Administrador não encontrado. Criando...");

                    var novoGrupo = new GrupoAcesso
                    {
                        Nome = "Administrador",
                        Descricao = "Grupo com acesso total ao sistema",
                        Ativo = true,
                        DataCadastro = DateTime.UtcNow
                    };

                    context.GruposAcesso.Add(novoGrupo);
                    await context.SaveChangesAsync();

                    Console.WriteLine($"✅ Grupo Administrador criado com ID: {novoGrupo.Id}");
                    return;
                }

                // 2. Verificar se existe um grupo com nome exatamente "Administrador"
                var grupoCorreto = gruposAdmin.FirstOrDefault(g => g.Nome == "Administrador");

                if (grupoCorreto != null)
                {
                    Console.WriteLine($"✅ Grupo Administrador encontrado (ID: {grupoCorreto.Id}) - Configuração correta!");

                    // Verificar quantos usuários são administradores
                    var countAdmins = await context.Usuarios
                        .Where(u => u.GrupoAcessoId == grupoCorreto.Id && u.Ativo)
                        .CountAsync();

                    Console.WriteLine($"📊 Total de administradores ativos: {countAdmins}");
                    return;
                }

                // 3. Se não existe grupo com nome exato, corrigir o primeiro encontrado
                var grupoParaCorrigir = gruposAdmin.First();
                var nomeAntigo = grupoParaCorrigir.Nome;

                Console.WriteLine($"⚠️ Grupo encontrado com nome incorreto: '{nomeAntigo}'");
                Console.WriteLine($"🔧 Corrigindo para 'Administrador'...");

                grupoParaCorrigir.Nome = "Administrador";
                grupoParaCorrigir.DataAtualizacao = DateTime.UtcNow;

                await context.SaveChangesAsync();

                Console.WriteLine($"✅ Grupo corrigido! ID: {grupoParaCorrigir.Id}");

                // Verificar quantos usuários foram afetados
                var countUsuarios = await context.Usuarios
                    .Where(u => u.GrupoAcessoId == grupoParaCorrigir.Id && u.Ativo)
                    .CountAsync();

                Console.WriteLine($"📊 Usuários afetados pela correção: {countUsuarios}");

                // 4. Se existem múltiplos grupos Admin, consolidar
                if (gruposAdmin.Count > 1)
                {
                    Console.WriteLine($"⚠️ Encontrados {gruposAdmin.Count} grupos Admin. Consolidando...");

                    var grupoCorretoId = grupoParaCorrigir.Id;
                    var gruposParaRemover = gruposAdmin.Where(g => g.Id != grupoCorretoId).ToList();

                    foreach (var grupoExtra in gruposParaRemover)
                    {
                        // Mover usuários para o grupo correto
                        var usuariosParaMover = await context.Usuarios
                            .Where(u => u.GrupoAcessoId == grupoExtra.Id)
                            .ToListAsync();

                        foreach (var usuario in usuariosParaMover)
                        {
                            usuario.GrupoAcessoId = grupoCorretoId;
                        }

                        Console.WriteLine($"📦 Movendo {usuariosParaMover.Count} usuários do grupo '{grupoExtra.Nome}' (ID: {grupoExtra.Id})");

                        // Desativar grupo extra ao invés de deletar (para manter histórico)
                        grupoExtra.Ativo = false;
                        grupoExtra.Nome = $"{grupoExtra.Nome}_DEPRECATED_{grupoExtra.Id}";
                    }

                    await context.SaveChangesAsync();
                    Console.WriteLine("✅ Consolidação concluída!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao verificar grupo Administrador: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

        /// <summary>
        /// Verifica e lista todos os administradores do sistema
        /// </summary>
        public static async Task ListAdministratorsAsync(CrmArrighiContext context)
        {
            try
            {
                var grupoAdmin = await context.GruposAcesso
                    .FirstOrDefaultAsync(g => g.Nome == "Administrador");

                if (grupoAdmin == null)
                {
                    Console.WriteLine("⚠️ Grupo Administrador não encontrado!");
                    return;
                }

                var administradores = await context.Usuarios
                    .Where(u => u.GrupoAcessoId == grupoAdmin.Id && u.Ativo)
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .ToListAsync();

                Console.WriteLine($"\n📋 Lista de Administradores ({administradores.Count}):");
                Console.WriteLine("═══════════════════════════════════════════════════════");

                foreach (var admin in administradores)
                {
                    var nome = admin.PessoaFisica?.Nome
                        ?? admin.PessoaJuridica?.RazaoSocial
                        ?? admin.Login;

                    Console.WriteLine($"  • ID: {admin.Id} | Login: {admin.Login} | Nome: {nome}");
                    Console.WriteLine($"    Email: {admin.Email}");

                    if (admin.UltimoAcesso.HasValue)
                    {
                        Console.WriteLine($"    Último acesso: {admin.UltimoAcesso.Value:dd/MM/yyyy HH:mm:ss}");
                    }

                    Console.WriteLine();
                }

                Console.WriteLine("═══════════════════════════════════════════════════════\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao listar administradores: {ex.Message}");
            }
        }

        /// <summary>
        /// Promove um usuário para administrador
        /// </summary>
        public static async Task PromoteUserToAdminAsync(CrmArrighiContext context, int userId)
        {
            try
            {
                var usuario = await context.Usuarios
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (usuario == null)
                {
                    Console.WriteLine($"❌ Usuário com ID {userId} não encontrado!");
                    return;
                }

                var grupoAdmin = await context.GruposAcesso
                    .FirstOrDefaultAsync(g => g.Nome == "Administrador");

                if (grupoAdmin == null)
                {
                    Console.WriteLine("❌ Grupo Administrador não encontrado!");
                    return;
                }

                if (usuario.GrupoAcessoId == grupoAdmin.Id)
                {
                    Console.WriteLine($"ℹ️ Usuário '{usuario.Login}' já é administrador!");
                    return;
                }

                var nomeUsuario = usuario.PessoaFisica?.Nome
                    ?? usuario.PessoaJuridica?.RazaoSocial
                    ?? usuario.Login;

                usuario.GrupoAcessoId = grupoAdmin.Id;
                await context.SaveChangesAsync();

                Console.WriteLine($"✅ Usuário '{nomeUsuario}' (Login: {usuario.Login}) promovido para Administrador!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao promover usuário: {ex.Message}");
            }
        }
    }
}
