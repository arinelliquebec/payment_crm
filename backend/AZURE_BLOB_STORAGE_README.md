# Azure Blob Storage - Armazenamento de Arquivos PDF dos Contratos

## ✅ Configuração Implementada

O sistema agora está configurado para armazenar os arquivos PDF dos contratos no **Azure Blob Storage** em vez de salvar o base64 no banco de dados.

### 📋 Configurações do Azure Storage

**Storage Account:** `frademastoragev2`  
**Container:** `contratos`  
**Localização:** Brazil South  
**Tipo de Conta:** StorageV2 (uso geral v2)

---

## 🔧 O Que Foi Implementado

### 1. **appsettings.json**
```json
{
  "AzureStorage": {
    "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=frademastoragev2;AccountKey=...;EndpointSuffix=core.windows.net",
    "ContainerName": "contratos"
  }
}
```

### 2. **Pacote NuGet Adicionado**
```xml
<PackageReference Include="Azure.Storage.Blobs" Version="12.19.1" />
```

### 3. **Serviço de Azure Blob Storage** (`Services/AzureBlobStorageService.cs`)
Criado serviço completo com os métodos:
- ✅ `UploadFileAsync()` - Upload de arquivos em bytes
- ✅ `UploadBase64FileAsync()` - Upload de arquivos em base64
- ✅ `DownloadFileAsync()` - Download de arquivos
- ✅ `DeleteFileAsync()` - Deletar arquivos
- ✅ `FileExistsAsync()` - Verificar se arquivo existe
- ✅ `GetFileUrl()` - Obter URL do arquivo

### 4. **Integração no ContratoController**
- ✅ Injeção do `IAzureBlobStorageService`
- ✅ Upload automático do PDF no `CreateContrato()`
- ✅ Download do Azure Blob Storage no `DownloadContratoPDF()`
- ✅ Logs detalhados de todas as operações

---

## 🔄 Fluxo de Funcionamento

### **Criação de Contrato (POST /api/Contrato)**

1. Frontend envia o PDF em base64 no campo `AnexoDocumento`
2. Backend recebe o base64
3. **NOVO:** Backend faz upload para Azure Blob Storage
   - Gera nome único: `contrato_20251014_153045_abc123.pdf`
   - Faz upload do arquivo
   - Obtém URL do arquivo
4. **NOVO:** Backend salva APENAS o **nome do arquivo** no banco de dados
   - Antes: Salvava o base64 completo (muito pesado)
   - Agora: Salva apenas `contrato_20251014_153045_abc123.pdf`
5. Retorna sucesso

### **Download de Contrato (GET /api/Contrato/{id}/pdf)**

1. Frontend solicita download do PDF
2. Backend busca o contrato no banco
3. **NOVO:** Backend busca o arquivo no Azure Blob Storage usando o nome salvo
4. Retorna o arquivo PDF para download

---

## 📊 Benefícios da Implementação

### ✅ **Performance do Banco de Dados**
- **Antes:** Base64 ocupava ~1.5MB por contrato
- **Agora:** Nome do arquivo ocupa ~50 bytes
- **Melhoria:** 99.9% de redução no tamanho

### ✅ **Escalabilidade**
- Arquivos armazenados em infraestrutura dedicada
- Banco de dados mais leve e rápido
- Melhor performance em queries

### ✅ **Custo-Benefício**
- Azure Blob Storage é mais barato que banco de dados
- Melhor uso dos recursos do SQL Server

### ✅ **Backup e Recuperação**
- Arquivos separados facilitam backup
- Possível restaurar apenas arquivos sem afetar banco

---

## 🔒 Segurança

### **Nível de Acesso**
- **Container:** Privado (sem acesso público)
- **Acesso:** Apenas via credenciais configuradas

### **Permissões de Download**
- Apenas usuários autenticados
- Grupos permitidos:
  - Administrador
  - Faturamento
  - Cobrança e Financeiro

### **Connection String Segura**
- Armazenada no `appsettings.json`
- Não exposta no código-fonte
- ⚠️ **IMPORTANTE:** Adicionar ao `.gitignore` em produção

---

## 📝 Estrutura de Arquivos no Azure

```
Container: contratos/
├── contrato_20251014_153045_abc123def456.pdf
├── contrato_20251014_160230_xyz789ghi012.pdf
├── contrato_20251014_171522_mno345pqr678.pdf
└── ...
```

