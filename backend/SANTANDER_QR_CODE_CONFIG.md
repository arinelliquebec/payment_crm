# Configuração do QR Code Oficial do Santander

## Problema Atual

O sistema está gerando QR Codes simulados. Para usar QR Codes oficiais do Santander, é necessário:

## 1. Verificar Resposta da API Santander

A API do Santander pode retornar o QR Code de duas formas:

### Opção A: URL da Imagem
```json
{
  "qrCodeUrl": "https://santander.com.br/qrcode/12345..."
}
```

### Opção B: Apenas o Código PIX
```json
{
  "qrCodePix": "00020101021226900014br.gov.bcb.pix..."
}
```

## 2. Configuração no Backend

### Se a API retorna `qrCodeUrl`:

O campo já está mapeado em `SantanderBoletoResponse.cs`:
```csharp
public string? qrCodeUrl { get; set; }
```

Nenhuma alteração necessária.

### Se a API retorna apenas `qrCodePix`:

O frontend já está configurado para gerar o QR Code a partir do texto PIX.

## 3. Desativar Modo Simulação

No `appsettings.json`:

```json
{
  "SantanderAPI": {
    "ModoSimulacao": false,
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "WorkspaceId": "SEU_WORKSPACE_ID",
    "CovenantCode": "SEU_COVENANT_CODE",
    "ClientId": "SEU_CLIENT_ID",
    "ClientSecret": "SEU_CLIENT_SECRET"
  }
}
```

## 4. Verificar Logs

Após registrar um boleto, verifique os logs:

```
✅ Boleto registrado com sucesso: {NsuCode}
📥 Response Content: {...}
```

Procure por `qrCodeUrl` ou `qrCodePix` na resposta.

## 5. Campos Possíveis na API Santander

Segundo a documentação, a API pode retornar:

- `barCode` - Código de barras
- `digitableLine` - Linha digitável
- `qrCodePix` - Código PIX (texto)
- `qrCodeUrl` - URL da imagem do QR Code (se disponível)
- `pixKey` - Chave PIX
- `pixKeyType` - Tipo da chave PIX

## 6. Solução Atual

O sistema está configurado para:

1. **Backend**: Retorna `qrCodePix` da API Santander
2. **Frontend**: Gera a imagem do QR Code a partir do `qrCodePix`

Isso funciona porque:
- Todo app de pagamento PIX lê o código em texto
- A geração da imagem é apenas visual
- O código PIX é o que importa para o pagamento

## 7. Para Usar QR Code Oficial (se disponível)

Se a API Santander retornar `qrCodeUrl`:

1. O backend já salva no banco de dados
2. O frontend já verifica se existe
3. Prioridade: `qrCodeUrl` > geração a partir de `qrCodePix`

## 8. Teste em Produção

```bash
# 1. Configure as credenciais reais
# 2. Desative modo simulação
# 3. Registre um boleto de teste
# 4. Verifique os logs para ver o que a API retorna
# 5. Teste o pagamento com um app PIX
```

## Conclusão

O sistema está preparado para ambos os cenários:
- ✅ Se Santander retornar `qrCodeUrl`: usa a URL oficial
- ✅ Se Santander retornar apenas `qrCodePix`: gera QR Code no frontend

Ambas as abordagens são válidas e funcionam para pagamento PIX.
