# Mapeamento Completo - Erro EmailEmpresarial/EmailPessoal

## Problema Identificado
O erro `"Invalid column name 'EmailEmpresarial'/'EmailPessoal'"` pode ocorrer em **TODOS** os controllers que fazem queries com `PessoaFisica`, pois o banco de dados em produção ainda não possui essas colunas.

## Controllers Afetados e Status da Correção

### ✅ CORRIGIDOS
1. **ContratoController.cs** - ✅ Corrigido
   - `GET /api/Contrato` - Inclui PessoaFisica
   - `EnsureEmailColumnsExist()` implementado
   - Endpoint de diagnóstico: `GET /api/Contrato/admin/diagnose-email-columns`
   - Endpoint de migração: `POST /api/Contrato/admin/migrate-columns`

2. **PessoaFisicaController.cs** - ✅ Corrigido
   - `GET /api/PessoaFisica` - Query direta
   - `GET /api/PessoaFisica/buscar-por-cpf/{cpf}` - Query direta
   - `GET /api/PessoaFisica/responsaveis-tecnicos` - Query direta com Select
   - `EnsureEmailColumnsExist()` implementado
   - Endpoint de migração: `POST /api/PessoaFisica/admin/migrate-email-columns`

3. **ClienteController.cs** - ✅ Corrigido
   - `GET /api/Cliente` - Inclui PessoaFisica
   - `GET /api/Cliente/{id}` - Inclui PessoaFisica
   - `EnsureEmailColumnsExist()` implementado

### ⚠️ PENDENTES DE CORREÇÃO

4. **UsuarioController.cs** - ❌ PRECISA CORREÇÃO
   - `GET /api/Usuario` - Inclui PessoaFisica
   - `GET /api/Usuario/{id}` - Inclui PessoaFisica
   - `GET /api/Usuario/pessoas-fisicas` - Query direta com Select EmailEmpresarial/EmailPessoal
   - **CRÍTICO**: Linha 51 faz SELECT explícito de EmailEmpresarial e EmailPessoal

5. **ConsultorController.cs** - ❌ PRECISA CORREÇÃO
   - `GET /api/Consultor` - Inclui PessoaFisica
   - `GET /api/Consultor/{id}` - Inclui PessoaFisica
   - `POST /api/Consultor` - FindAsync PessoaFisica

6. **ParceiroController.cs** - ❌ PRECISA CORREÇÃO
   - `GET /api/Parceiro` - Inclui PessoaFisica
   - `GET /api/Parceiro/{id}` - Inclui PessoaFisica
   - `POST /api/Parceiro` - FindAsync PessoaFisica

7. **HistoricoSituacaoContratoController.cs** - ❌ PRECISA CORREÇÃO
   - Queries que incluem PessoaFisica via relacionamentos

## Endpoints que CERTAMENTE irão falhar em produção

### 🚨 ALTA PRIORIDADE (Falha garantida)
- `GET /api/Usuario/pessoas-fisicas` - **SELECT explícito de EmailEmpresarial/EmailPessoal**
- `GET /api/Consultor` - Include PessoaFisica
- `GET /api/Parceiro` - Include PessoaFisica
- `GET /api/Usuario` - Include PessoaFisica

### 🔶 MÉDIA PRIORIDADE (Falha provável)
- Qualquer endpoint que faça POST/PUT com PessoaFisica
- Endpoints de histórico que incluem dados relacionados

## Solução Aplicada

### Padrão de Correção
1. Adicionar `await EnsureEmailColumnsExist();` no início de cada método que faz query
2. Adicionar método `EnsureEmailColumnsExist()` privado em cada controller
3. Adicionar logs de debug
4. Tratamento defensivo de erros

### Exemplo de Implementação
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<Entidade>>> GetEntidades()
{
    try
    {
        Console.WriteLine("🔍 GetEntidades: Buscando entidades no banco de dados");

        // Garantir que as colunas EmailEmpresarial e EmailPessoal existem
        await EnsureEmailColumnsExist();

        var entidades = await _context.Entidades
            .Include(e => e.PessoaFisica)
            .ToListAsync();

        Console.WriteLine($"✅ GetEntidades: Encontradas {entidades.Count} entidades");
        return entidades;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ GetEntidades: Erro: {ex.Message}");
        return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
    }
}
```

## Próximos Passos

1. **URGENTE**: Aplicar correção em UsuarioController (SELECT explícito)
2. **IMPORTANTE**: Aplicar correção em ConsultorController
3. **IMPORTANTE**: Aplicar correção em ParceiroController
4. **MODERADO**: Verificar HistoricoSituacaoContratoController
5. **OPCIONAL**: Criar endpoint global de migração

## Endpoints de Migração Disponíveis

- `POST /api/Contrato/admin/migrate-columns`
- `POST /api/PessoaFisica/admin/migrate-email-columns`
- `GET /api/Contrato/admin/diagnose-email-columns` (diagnóstico)

## Como Testar

1. Execute qualquer endpoint de migração
2. Verifique logs do servidor
3. Teste os endpoints que estavam falhando
4. Confirme que não há mais erros de "Invalid column name"