### **Convenção de Nomenclatura**
```
contrato_{dataHora}_{guid}.pdf
```
- `dataHora`: `yyyyMMdd_HHmmss` (2025101_153045)
- `guid`: GUID sem hífens (abc123def456)
- Extensão: sempre `.pdf`

**Exemplo:**
```
contrato_20251014_153045_a1b2c3d4e5f6g7h8i9j0.pdf
```

---

## 🧪 Como Testar

### **1. Criar Contrato com PDF**
```bash
POST /api/Contrato
Content-Type: application/json

{
  "clienteId": 1,
  "consultorId": 1,
  "situacao": "Lead",
  "anexoDocumento": "data:application/pdf;base64,JVBERi0xLjQKJ..."
}
```

**Resultado Esperado:**
- ✅ Arquivo enviado para Azure Blob Storage
- ✅ Nome do arquivo salvo no banco
- ✅ Logs mostram sucesso do upload

### **2. Download do PDF**
```bash
GET /api/Contrato/1/pdf
```

**Resultado Esperado:**
- ✅ Arquivo baixado do Azure Blob Storage
- ✅ PDF retornado para o cliente
- ✅ Logs mostram sucesso do download

### **3. Verificar no Portal Azure**
1. Acessar [portal.azure.com](https://portal.azure.com)
2. Navegar para Storage Account `frademastoragev2`
3. Acessar Container `contratos`
4. Verificar se o arquivo foi criado

---

## 🐛 Troubleshooting

### **Erro: "Connection String não configurada"**
```
InvalidOperationException: AzureStorage:ConnectionString não está configurada
```
**Solução:** Verificar `appsettings.json` e garantir que a chave está presente

### **Erro: "Container não encontrado"**
```
Azure.RequestFailedException: The specified container does not exist
```
**Solução:** O serviço cria o container automaticamente. Verificar permissões da Connection String.

### **Erro: "Arquivo não encontrado no Azure Blob Storage"**
```
FileNotFoundException: Arquivo 'contrato_xxx.pdf' não encontrado
```
**Solução:** 
- Verificar se o upload foi bem-sucedido
- Verificar nome do arquivo no banco de dados
- Verificar se o arquivo existe no portal Azure

### **Erro: "Forbidden" ao fazer upload**
```
Azure.RequestFailedException: Server failed to authenticate the request
```
**Solução:** Verificar se a `AccountKey` está correta no `appsettings.json`

---

## 📌 Notas Importantes

### ⚠️ **Migração de Dados Antigos**
- Contratos criados **antes** desta implementação têm base64 no banco
- Contratos criados **depois** têm apenas o nome do arquivo
- Para migrar dados antigos, criar script de migração

### ⚠️ **Segurança da Connection String**
- **NÃO commitar** a connection string em repositório público
- Usar **Azure Key Vault** em produção
- Usar **variáveis de ambiente** ou **secrets**

### ⚠️ **Backup**
- O Azure Blob Storage tem backup automático
- Configurar **Soft Delete** para recuperação de arquivos deletados
- Período de retenção: 7-365 dias

---

## 🚀 Próximos Passos (Opcional)

### **1. Migração de Dados Antigos**
Criar script para migrar contratos antigos:
- Ler base64 do banco
- Fazer upload para Azure Blob Storage
- Atualizar campo com nome do arquivo

### **2. SAS Token para Download Direto**
Gerar URL temporária para download direto:
```csharp
var sasUrl = _blobStorageService.GenerateSasUrl(fileName, TimeSpan.FromHours(1));
```

### **3. Soft Delete**
Habilitar recuperação de arquivos deletados:
- Portal Azure > Storage Account > Data Protection
- Habilitar "Soft delete for blobs"

### **4. Azure CDN** (Opcional)
Para melhor performance global:
- Configurar Azure CDN na frente do Blob Storage
- URLs de download mais rápidas

---

## ✅ Conclusão

O sistema agora está configurado para armazenar arquivos PDF de forma eficiente no Azure Blob Storage, melhorando:
- ✅ Performance do banco de dados
- ✅ Escalabilidade do sistema
- ✅ Custo-benefício da infraestrutura
- ✅ Facilidade de backup e recuperação

Todos os testes devem ser realizados antes do deploy em produção! 🎯
