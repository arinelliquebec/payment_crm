-- ============================================
-- Script para REMOVER constraint de unicidade do e-mail de Pessoa Jurídica
-- ============================================
-- 
-- MOTIVO DA MUDANÇA:
-- Empresas do mesmo grupo empresarial precisam usar o mesmo e-mail corporativo
-- para receber boletos e comunicações.
-- 
-- Exemplo: ANFOLABOR tem múltiplas empresas (ANFOLABOR ARMAZENAGEM, 
-- ANFOLABOR QUÍMICA) que querem usar ih@anfolabor.com.br
-- 
-- SEGURANÇA MANTIDA:
-- - CNPJ continua sendo único (identificação fiscal)
-- - E-mail de PJ NÃO é usado para autenticação
-- - Usuários têm login e e-mail próprios (únicos) na tabela Usuarios
-- - Cada empresa ainda tem seu CNPJ único como identificador principal
-- 
-- Execute este script no banco de dados Azure SQL
-- ============================================

PRINT '=== Removendo constraint de unicidade do e-mail de Pessoa Jurídica ===';
PRINT '';

-- Verificar se o índice existe antes de tentar remover
IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_PessoasJuridicas_Email' 
           AND object_id = OBJECT_ID('PessoasJuridicas'))
BEGIN
    PRINT 'Removendo índice único IX_PessoasJuridicas_Email...';
    DROP INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas];
    PRINT '✅ Índice único removido com sucesso!';
    PRINT '';
    PRINT '💡 Agora múltiplas empresas podem usar o mesmo e-mail corporativo.';
END
ELSE
BEGIN
    PRINT '⚠️ Índice IX_PessoasJuridicas_Email não existe ou já foi removido.';
END
GO

PRINT '';
PRINT '=== Verificando integridade do banco ===';
PRINT '';

-- Verificar se CNPJ ainda é único (deve ser!)
IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_PessoasJuridicas_Cnpj' 
           AND object_id = OBJECT_ID('PessoasJuridicas')
           AND is_unique = 1)
BEGIN
    PRINT '✅ CNPJ continua sendo único (correto)';
END
ELSE
BEGIN
    PRINT '❌ ATENÇÃO: CNPJ não está configurado como único!';
END
GO

PRINT '';
PRINT '=== Estatísticas após mudança ===';
PRINT '';

-- Mostrar quantas empresas usam o mesmo e-mail
SELECT 
    Email,
    COUNT(*) as QuantidadeEmpresas,
    STRING_AGG(RazaoSocial, ' | ') as Empresas
FROM [PessoasJuridicas]
GROUP BY Email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

PRINT '';
PRINT '=== Mudança concluída com sucesso! ===';
PRINT '';
PRINT 'Próximos passos:';
PRINT '1. Deploy da aplicação com o código atualizado';
PRINT '2. Cadastrar empresas do mesmo grupo com o mesmo e-mail';
PRINT '3. Testar envio de boletos para e-mails compartilhados';
PRINT '';

