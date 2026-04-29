-- ====================================================================
-- CORREÇÃO MANUAL: Marcar LIVIA FREITAS como inativa
-- ====================================================================
-- Execute APENAS após confirmar que ela tem 0 contratos ativos
-- ====================================================================

BEGIN TRANSACTION;

-- Verificar antes de atualizar
SELECT 
    c.Id,
    pf.Nome,
    c.Ativo AS AtivoANTES,
    (SELECT COUNT(*) FROM Contratos WHERE ConsultorId = c.Id AND Ativo = 1) AS ContratosAtivos
FROM Consultores c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Id = 80;

PRINT '';
PRINT 'Marcando LIVIA FREITAS (ID 80) como inativa...';
PRINT '';

-- Atualizar APENAS se não tiver contratos ativos
UPDATE Consultores
SET 
    Ativo = 0,
    DataAtualizacao = GETDATE()
WHERE Id = 80
  AND NOT EXISTS (
    SELECT 1 
    FROM Contratos 
    WHERE ConsultorId = 80 AND Ativo = 1
  );

IF @@ROWCOUNT > 0
BEGIN
    PRINT '✅ LIVIA FREITAS marcada como inativa com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Nenhuma linha atualizada. Consultor pode ter contratos vinculados.';
END

-- Verificar depois
SELECT 
    c.Id,
    pf.Nome,
    c.Ativo AS AtivoDEPOIS,
    c.DataAtualizacao,
    (SELECT COUNT(*) FROM Contratos WHERE ConsultorId = c.Id AND Ativo = 1) AS ContratosAtivos
FROM Consultores c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Id = 80;

COMMIT TRANSACTION;

PRINT '';
PRINT '====================================================================';
PRINT 'Aguarde o deploy da correção do backend para que futuras exclusões';
PRINT 'funcionem automaticamente via API';
PRINT '====================================================================';
