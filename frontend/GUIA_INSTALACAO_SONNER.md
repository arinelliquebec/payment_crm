# 🎉 Guia de Instalação e Configuração do Sonner

## 📋 O que é Sonner?

Sonner é uma biblioteca moderna e elegante de toasts para React, criada por [Emil Kowalski](https://github.com/emilkowalski). É leve, acessível e com animações suaves.

---

## 📦 Passo 1: Instalação

O `package.json` já foi atualizado com Sonner. Rode:

```bash
cd frontend
pnpm install
```

---

## ⚙️ Passo 2: Adicionar o Toaster ao Layout

Você precisa adicionar o componente `<Toaster />` no layout principal da aplicação **uma única vez**.

### Opção 1: No Root Layout (Recomendado)

Edite `frontend/src/app/layout.tsx`:

```tsx
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        
        {/* Adicione o Toaster aqui */}
        <Toaster 
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
        />
      </body>
    </html>
  );
}
```

### Opção 2: Em um Provider Customizado

Se você tiver um arquivo de providers, adicione lá:

```tsx
// frontend/src/providers/ToastProvider.tsx
'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      richColors
      closeButton
      expand={false}
      duration={4000}
    />
  );
}
```

E use no layout:

```tsx
import { ToastProvider } from '@/providers/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
```

---

## 🎨 Passo 3: Configurações do Toaster

### Propriedades Disponíveis

```tsx
<Toaster 
  // Posição do toast
  position="top-right" // top-left | top-center | top-right | bottom-left | bottom-center | bottom-right
  
  // Cores ricas (verde para success, vermelho para error, etc.)
  richColors
  
  // Botão de fechar
  closeButton
  
  // Expandir toasts ao hover
  expand={false}
  
  // Duração padrão em ms
  duration={4000}
  
  // Tema (light, dark, ou system)
  theme="system"
  
  // Número máximo de toasts visíveis
  visibleToasts={3}
/>
```

---

## 🚀 Passo 4: Usando nos Componentes

### Importar

```tsx
import { toast } from 'sonner';
```

### Tipos de Toast

```tsx
// Sucesso ✅
toast.success('Usuário criado com sucesso!');

// Erro ❌
toast.error('Erro ao criar usuário');

// Informação ℹ️
toast.info('Redirecionando para cadastro...');

// Aviso ⚠️
toast.warning('Atenção: dados incompletos');

// Mensagem simples
toast('Operação realizada');
```

### Toast com Ação

```tsx
toast('Arquivo salvo', {
  action: {
    label: 'Desfazer',
    onClick: () => console.log('Desfeito'),
  },
});
```

### Toast com Duração Customizada

```tsx
toast.success('Salvo!', {
  duration: 2000, // 2 segundos
});
```

### Toast Promessa (Loading)

```tsx
const promise = fetch('/api/data');

toast.promise(promise, {
  loading: 'Carregando...',
  success: 'Dados carregados!',
  error: 'Erro ao carregar',
});
```

---

## 💡 Exemplos Práticos

### 1. Criar Usuário com Feedback

```tsx
async function criarUsuario(data: any) {
  try {
    const response = await fetch('/api/Usuario/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const erro = await response.json();
      
      if (erro.error === 'PESSOA_FISICA_NAO_ENCONTRADA') {
        // Mostrar modal de erro detalhado
        setShowErrorModal(true);
      } else {
        toast.error(erro.message || 'Erro ao criar usuário');
      }
      return;
    }

    toast.success('Usuário criado com sucesso!');
    router.push('/usuarios');
    
  } catch (err) {
    toast.error('Erro de conexão com o servidor');
  }
}
```

### 2. Deletar com Confirmação

```tsx
function deletarUsuario(id: number) {
  toast('Tem certeza que deseja deletar?', {
    action: {
      label: 'Confirmar',
      onClick: async () => {
        await fetch(`/api/Usuario/${id}`, { method: 'DELETE' });
        toast.success('Usuário deletado');
      },
    },
    cancel: {
      label: 'Cancelar',
      onClick: () => toast.info('Operação cancelada'),
    },
  });
}
```

### 3. Upload com Loading

```tsx
async function uploadArquivo(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadPromise = fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  toast.promise(uploadPromise, {
    loading: `Enviando ${file.name}...`,
    success: 'Arquivo enviado com sucesso!',
    error: 'Erro ao enviar arquivo',
  });
}
```

---

## 🎨 Customização de Cores (Opcional)

Para customizar as cores, adicione no `globals.css`:

```css
/* Sonner toast customization */
[data-sonner-toast] {
  font-family: inherit;
}

[data-sonner-toast][data-type='success'] {
  background: rgb(34 197 94);
  border-color: rgb(22 163 74);
}

[data-sonner-toast][data-type='error'] {
  background: rgb(239 68 68);
  border-color: rgb(220 38 38);
}

[data-sonner-toast][data-type='info'] {
  background: rgb(59 130 246);
  border-color: rgb(37 99 235);
}
```

---

## 🔧 Integração com ErrorPopupExample

O componente `ErrorPopupExample.tsx` já está configurado para usar Sonner:

```tsx
import { toast } from 'sonner';

// Mostrar erro genérico
toast.error('Erro ao criar usuário');

// Mostrar sucesso
toast.success('Usuário criado com sucesso!');

// Feedback ao redirecionar
toast.info('Redirecionando para cadastro...');
```

---

## ✅ Checklist de Implementação

- [ ] Rodar `pnpm install` para instalar o Sonner
- [ ] Adicionar `<Toaster />` no layout principal
- [ ] Testar import: `import { toast } from 'sonner'`
- [ ] Testar toast básico: `toast.success('Teste!')`
- [ ] Configurar posição e tema conforme preferência
- [ ] Usar o componente `ErrorPopupExample` como referência

---

## 📚 Recursos

- [Documentação Oficial do Sonner](https://sonner.emilkowalski.dev/)
- [GitHub do Sonner](https://github.com/emilkowalski/sonner)
- [Exemplos Interativos](https://sonner.emilkowalski.dev/examples)

---

## 🎉 Pronto!

Agora você tem toasts bonitos e modernos no seu projeto! 🚀

**Próximo passo:** Testar o componente `ErrorPopupExample` para ver os popups em ação.

