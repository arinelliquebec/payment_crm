-- =========================================
-- SCRIPT PARA RESTAURAR DADOS ORIGINAIS DE CONTRATOS AFETADOS
-- Remove alterações feitas pelos scripts anteriores e restaura valores originais
-- =========================================

PRINT '=== VERIFICAÇÃO ANTES DE RESTAURAR ===';

-- 1. Ver contratos que podem ter sido afetados (com dados suspeitos)
SELECT TOP 10
    Id,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    AnexoDocumento,
    Pendencias,
    ValorDevido,
    DataAtualizacao
FROM Contratos
WHERE (ValorEntrada = 0 AND ValorDevido > 0)  -- Entrada zerada mas valor devido existe
   OR (ValorParcela = 0 AND NumeroParcelas > 0)  -- Parcela zerada mas parcelas existem
   OR (NumeroParcelas = 12)  -- Número padrão definido pelo script
   OR (TipoServico = 'Serviço Jurídico')  -- Tipo padrão definido pelo script
   OR (AnexoDocumento = 'Não informado')  -- Anexo padrão definido pelo script
   OR (Pendencias = 'Nenhuma pendência')  -- Pendências padrão definido pelo script
ORDER BY DataAtualizacao DESC;

PRINT 'Contratos que podem ter sido afetados identificados';

-- 2. AVISO IMPORTANTE - Este script restaura valores originais
-- Execute apenas se tiver certeza de que quer reverter as alterações

-- Para contratos específicos, você precisaria executar UPDATEs manuais
-- Exemplo para contrato #34:
-- UPDATE Contratos SET ValorEntrada = valor_original, ValorParcela = valor_original, ... WHERE Id = 34

PRINT '=== INSTRUÇÕES PARA RESTAURAÇÃO MANUAL ===';
PRINT 'Para restaurar dados originais de contratos específicos:';
PRINT '1. Identifique o contrato que quer restaurar';
PRINT '2. Execute UPDATE manual com os valores originais';
PRINT '3. Exemplo: UPDATE Contratos SET ValorEntrada = 1000.00, ValorParcela = 4000.00 WHERE Id = 34';
PRINT '';
PRINT 'Execute o script verificar_contrato_34.sql primeiro para ver os dados atuais';
