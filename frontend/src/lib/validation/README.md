# Sistema de Validação e Sanitização

Este diretório contém utilitários para validação de formulários, sanitização de inputs e validação de arquivos.

## 📦 Componentes

### 1. Schemas de Validação (schemas.ts)

Schemas Zod para validação de dados estruturados.

#### Schemas Disponíveis:

- **loginSchema**: Validação de login (CPF + senha)
- **contratoSchema**: Validação completa de contratos
- **clientePessoaFisicaSchema**: Validação de cliente pessoa física
- **clientePessoaJuridicaSchema**: Validação de cliente pessoa jurídica
- **mudancaSituacaoSchema**: Validação de mudança de situação

#### Validações Customizadas:

- **cpfSchema**: Validação completa de CPF (formato + dígitos verificadores)
- **cnpjSchema**: Validação completa de CNPJ (formato + dígitos verificadores)
- **emailSchema**: Validação de email
- **telefoneSchema**: Validação de telefone (10-11 dígitos)
- **valorMonetarioSchema**: Validação de valores monetários
- **dataFuturaSchema**: Validação de datas futuras
- **dataPassadaSchema**: Validação de datas passadas

#### Exemplo de Uso:

```typescript
import { loginSchema } from "@/lib/validation/schemas";

// Validação síncrona
try {
  const data = loginSchema.parse({ cpf: "12345678901", senha: "senha123" });
  console.log("Dados válidos:", data);
} catch (error) {
  console.error("Erro de validação:", error);
}

// Validação assíncrona
const result = await loginSchema.safeParseAsync({
  cpf: "12345678901",
  senha: "senha123"
});

if (result.success) {
  console.log("Dados válidos:", result.data);
} else {
  console.error("Erros:", result.error.errors);
}
```

### 2. Sanitização de Inputs (sanitize.ts)

Funções para limpar e sanitizar dados de entrada.

#### Funções Principais:

- **sanitizeInput(input, type)**: Sanitiza string removendo HTML/scripts
  - `type: 'text'` - Remove todas as tags HTML
  - `type: 'basicHtml'` - Permite formatação básica (b, i, strong, etc)
  - `type: 'richHtml'` - Permite HTML rico (listas, links, etc)

- **sanitizeObject(obj, type)**: Sanitiza objeto recursivamente
- **sanitizeFilename(filename)**: Remove caracteres perigosos de nomes de arquivo
- **sanitizeUrl(url)**: Valida e sanitiza URLs
- **normalizeWhitespace(text)**: Normaliza espaços em branco
- **sanitizeCPF(cpf)**: Remove formatação de CPF
- **sanitizeCNPJ(cnpj)**: Remove formatação de CNPJ
- **sanitizePhone(phone)**: Remove formatação de telefone
- **sanitizeEmail(email)**: Valida e sanitiza email

#### Exemplo de Uso:

```typescript
import {
  sanitizeInput,
  sanitizeObject,
  sanitizeCPF
} from "@/lib/validation/sanitize";

// Sanitizar texto simples
const cleanText = sanitizeInput("<script>alert('xss')</script>Olá", "text");
// Resultado: "Olá"

// Sanitizar objeto
const cleanData = sanitizeObject({
  nome: "<b>João</b>",
  email: "joao@example.com",
  descricao: "<script>alert('xss')</script>Descrição"
}, "text");

// Sanitizar CPF
const cpf = sanitizeCPF("123.456.789-01");
// Resultado: "12345678901"
```

### 3. Validação de Arquivos (file-validation.ts)

Validação robusta de arquivos com verificação de magic numbers.

#### Funções Principais:

- **validateFile(file, options)**: Valida arquivo com opções customizadas
- **validatePDF(file)**: Valida arquivo PDF especificamente
- **validateImage(file)**: Valida imagem especificamente
- **validateFiles(files, options)**: Valida múltiplos arquivos
- **fileToBase64(file)**: Converte arquivo para Base64
- **validateAndConvertToBase64(file, options)**: Valida e converte em uma operação
- **formatFileSize(bytes)**: Formata tamanho de arquivo para exibição

#### Opções de Validação:

```typescript
interface FileValidationOptions {
  maxSize?: number;              // Tamanho máximo em bytes
  allowedTypes?: string[];       // Tipos MIME permitidos
  allowedExtensions?: string[]; // Extensões permitidas
  checkMagicNumbers?: boolean;  // Verificar assinatura do arquivo
}
```

#### Exemplo de Uso:

```typescript
import {
  validatePDF,
  validateAndConvertToBase64,
  formatFileSize
} from "@/lib/validation/file-validation";

// Validar PDF
const handleFileUpload = async (file: File) => {
  const result = await validatePDF(file);

  if (!result.valid) {
    console.error("Erro:", result.error);
    return;
  }

  console.log("Arquivo válido:", result.file);
};

// Validar e converter para Base64
const handleFileWithBase64 = async (file: File) => {
  const result = await validateAndConvertToBase64(file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf"],
    checkMagicNumbers: true
  });

  if (result.valid) {
    console.log("Base64:", result.base64);
  } else {
    console.error("Erro:", result.error);
  }
};

// Formatar tamanho
const size = formatFileSize(1536000);
// Resultado: "1.46 MB"
```

