# Solução: Consultores Veem Todos os Contratos

## Problema Identificado

O filtro não está funcionando porque:

1. **Usuário não identificado corretamente** - O método `GetCurrentUserId()` não está obtendo o ID real do usuário
2. **Usuário sem ConsultorId** - O usuário Mauro pode não estar vinculado a um consultor
3. **Grupo incorreto** - O usuário pode não estar no grupo "Consultores"

## Passos para Resolver

### 1. Execute o Script de Diagnóstico

```sql
-- Execute este script para verificar o estado atual
-- Arquivo: diagnostico_usuario_mauro.sql
```

### 2. Configure o Usuário Mauro Corretamente

```sql
-- Execute este script para configurar o usuário
-- Arquivo: configurar_usuario_mauro.sql
```

### 3. Teste o Filtro no Banco

```sql
-- Execute este script para testar o filtro
-- Arquivo: testar_filtro_consultores.sql
```

### 4. Teste o Endpoint de Debug

Acesse: `GET /api/Contrato/debug-usuario`

Este endpoint retornará:
- Informações do usuário logado
- Grupo de acesso
- ConsultorId
- Total de contratos vs contratos filtrados

### 5. Verifique os Logs

Após fazer uma requisição para `/api/Contrato`, verifique os logs do servidor para ver:
- Se o usuário está sendo identificado
- Qual grupo de acesso está sendo aplicado
- Quantos contratos estão sendo retornados

## Possíveis Causas e Soluções

### Causa 1: Usuário não identificado
**Sintoma:** Log mostra "Usuário não identificado"
**Solução:** Verificar se o header `X-Usuario-Id` está sendo enviado pelo frontend

### Causa 2: Usuário sem ConsultorId
**Sintoma:** Log mostra "ConsultorId: null"
**Solução:** Executar `configurar_usuario_mauro.sql`

### Causa 3: Usuário não está no grupo Consultores
**Sintoma:** Log mostra grupo diferente de "Consultores"
**Solução:** Atualizar `GrupoAcessoId` do usuário

### Causa 4: Permissões não configuradas
**Sintoma:** Usuário está no grupo Consultores mas vê todos os contratos
**Solução:** Executar `update_consultores_permissions.sql`

## Verificação Final

Após executar todos os scripts, verifique:

1. **Usuário configurado:**
```sql
SELECT u.Id, u.Nome, u.GrupoAcessoId, g.Nome as Grupo, u.ConsultorId
FROM Usuarios u
LEFT JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE u.Nome LIKE '%Mauro%';
```

2. **Permissões do grupo:**
```sql
SELECT g.Nome, p.Modulo, p.Acao, pg.ApenasProprios
FROM GruposAcesso g
JOIN PermissoesGrupos pg ON g.Id = pg.GrupoAcessoId
JOIN Permissoes p ON pg.PermissaoId = p.Id
WHERE g.Nome = 'Consultores' AND p.Modulo = 'Contrato';
```

3. **Teste do endpoint:**
```bash
curl -H "X-Usuario-Id: [ID_DO_USUARIO_MAURO]" \
     https://seu-dominio.com/api/Contrato/debug-usuario
```

## Resultado Esperado

Após a correção, o usuário Mauro deve:
- ✅ Ver apenas contratos onde `ConsultorId = Mauro.ConsultorId`
- ✅ Não ver contratos de outros consultores
- ✅ Manter todas as outras funcionalidades

## Logs de Debug

Os logs devem mostrar:
```
🔍 GetCurrentUserId: Usuário identificado via header: [ID]
🔍 GetContratos: Usuário: Mauro, Grupo: Consultores, ConsultorId: [ID]
✅ GetContratos: Encontrados [X] contratos para o usuário [ID] (Grupo: Consultores)
```

Se ainda estiver vendo todos os contratos após essas correções, o problema pode estar no frontend não enviando o header correto ou no sistema de autenticação.
