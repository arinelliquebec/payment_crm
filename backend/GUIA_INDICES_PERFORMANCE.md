# 📖 Guia de Execução - Índices de Performance

## 🎯 **Objetivo**
O script `adicionar_indices_performance.sql` adiciona **23 índices** estratégicos para melhorar significativamente a performance do CRM Arrighi.

---

## 📊 **Impacto Esperado**

### **Antes dos Índices**:
- ❌ Buscas por CPF/CNPJ: **Full Table Scan** (lento)
- ❌ Queries de contratos: **2-5 segundos** com muitos dados
- ❌ Dashboard: **5-10 segundos** para carregar
- ❌ Autocomplete: **Lento e trava interface**

### **Depois dos Índices**:
- ✅ Buscas por CPF/CNPJ: **< 50ms** (até 100x mais rápido)
- ✅ Queries de contratos: **< 500ms**
- ✅ Dashboard: **< 2 segundos**
- ✅ Autocomplete: **Instantâneo**

---

## 🚀 **Como Executar o Script**

### **Opção 1: SQL Server Management Studio (SSMS)** - ⭐ RECOMENDADO

1. **Abrir SSMS**
   - Conectar ao servidor SQL Server
   - Conectar ao banco de dados `CrmArrighi` (ou nome do seu banco)

2. **Abrir o Script**
   - File → Open → File
   - Selecionar: `backend/adicionar_indices_performance.sql`

3. **Ajustar Nome do Banco** (primeira linha)
   ```sql
   USE [CrmArrighi]; -- ⚠️ ALTERAR para o nome correto do seu banco
   ```

4. **Executar**
   - Pressionar `F5` ou clicar em "Execute"
   - Aguardar conclusão (2-5 minutos)

5. **Verificar Resultado**
   - O script mostra uma tabela com todos os índices criados
   - Verificar mensagens: `✅ Criando índice...` ou `ℹ️ já existe`

---

### **Opção 2: Azure Data Studio**

1. **Conectar ao Banco**
   - Abrir Azure Data Studio
   - Conectar ao servidor

2. **Executar Script**
   - File → Open File → `adicionar_indices_performance.sql`
   - Ajustar nome do banco na primeira linha
   - Run (Ctrl + Shift + E)

---

### **Opção 3: Linha de Comando (sqlcmd)**

```bash
# Windows
sqlcmd -S localhost -d CrmArrighi -U sa -P SuaSenha -i adicionar_indices_performance.sql

# Linux/Mac
sqlcmd -S localhost -d CrmArrighi -U sa -P SuaSenha -i adicionar_indices_performance.sql
```

**Parâmetros**:
- `-S`: Servidor (ex: `localhost`, `.\SQLEXPRESS`, IP do Azure)
- `-d`: Nome do banco de dados
- `-U`: Usuário
- `-P`: Senha
- `-i`: Arquivo SQL de entrada

---

### **Opção 4: Via Backend C# (Produção)**

Se quiser executar via código C# (útil para migrations):

```csharp
// No DbContext ou migration
public async Task CriarIndicesPerformance()
{
    var script = await File.ReadAllTextAsync("adicionar_indices_performance.sql");
    await _context.Database.ExecuteSqlRawAsync(script);
}
```

---

## ⚠️ **IMPORTANTE - ANTES DE EXECUTAR**

### **1. Fazer Backup do Banco**
```sql
-- Backup completo
BACKUP DATABASE [CrmArrighi]
TO DISK = 'C:\Backups\CrmArrighi_antes_indices.bak'
WITH COMPRESSION, STATS = 10;
```

### **2. Executar em Horário de Baixo Uso**
- **Melhor horário**: Madrugada (2h-5h) ou finais de semana
- **Por quê**: Criação de índices pode bloquear temporariamente as tabelas
- **Duração estimada**: 2-10 minutos dependendo do tamanho da base

### **3. Verificar Espaço em Disco**
```sql
-- Verificar espaço disponível
EXEC sp_spaceused;

-- Verificar espaço por tabela
EXEC sp_MSforeachtable 'EXEC sp_spaceused ''?''';
```

