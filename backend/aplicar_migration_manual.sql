-- Script para aplicar manualmente a migration de remoção de e-mail único
-- E marcar as migrations como aplicadas

BEGIN TRANSACTION;

-- 1. Remover índice único do e-mail de Pessoa Jurídica
PRINT 'Aplicando mudança de e-mail de Pessoa Jurídica...';

IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_PessoasJuridicas_Email' 
           AND object_id = OBJECT_ID('PessoasJuridicas')
           AND is_unique = 1)
BEGIN
    PRINT '  - Removendo índice único...';
    DROP INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas];
    
    PRINT '  - Recriando índice sem flag único...';
    CREATE INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas] ([Email]);
    
    PRINT '  ✅ Índice atualizado!';
END
ELSE IF EXISTS (SELECT * FROM sys.indexes 
                WHERE name = 'IX_PessoasJuridicas_Email' 
                AND object_id = OBJECT_ID('PessoasJuridicas'))
BEGIN
    PRINT '  ⚠️ Índice já existe. Verificando se é único...';
    
    IF EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_PessoasJuridicas_Email' 
               AND object_id = OBJECT_ID('PessoasJuridicas')
               AND is_unique = 0)
    BEGIN
        PRINT '  ✅ Índice já está correto (não único).';
    END
END
ELSE
BEGIN
    PRINT '  - Criando índice não único...';
    CREATE INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas] ([Email]);
    PRINT '  ✅ Índice criado!';
END

-- 2. Registrar a migration como aplicada
PRINT '';
PRINT 'Registrando migration no histórico...';

IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20251127123206_RemoverEmailUnicoPJ')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20251127123206_RemoverEmailUnicoPJ', '9.0.7');
    PRINT '✅ Migration registrada no histórico!';
END
ELSE
BEGIN
    PRINT '⚠️ Migration já estava registrada.';
END

COMMIT TRANSACTION;

PRINT '';
PRINT '==============================================';
PRINT '✅ Aplicação concluída com sucesso!';
PRINT '==============================================';
PRINT '';
PRINT 'Agora você pode cadastrar múltiplas empresas';
PRINT 'com o mesmo e-mail corporativo.';
PRINT '';

-- Verificação final
PRINT 'Verificação do índice:';
SELECT 
    i.name AS NomeIndice,
    CASE WHEN i.is_unique = 1 THEN 'SIM (❌)' ELSE 'NÃO (✅)' END AS Unico,
    c.name AS Coluna
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('PessoasJuridicas')
AND i.name = 'IX_PessoasJuridicas_Email';

