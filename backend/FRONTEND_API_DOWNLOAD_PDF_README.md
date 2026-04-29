# 📄 API Download PDF do Boleto - Guia para Frontend

## 🎯 Visão Geral

Este documento descreve como consumir o endpoint para **baixar o PDF do boleto** gerado pela API Santander.

⚠️ **ATUALIZAÇÃO IMPORTANTE**: O endpoint agora retorna o arquivo PDF **diretamente** com nome padronizado, eliminando a necessidade de tratamento adicional no frontend.

## 📋 Endpoint

### **Download PDF do Boleto**
```
GET /api/Boleto/{id}/pdf
```

## 🔧 Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | `int` | ✅ | ID do boleto no sistema |

## 📤 Resposta

### **Sucesso (200 OK)**

**Tipo de Resposta:** `application/pdf` (arquivo binário)

**Nome do Arquivo:** `Boleto_{id}_{nomeCliente}_{dataVencimento}.pdf`

Exemplos de nomes de arquivo:
- `Boleto_123_Joao_Silva_2025-11-30.pdf`
- `Boleto_456_Empresa_LTDA_2025-12-15.pdf`

O arquivo PDF é retornado diretamente, pronto para download automático pelo navegador.

### **Erros Possíveis**

#### **404 Not Found**
```json
{
  "message": "Boleto com ID 123 não encontrado."
}
```

#### **400 Bad Request**
```json
{
  "message": "Boleto não possui BankNumber válido para download do PDF."
}
```

#### **500 Internal Server Error**
```json
{
  "message": "Erro interno do servidor: [detalhes do erro]"
}
```

## 💻 Exemplos de Implementação

### **JavaScript/TypeScript (Fetch) - MÉTODO ATUALIZADO**
```javascript
async function baixarPdfBoleto(boletoId) {
  try {
    const response = await fetch(`/api/Boleto/${boletoId}/pdf`, {
      method: 'GET',
      headers: {
        'X-Usuario-Id': localStorage.getItem('usuarioId'), // Se necessário para autenticação
        // Adicionar headers de autenticação se necessário
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensagem || `Erro HTTP: ${response.status}`);
    }

    // Obter o blob do PDF
    const blob = await response.blob();
    
    // Extrair o nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Boleto_${boletoId}.pdf`; // Nome padrão
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // Criar URL temporária para o blob
    const url = window.URL.createObjectURL(blob);
    
    // Criar link temporário e simular clique para download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return filename;
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    throw error;
  }
}

