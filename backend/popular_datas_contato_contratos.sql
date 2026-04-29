-- =========================================
-- SCRIPT PARA POPULAR DATAS DE CONTATO EM CONTRATOS EXISTENTES
-- Execute este script diretamente no banco de dados
-- =========================================

-- 1. Verificar contratos sem DataUltimoContato
SELECT COUNT(*) as ContratosSemDataUltimoContato
FROM Contratos
WHERE DataUltimoContato IS NULL;

-- 2. Verificar contratos sem DataProximoContato
SELECT COUNT(*) as ContratosSemDataProximoContato
FROM Contratos
WHERE DataProximoContato IS NULL;

-- 3. Atualizar contratos sem DataUltimoContato (definir como 2 dias atrás)
UPDATE Contratos
SET DataUltimoContato = DATEADD(day, -2, GETUTCDATE())
WHERE DataUltimoContato IS NULL;

PRINT 'Contratos sem DataUltimoContato atualizados com sucesso';

-- 4. Atualizar contratos sem DataProximoContato (definir como 5 dias à frente)
UPDATE Contratos
SET DataProximoContato = DATEADD(day, 5, GETUTCDATE())
WHERE DataProximoContato IS NULL;

PRINT 'Contratos sem DataProximoContato atualizados com sucesso';

-- 5. Verificar resultado final
SELECT
    COUNT(*) as TotalContratos,
    COUNT(CASE WHEN DataUltimoContato IS NOT NULL THEN 1 END) as ComDataUltimoContato,
    COUNT(CASE WHEN DataProximoContato IS NOT NULL THEN 1 END) as ComDataProximoContato
FROM Contratos;

PRINT '=== SCRIPT EXECUTADO COM SUCESSO ===';
PRINT 'Todos os contratos agora têm DataUltimoContato e DataProximoContato preenchidos';
PRINT 'Agora você pode testar a visualização de contratos no frontend';
