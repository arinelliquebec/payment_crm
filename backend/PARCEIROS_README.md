# 🏢 Módulo de Parceiros - CRM Arrighi

## 📋 Descrição
Sistema de gerenciamento de Parceiros para o CRM Arrighi, baseado na estrutura dos Consultores existente.

## 🎯 Características Principais

### ✅ **Obrigatoriamente Pessoa Física**
- Todos os parceiros devem ser pessoas físicas
- Não é possível cadastrar pessoas jurídicas como parceiros
- Relacionamento direto com a tabela `PessoasFisicas`

### 🔗 **Relacionamentos**
- **PessoaFisica**: Relacionamento obrigatório (1:1)
- **Filial**: Relacionamento obrigatório (Many:1)
- **OAB**: Campo opcional para registro profissional

## 🗄️ Modelo de Dados

### **Parceiro**
```csharp
public class Parceiro
{
    public int Id { get; set; }
    public int PessoaFisicaId { get; set; }        // Obrigatório
    public int FilialId { get; set; }               // Obrigatório
    public string? OAB { get; set; }                // Opcional (max 20 chars)
    public DateTime DataCadastro { get; set; }      // Automático
    public DateTime? DataAtualizacao { get; set; }  // Automático
    public bool Ativo { get; set; }                 // Padrão: true
}
```

### **DTOs**
- **CreateParceiroDTO**: Para criação de novos parceiros
- **UpdateParceiroDTO**: Para atualização de parceiros existentes

## 🚀 APIs Disponíveis

### **Endpoints Principais**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/Parceiro` | Lista todos os parceiros ativos |
| `GET` | `/api/Parceiro/{id}` | Busca parceiro por ID |
| `POST` | `/api/Parceiro` | Cria novo parceiro |
| `PUT` | `/api/Parceiro/{id}` | Atualiza parceiro existente |
| `DELETE` | `/api/Parceiro/{id}` | Remove parceiro (soft delete) |

### **Endpoints Específicos**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/Parceiro/por-filial/{filialId}` | Lista parceiros por filial |
| `GET` | `/api/Parceiro/por-pessoa-fisica/{pessoaFisicaId}` | Busca parceiro por pessoa física |
| `GET` | `/api/Parceiro/responsaveis-tecnicos` | Lista responsáveis técnicos |

## 🔒 Validações e Regras de Negócio

### **Criação de Parceiro**
- ✅ Pessoa física deve existir no sistema
- ✅ Filial deve existir no sistema
- ✅ Não pode haver parceiro ativo duplicado para a mesma pessoa física
- ✅ OAB é opcional (máximo 20 caracteres)

### **Atualização de Parceiro**
- ✅ Filial deve existir no sistema
- ✅ OAB pode ser atualizado
- ✅ Data de atualização é preenchida automaticamente

### **Exclusão de Parceiro**
- ✅ Soft delete (marca como inativo)
- ✅ Data de atualização é preenchida automaticamente

## 🗃️ Estrutura do Banco de Dados

### **Tabela: Parceiros**
```sql
CREATE TABLE [Parceiros] (
    [Id] int NOT NULL IDENTITY(1,1),
    [PessoaFisicaId] int NOT NULL,
    [FilialId] int NOT NULL,
    [OAB] nvarchar(20) NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    [Ativo] bit NOT NULL DEFAULT 1,
    CONSTRAINT [PK_Parceiros] PRIMARY KEY ([Id])
);
```

### **Índices e Constraints**
- **PK_Parceiros**: Chave primária
- **IX_Parceiros_PessoaFisicaId**: Índice único para PessoaFisicaId
- **IX_Parceiros_FilialId**: Índice para FilialId
- **FK_Parceiros_PessoasFisicas_PessoaFisicaId**: Foreign key para PessoasFisicas
- **FK_Parceiros_Filiais_FilialId**: Foreign key para Filiais

## 🧪 Testes

### **Arquivo de Teste**
- `Parceiros.http`: Contém todos os endpoints para teste via REST Client

### **Dados Mock**
- Controller inclui dados mock para desenvolvimento offline
- 2 parceiros de exemplo com dados completos

## 📝 Exemplos de Uso

### **Criar Parceiro**
```json
POST /api/Parceiro
{
  "pessoaFisicaId": 1,
  "filialId": 1,
  "oab": "123456/SP"
}
```

### **Atualizar Parceiro**
```json
PUT /api/Parceiro/1
{
  "id": 1,
  "filialId": 2,
  "oab": "654321/SP"
}
```

## 🔄 Migração

### **Arquivo de Migração**
- `20250902180042_AddParceirosTable.cs`
- Cria tabela Parceiros com todas as constraints necessárias
- Inclui índices e foreign keys

### **Para Aplicar a Migração**
```bash
dotnet ef database update
```

## 🎨 Frontend

### **Tela de Cadastro**
- Formulário para criação de novos parceiros
- Seleção de pessoa física (obrigatório)
- Seleção de filial (obrigatório)
- Campo OAB (opcional)

### **Tela de Listagem**
- Lista todos os parceiros ativos
- Filtros por filial
- Busca por nome ou OAB
- Ações de editar/excluir

### **Tela de Edição**
- Formulário para atualização de parceiros
- Validação de campos obrigatórios
- Histórico de alterações

## 🚦 Status do Desenvolvimento

- ✅ **Modelo**: Criado
- ✅ **DTOs**: Criados
- ✅ **Controller**: Criado
- ✅ **Context**: Atualizado
- ✅ **Migração**: Criada
- ✅ **Testes HTTP**: Criados
- 🔄 **Frontend**: Pendente
- 🔄 **Validações**: Pendente

## 📚 Próximos Passos

1. **Desenvolver telas frontend**
2. **Implementar validações adicionais**
3. **Criar testes unitários**
4. **Documentar casos de uso específicos**
5. **Implementar auditoria de alterações**

---

**Desenvolvido para CRM Arrighi** 🏢✨
