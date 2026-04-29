-- ====================================================================
-- CORRIGIR CONSULTORES QUE NÃO ESTÃO SENDO DELETADOS
-- ====================================================================
-- Problema: DELETE via API retorna sucesso mas Ativo não muda para false
-- ====================================================================

-- 1. Verificar estado atual da LIVIA FREITAS e ISABELA ALVES
SELECT 
    c.Id,
    pf.Nome,
    pf.Cpf,
    c.Ativo,
    c.DataAtualizacao,
    (SELECT COUNT(*) FROM Contratos WHERE ConsultorId = c.Id AND Ativo = 1) AS ContratosAtivos
FROM Consultores c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LIVIA%FREITAS%'
   OR pf.Nome LIKE '%ISABELA%ALVES%'
   OR c.Id IN (80, 31);

PRINT '';
PRINT '====================================================================';
PRINT 'Se algum consultor acima tem ContratosAtivos > 0, NÃO pode ser excluído';
PRINT 'Se ContratosAtivos = 0 e você tentou excluir mas voltou, há problema no código';
PRINT '====================================================================';
PRINT '';

-- 2. Verificar se há TRIGGERs na tabela Consultores que possam reverter o DELETE
SELECT 
    t.name AS TriggerName,
    t.type_desc AS TriggerType,
    OBJECT_NAME(t.parent_id) AS TableName,
    t.is_disabled AS IsDisabled
FROM sys.triggers t
WHERE OBJECT_NAME(t.parent_id) = 'Consultores';

PRINT '';
PRINT '====================================================================';
PRINT 'Se houver TRIGGERs na tabela Consultores, eles podem estar';
PRINT 'interferindo na alteração do campo Ativo';
PRINT '====================================================================';
PRINT '';

-- 3. Verificar CONSTRAINTs CHECK na coluna Ativo
SELECT 
    cc.name AS ConstraintName,
    cc.definition AS ConstraintDefinition
FROM sys.check_constraints cc
INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
WHERE t.name = 'Consultores'
  AND cc.definition LIKE '%Ativo%';

PRINT '';
PRINT '====================================================================';
PRINT 'Se houver CONSTRAINT CHECK forçando Ativo = 1, remover:';
PRINT 'ALTER TABLE Consultores DROP CONSTRAINT nome_da_constraint;';
PRINT '====================================================================';
PRINT '';

-- 4. SOLUÇÃO TEMPORÁRIA: Marcar manualmente como inativo
-- (Descomente e execute APENAS se quiser forçar a exclusão)

/*
BEGIN TRANSACTION;

-- Marcar LIVIA FREITAS como inativa (ID 80)
UPDATE Consultores
SET Ativo = 0, DataAtualizacao = GETDATE()
WHERE Id = 80
  AND NOT EXISTS (SELECT 1 FROM Contratos WHERE ConsultorId = 80 AND Ativo = 1);

PRINT '✅ LIVIA FREITAS (ID 80) marcada como inativa';

-- Marcar ISABELA ALVES como inativa (ID 31) 
UPDATE Consultores
SET Ativo = 0, DataAtualizacao = GETDATE()
WHERE Id = 31
  AND NOT EXISTS (SELECT 1 FROM Contratos WHERE ConsultorId = 31 AND Ativo = 1);

PRINT '✅ ISABELA ALVES (ID 31) marcada como inativa';

-- Verificar resultado
SELECT Id, pf.Nome, c.Ativo
FROM Consultores c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Id IN (80, 31);

COMMIT TRANSACTION;
*/
