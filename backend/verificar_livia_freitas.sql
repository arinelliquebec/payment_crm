-- Verificar status da LIVIA FREITAS no banco
SELECT 
    c.Id AS ConsultorId,
    c.Ativo AS ConsultorAtivo,
    c.DataAtualizacao AS ConsultorUltimaAtualizacao,
    pf.Id AS PessoaFisicaId,
    pf.Nome,
    pf.Cpf,
    pf.EmailEmpresarial
FROM Consultores c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LIVIA%FREITAS%'
   OR pf.Cpf = '12118519400'
   OR c.Id = 80;

-- Verificar se há contratos vinculados
SELECT 
    COUNT(*) AS TotalContratos,
    SUM(CASE WHEN Ativo = 1 THEN 1 ELSE 0 END) AS ContratosAtivos
FROM Contratos
WHERE ConsultorId = 80;