### 4. Hook de Validação (useFormValidation.ts)

Hook React para validação em tempo real com Zod.

#### Características:

- ✅ Validação em tempo real (onChange)
- ✅ Validação no blur
- ✅ Debounce configurável
- ✅ Controle de campos tocados
- ✅ Estado de validação por campo
- ✅ Validação de formulário completo

#### Exemplo de Uso:

```typescript
import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema } from "@/lib/validation/schemas";

function LoginForm() {
  const [formData, setFormData] = useState({ cpf: "", senha: "" });

  const validation = useFormValidation(loginSchema, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    validation.handleChange(field, value, newData);
  };

  const handleBlur = (field: string) => {
    validation.handleBlur(field, formData[field], formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    validation.touchAll(formData);
    const isValid = await validation.validateAll(formData);

    if (isValid) {
      // Enviar dados
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.cpf}
        onChange={(e) => handleChange("cpf", e.target.value)}
        onBlur={() => handleBlur("cpf")}
      />
      {validation.getFieldError("cpf") && (
        <span>{validation.getFieldError("cpf")}</span>
      )}

      {/* ... */}
    </form>
  );
}
```

## 🎨 Componentes de UI

### ValidatedInput

Componente de input com validação visual integrada.

```typescript
import { ValidatedInput } from "@/components/forms/ValidatedInput";

<ValidatedInput
  label="CPF"
  required
  error={validation.getFieldError("cpf")}
  touched={validation.touched.cpf}
  validating={validation.isFieldValidating("cpf")}
  onValueChange={(value) => handleChange("cpf", value)}
  onFieldBlur={() => handleBlur("cpf")}
  leftIcon={<User className="w-5 h-5" />}
  helperText="Digite apenas números"
/>
```

### ValidatedFileInput

Componente de upload de arquivo com validação integrada.

```typescript
import { ValidatedFileInput } from "@/components/forms/ValidatedFileInput";

<ValidatedFileInput
  label="Anexar Documento"
  required
  accept=".pdf"
  validationType="pdf"
  maxSize={10 * 1024 * 1024}
  error={validation.getFieldError("anexo")}
  touched={validation.touched.anexo}
  onFileSelect={(file, base64) => {
    setFormData(prev => ({ ...prev, anexoDocumento: base64 }));
  }}
  onValidationError={(error) => {
    console.error("Erro de validação:", error);
  }}
  helperText="PDF até 10MB"
/>
```

## 🔒 Segurança

### Proteções Implementadas:

1. **XSS Prevention**: Sanitização de HTML com DOMPurify
2. **SQL Injection**: Escape de caracteres especiais
3. **Path Traversal**: Remoção de `..` em nomes de arquivo
4. **File Upload**: Validação de magic numbers (assinatura do arquivo)
5. **Input Validation**: Validação rigorosa com Zod
6. **URL Validation**: Apenas protocolos seguros permitidos

## 📝 Boas Práticas

### 1. Sempre Sanitize Before Validate

```typescript
// ✅ Correto
const sanitizedCPF = sanitizeCPF(input);
const result = await cpfSchema.parseAsync(sanitizedCPF);

// ❌ Incorreto
const result = await cpfSchema.parseAsync(input);
```

### 2. Use Validação em Tempo Real

```typescript
// ✅ Correto - feedback imediato
const validation = useFormValidation(schema, {
  validateOnChange: true,
  validateOnBlur: true,
  debounceMs: 500
});

// ❌ Incorreto - apenas no submit
const handleSubmit = () => {
  const errors = validate(formData);
};
```

### 3. Valide Arquivos Antes de Upload

```typescript
// ✅ Correto
const result = await validatePDF(file);
if (result.valid) {
  const base64 = await fileToBase64(file);
  await uploadFile(base64);
}

// ❌ Incorreto
const base64 = await fileToBase64(file);
await uploadFile(base64); // Sem validação
```

### 4. Mostre Erros Apenas em Campos Tocados

```typescript
// ✅ Correto
{validation.getFieldError("cpf") && (
  <span>{validation.getFieldError("cpf")}</span>
)}

// ❌ Incorreto - mostra erro antes do usuário interagir
{validation.errors.cpf && (
  <span>{validation.errors.cpf}</span>
)}
```

## 🚀 Próximos Passos

- [ ] Adicionar validação de CEP
- [ ] Implementar validação de cartão de crédito
- [ ] Adicionar suporte a validação de múltiplos arquivos
- [ ] Criar componente ValidatedTextarea
- [ ] Adicionar validação de data com date-fns
