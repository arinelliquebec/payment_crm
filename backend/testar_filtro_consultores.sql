-- Script para testar o filtro de consultores diretamente no banco
-- Execute este script para verificar se o filtro está funcionando

-- 1. Obter ID do usuário Mauro
DECLARE @UsuarioId INT;
DECLARE @ConsultorId INT;
DECLARE @GrupoNome NVARCHAR(50);

SELECT @UsuarioId = Id, @ConsultorId = ConsultorId, @GrupoNome = g.Nome
FROM Usuarios u
LEFT JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE u.Nome LIKE '%Mauro%';

PRINT 'Usuário ID: ' + CAST(@UsuarioId AS NVARCHAR(10));
PRINT 'Consultor ID: ' + CAST(@ConsultorId AS NVARCHAR(10));
PRINT 'Grupo: ' + @GrupoNome;

-- 2. Verificar total de contratos
SELECT 'Total de contratos ativos:' as Info, COUNT(*) as Total
FROM Contratos 
WHERE Ativo = 1;

-- 3. Verificar contratos do consultor Mauro (se ConsultorId não for NULL)
IF @ConsultorId IS NOT NULL
BEGIN
    SELECT 'Contratos do consultor Mauro:' as Info, COUNT(*) as Total
    FROM Contratos 
    WHERE ConsultorId = @ConsultorId AND Ativo = 1;
    
    -- Listar contratos do consultor Mauro
    SELECT 
        c.Id as ContratoId,
        c.ConsultorId,
        pf.Nome as ConsultorNome,
        CASE 
            WHEN cl.TipoPessoa = 'Fisica' THEN pf_cl.Nome
            WHEN cl.TipoPessoa = 'Juridica' THEN pj_cl.RazaoSocial
            ELSE 'N/A'
        END as ClienteNome,
        c.Situacao
    FROM Contratos c
    LEFT JOIN Consultores co ON c.ConsultorId = co.Id
    LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
    LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
    LEFT JOIN PessoasFisicas pf_cl ON cl.PessoaFisicaId = pf_cl.Id
    LEFT JOIN PessoasJuridicas pj_cl ON cl.PessoaJuridicaId = pj_cl.Id
    WHERE c.ConsultorId = @ConsultorId AND c.Ativo = 1
    ORDER BY c.Id;
END
ELSE
BEGIN
    PRINT 'ERRO: Usuário Mauro não tem ConsultorId configurado!';
END

-- 4. Simular o filtro que deveria ser aplicado para consultores
IF @GrupoNome = 'Consultores' AND @ConsultorId IS NOT NULL
BEGIN
    SELECT 'Simulação do filtro para consultores:' as Info, COUNT(*) as Total
    FROM Contratos 
    WHERE ConsultorId = @ConsultorId AND Ativo = 1;
END
ELSE IF @GrupoNome = 'Consultores' AND @ConsultorId IS NULL
BEGIN
    SELECT 'PROBLEMA: Usuário está no grupo Consultores mas não tem ConsultorId!' as Info;
END
ELSE
BEGIN
    SELECT 'Usuário não está no grupo Consultores. Grupo atual: ' + @GrupoNome as Info;
END

-- 5. Verificar se existem contratos de outros consultores
SELECT 'Contratos de outros consultores:' as Info, COUNT(*) as Total
FROM Contratos 
WHERE ConsultorId != @ConsultorId AND Ativo = 1;

-- 6. Listar todos os consultores e seus contratos
SELECT 
    co.Id as ConsultorId,
    pf.Nome as ConsultorNome,
    COUNT(c.Id) as TotalContratos
FROM Consultores co
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Contratos c ON co.Id = c.ConsultorId AND c.Ativo = 1
GROUP BY co.Id, pf.Nome
ORDER BY TotalContratos DESC;
