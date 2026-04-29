-- Script para limpar sessões antigas e forçar nova captura de IP
-- Execute este script antes de testar o rastreamento de IP

-- Ver as sessões atuais (para diagnóstico)
SELECT
    Id,
    UsuarioId,
    NomeUsuario,
    Email,
    EnderecoIP,
    InicioSessao,
    UltimaAtividade,
    Ativa
FROM SessoesAtivas
ORDER BY InicioSessao DESC;

-- Limpar TODAS as sessões ativas (forçar reautenticação)
DELETE FROM SessoesAtivas;

PRINT 'Todas as sessões foram removidas. Faça login novamente para capturar o IP correto.';