**Espaço necessário**: ~10-20% do tamanho atual do banco
**Exemplo**: Banco de 1GB → precisa de 100-200MB livres

---

## 📋 **Índices que Serão Criados**

### **Pessoas Físicas (3 índices)**
- ✅ `IX_PessoasFisicas_Cpf` - Busca por CPF
- ✅ `IX_PessoasFisicas_EmailEmpresarial` - Busca por email
- ✅ `IX_PessoasFisicas_Nome` - Autocomplete de nome

### **Pessoas Jurídicas (2 índices)**
- ✅ `IX_PessoaJuridica_Cnpj` - Busca por CNPJ
- ✅ `IX_PessoaJuridica_RazaoSocial` - Autocomplete razão social

### **Clientes (3 índices)**
- ✅ `IX_Clientes_Ativo_TipoPessoa` - Filtros principais
- ✅ `IX_Clientes_PessoaFisicaId` - FK para pessoa física
- ✅ `IX_Clientes_PessoaJuridicaId` - FK para pessoa jurídica

### **Contratos (4 índices)**
- ✅ `IX_Contratos_ClienteId_Ativo` - Contratos por cliente
- ✅ `IX_Contratos_ConsultorId_Ativo` - Contratos por consultor
- ✅ `IX_Contratos_Situacao_Ativo` - Filtro por situação
- ✅ `IX_Contratos_DataCadastro` - Ordenação por data

### **Boletos (2 índices)**
- ✅ `IX_Boletos_ContratoId_Status` - Boletos por contrato
- ✅ `IX_Boletos_DueDate_Status` - Vencimentos

### **Usuários (2 índices)**
- ✅ `IX_Usuarios_Login` - Login do usuário
- ✅ `IX_Usuarios_Email` - Busca por email

### **Sessões Ativas (2 índices)**
- ✅ `IX_SessoesAtivas_UsuarioId_Ativa` - Sessões por usuário
- ✅ `IX_SessoesAtivas_UltimaAtividade` - Limpeza de sessões

**Total**: **23 índices** estratégicos

---

## 🔍 **Verificar Se os Índices Foram Criados**

Após executar, verifique:

```sql
-- Listar todos os índices criados pelo script
SELECT
    OBJECT_NAME(i.object_id) AS Tabela,
    i.name AS Indice,
    i.type_desc AS Tipo,
    CAST(ROUND(((SUM(ps.reserved_page_count) * 8.0) / 1024), 2) AS DECIMAL(10,2)) AS [Tamanho_MB]
FROM
    sys.indexes AS i
    INNER JOIN sys.dm_db_partition_stats AS ps
        ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE
    i.name LIKE 'IX_%'
    AND i.name NOT LIKE 'PK_%'
GROUP BY
    i.object_id, i.name, i.type_desc
ORDER BY
    OBJECT_NAME(i.object_id), i.name;
```

**Resultado Esperado**: Tabela mostrando 23 índices criados

---

## 📈 **Monitorar Performance Após Criação**

### **1. Verificar Uso dos Índices**
```sql
-- Ver quais índices estão sendo mais usados
SELECT
    OBJECT_NAME(s.object_id) AS Tabela,
    i.name AS Indice,
    s.user_seeks AS Buscas,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.user_updates AS Updates,
    s.last_user_seek AS UltimaBusca
FROM
    sys.dm_db_index_usage_stats s
    INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE
    i.name LIKE 'IX_%'
    AND OBJECT_NAME(s.object_id) IN ('PessoasFisicas', 'Clientes', 'Contratos', 'Boletos')
ORDER BY
    s.user_seeks + s.user_scans + s.user_lookups DESC;
```

### **2. Verificar Fragmentação**
```sql
-- Após algumas semanas, verificar fragmentação
SELECT
    OBJECT_NAME(ips.object_id) AS Tabela,
    i.name AS Indice,
    ips.avg_fragmentation_in_percent AS Fragmentacao,
    ips.page_count AS Paginas
FROM
    sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE
    i.name LIKE 'IX_%'
    AND ips.avg_fragmentation_in_percent > 30 -- Mais de 30% fragmentado
ORDER BY
    ips.avg_fragmentation_in_percent DESC;
```

