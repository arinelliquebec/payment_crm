-- Remover índice único do e-mail de Pessoa Jurídica
-- Executar este script diretamente no banco

PRINT 'Verificando índice IX_PessoasJuridicas_Email...';

IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_PessoasJuridicas_Email' 
           AND object_id = OBJECT_ID('PessoasJuridicas')
           AND is_unique = 1)
BEGIN
    PRINT 'Removendo índice único...';
    DROP INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas];
    
    PRINT 'Recriando índice sem flag único...';
    CREATE INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas] ([Email]);
    
    PRINT '✅ Índice atualizado com sucesso!';
    PRINT 'Agora múltiplas empresas podem usar o mesmo e-mail.';
END
ELSE IF EXISTS (SELECT * FROM sys.indexes 
                WHERE name = 'IX_PessoasJuridicas_Email' 
                AND object_id = OBJECT_ID('PessoasJuridicas')
                AND is_unique = 0)
BEGIN
    PRINT '✅ Índice já está correto (não único). Nada a fazer.';
END
ELSE
BEGIN
    PRINT 'Criando índice não único...';
    CREATE INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas] ([Email]);
    PRINT '✅ Índice criado com sucesso!';
END
GO

-- Verificação final
PRINT '';
PRINT 'Verificação:';
SELECT 
    i.name AS IndexName,
    i.is_unique AS IsUnique,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('PessoasJuridicas')
AND i.name = 'IX_PessoasJuridicas_Email';
GO