// Uso
baixarPdfBoleto(123)
  .then(filename => {
    console.log('PDF baixado com sucesso:', filename);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```

### **React/Next.js - MÉTODO ATUALIZADO**
```jsx
import { useState } from 'react';

function BoletoPdfDownload({ boletoId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const baixarPdf = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/Boleto/${boletoId}/pdf`, {
        headers: {
          'X-Usuario-Id': localStorage.getItem('usuarioId') || ''
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensagem || 'Erro ao baixar PDF');
      }

      // Obter o blob do PDF
      const blob = await response.blob();
      
      // Extrair o nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Boleto_${boletoId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={baixarPdf} 
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Baixando...' : '📄 Baixar PDF'}
      </button>
      
      {error && (
        <div className="alert alert-danger mt-2">
          Erro: {error}
        </div>
      )}
    </div>
  );
}

export default BoletoPdfDownload;
```

### **Vue.js**
```vue
<template>
  <div>
    <button 
      @click="baixarPdf" 
      :disabled="loading"
      class="btn btn-primary"
    >
      {{ loading ? 'Baixando...' : '📄 Baixar PDF' }}
    </button>
    
    <div v-if="error" class="alert alert-danger mt-2">
      Erro: {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    boletoId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      error: null
    };
  },
  methods: {
    async baixarPdf() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`/api/Boleto/${this.boletoId}/pdf`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao baixar PDF');
        }

        const data = await response.json();
        
        // Abrir PDF em nova aba
        window.open(data.pdfLink, '_blank');
        
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

### **Angular**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoletoService {
  private apiUrl = '/api/Boleto';

  constructor(private http: HttpClient) {}

  baixarPdfBoleto(boletoId: number): Observable<{pdfLink: string}> {
    return this.http.get<{pdfLink: string}>(`${this.apiUrl}/${boletoId}/pdf`);
  }
}

// Component
import { Component } from '@angular/core';
import { BoletoService } from './boleto.service';

@Component({
  selector: 'app-boleto-pdf',
  template: `
    <button 
      (click)="baixarPdf()" 
      [disabled]="loading"
      class="btn btn-primary"
    >
      {{ loading ? 'Baixando...' : '📄 Baixar PDF' }}
    </button>
    
    <div *ngIf="error" class="alert alert-danger mt-2">
      Erro: {{ error }}
    </div>
  `
})
export class BoletoPdfComponent {
  loading = false;
  error: string | null = null;

  constructor(private boletoService: BoletoService) {}

  baixarPdf() {
    this.loading = true;
    this.error = null;

    this.boletoService.baixarPdfBoleto(this.boletoId).subscribe({
      next: (data) => {
        window.open(data.pdfLink, '_blank');
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao baixar PDF';
        this.loading = false;
      }
    });
  }
}
```

## 🔐 Autenticação

O endpoint requer autenticação. Certifique-se de incluir o token de autenticação nos headers:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## ⚠️ Considerações Importantes

### **1. Validações do Backend**
- ✅ Boleto deve existir no sistema
- ✅ Boleto deve ter `BankNumber` válido
- ✅ Boleto deve ter sido gerado pela API Santander

### **2. Arquivo PDF**
- 📄 **Formato:** Arquivo PDF binário pronto para download
- 📝 **Nome Padronizado:** `Boleto_{id}_{nomeCliente}_{dataVencimento}.pdf`
- 💾 **Download Automático:** O navegador iniciará o download automaticamente
- 🔒 **Sem Expiração:** O arquivo é baixado imediatamente, sem links temporários

### **3. Tratamento de Erros**
```javascript
// Sempre tratar os possíveis erros
try {
  const response = await fetch(`/api/Boleto/${boletoId}/pdf`);
  
  if (!response.ok) {
    if (response.status === 404) {
      const error = await response.json();
      throw new Error(error.mensagem || 'Boleto não encontrado');
    } else if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.mensagem || 'Boleto não possui dados válidos para PDF');
    } else {
      throw new Error('Erro interno do servidor');
    }
  }
  
  // Processar o blob do PDF
  const blob = await response.blob();
  // ... continuar com download
  
} catch (error) {
  console.error('Erro ao baixar PDF:', error);
  // Mostrar mensagem de erro para o usuário
}
```

## 🧪 Testando o Endpoint

### **cURL**
```bash
curl -X GET "https://api.arrighi.com.br/api/Boleto/123/pdf" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

### **Postman**
1. **Method:** GET
2. **URL:** `{{baseUrl}}/api/Boleto/123/pdf`
3. **Headers:**
   - `Authorization: Bearer {{token}}`
   - `Content-Type: application/json`

## 📱 Exemplo de UI - ATUALIZADO

```html
<!-- Botão simples -->
<button onclick="baixarPdf(123)" class="btn btn-primary">
  📄 Baixar PDF
</button>

<!-- Com loading -->
<button id="btnPdf" onclick="baixarPdf(123)" class="btn btn-primary">
  📄 Baixar PDF
</button>

<script>
async function baixarPdf(boletoId) {
  const btn = document.getElementById('btnPdf');
  const originalText = btn.innerHTML;
  
  btn.innerHTML = '⏳ Baixando...';
  btn.disabled = true;
  
  try {
    const response = await fetch(`/api/Boleto/${boletoId}/pdf`, {
      headers: {
        'X-Usuario-Id': localStorage.getItem('usuarioId') || ''
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensagem || 'Erro ao baixar PDF');
    }
    
    // Obter o blob do PDF
    const blob = await response.blob();
    
    // Extrair nome do arquivo
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Boleto_${boletoId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // Criar URL e fazer download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('PDF baixado com sucesso!');
  } catch (error) {
    alert('Erro ao baixar PDF: ' + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
</script>
```

## 🚀 Próximos Passos

1. **Implementar** o endpoint no frontend usando os novos exemplos
2. **Testar** com diferentes IDs de boleto
3. **Adicionar** tratamento de erros adequado
4. **Implementar** loading states na UI
5. **Testar** em diferentes navegadores

## ✨ O Que Mudou?

### ❌ Antes (Antigo)
```javascript
// Retornava apenas um link JSON
const data = await response.json();
window.open(data.pdfLink, '_blank');
// Problema: Link temporário, formato estranho, usuário precisa escolher aplicativo
```

### ✅ Agora (Novo)
```javascript
// Retorna o arquivo PDF diretamente
const blob = await response.blob();
// Download automático com nome padronizado
// Ex: Boleto_123_Joao_Silva_2025-11-30.pdf
```

### 🎯 Benefícios
- ✅ **Nome padronizado**: Fácil de identificar e organizar
- ✅ **Download automático**: Sem necessidade de escolher aplicativo
- ✅ **Sem links temporários**: Arquivo baixado imediatamente
- ✅ **Melhor UX**: Usuário não precisa interagir, download inicia automaticamente

---

**📞 Suporte:** Em caso de dúvidas, entre em contato com a equipe de backend.

**📅 Última Atualização:** 04/11/2025 - Implementado download direto de PDF com nome padronizado