**Se fragmentação > 30%**: Executar `REINDEX`

---

## 🔧 **Manutenção dos Índices**

### **Reorganizar Índices (Fragmentação 10-30%)**
```sql
-- Executar mensalmente
ALTER INDEX ALL ON PessoasFisicas REORGANIZE;
ALTER INDEX ALL ON Clientes REORGANIZE;
ALTER INDEX ALL ON Contratos REORGANIZE;
ALTER INDEX ALL ON Boletos REORGANIZE;
```

### **Reconstruir Índices (Fragmentação > 30%)**
```sql
-- Executar trimestralmente ou quando necessário
ALTER INDEX ALL ON PessoasFisicas REBUILD WITH (ONLINE = ON);
ALTER INDEX ALL ON Clientes REBUILD WITH (ONLINE = ON);
ALTER INDEX ALL ON Contratos REBUILD WITH (ONLINE = ON);
ALTER INDEX ALL ON Boletos REBUILD WITH (ONLINE = ON);
```

### **Atualizar Estatísticas**
```sql
-- Executar semanalmente
UPDATE STATISTICS PessoasFisicas WITH FULLSCAN;
UPDATE STATISTICS Clientes WITH FULLSCAN;
UPDATE STATISTICS Contratos WITH FULLSCAN;
UPDATE STATISTICS Boletos WITH FULLSCAN;
```

---

## 🆘 **Solução de Problemas**

### **Erro: "Insufficient disk space"**
**Solução**: Liberar espaço ou aumentar disco

### **Erro: "Index already exists"**
**Solução**: Normal! O script verifica e só cria se não existir

### **Erro: "Timeout expired"**
**Solução**: Aumentar timeout:
```sql
-- Adicionar no início do script
SET LOCK_TIMEOUT 600000; -- 10 minutos
```

### **Performance Piorou Após Índices**
**Causas possíveis**:
1. Muitas escritas (INSERT/UPDATE) - índices pesam em writes
2. Índices não adequados para suas queries
3. Estatísticas desatualizadas

**Solução**: Executar `UPDATE STATISTICS` e analisar queries

---

## 📊 **Testes de Performance**

### **Antes de Executar - Baseline**
```sql
-- Teste 1: Busca por CPF
SET STATISTICS TIME ON;
SELECT * FROM PessoasFisicas WHERE Cpf = '12345678900';
-- Anotar tempo

-- Teste 2: Contratos por cliente
SELECT * FROM Contratos WHERE ClienteId = 1 AND Ativo = 1;
-- Anotar tempo

-- Teste 3: Dashboard
SELECT COUNT(*) FROM Contratos WHERE Ativo = 1;
SELECT COUNT(*) FROM Boletos WHERE Status = 'PENDENTE';
-- Anotar tempo total
SET STATISTICS TIME OFF;
```

### **Depois de Executar - Comparação**
Executar os mesmos testes e comparar os tempos

**Meta**: Redução de **50-90%** no tempo de execução

---

## ✅ **Checklist de Execução**

- [ ] Backup do banco realizado
- [ ] Nome do banco ajustado no script
- [ ] Horário de baixo uso escolhido
- [ ] Espaço em disco verificado (mínimo 20% livre)
- [ ] Script executado sem erros
- [ ] 23 índices criados confirmados
- [ ] Testes de performance realizados
- [ ] Resultados documentados
- [ ] Equipe notificada da mudança

---

## 📞 **Suporte**

**Dúvidas?**
- Revisar logs do SQL Server
- Verificar mensagens de erro no SSMS
- Contatar administrador de banco de dados

**Documentação**:
- `ANALISE_CRIACAO_CONTRATOS.md` - Análise completa
- `CORRECOES_NIVEL_MEDIO.md` - Correções de nível médio

---

**Data**: 30/09/2025
**Versão**: 1.0
**Autor**: AI Assistant
