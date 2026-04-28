# Configuração do pnpm para Deploy

Este projeto foi configurado para usar **pnpm** como gerenciador de pacotes, tanto para desenvolvimento local quanto para deploy no Vercel.

## Configurações Implementadas

### 1. Arquivos de Configuração

- **`vercel.json`**: Configurado para usar `pnpm install` e `pnpm run build`
- **`.npmrc`**: Configurações específicas do pnpm
- **`pnpm-workspace.yaml`**: Configuração do workspace monorepo
- **`package.json` (raiz)**: Configuração do workspace com scripts

### 2. Comandos Disponíveis

#### Desenvolvimento Local
```bash
# Instalar dependências
pnpm install

# Executar frontend em desenvolvimento
pnpm run dev:frontend

# Executar backend
pnpm run dev:backend

# Build do frontend
pnpm run build:frontend

# Build do backend
pnpm run build:backend
```

#### Deploy no Vercel
O Vercel está configurado para:
- Usar `pnpm install` para instalar dependências
- Usar `pnpm run build` para build de produção
- Usar `pnpm run dev` para desenvolvimento

### 3. Vantagens do pnpm

- **Performance**: Instalação mais rápida que npm/yarn
- **Eficiência de espaço**: Armazenamento compartilhado de dependências
- **Segurança**: Melhor isolamento de dependências
- **Workspace**: Suporte nativo a monorepos

### 4. Estrutura do Projeto

```
monoRepoArrighiOfficial/
├── package.json              # Workspace raiz
├── pnpm-workspace.yaml       # Configuração do workspace
├── frontend/
│   ├── package.json          # Dependências do frontend
│   ├── .npmrc               # Configurações do pnpm
│   └── vercel.json          # Configuração do Vercel
└── backend/
    └── CadastroPessoas.csproj
```

### 5. Deploy

O projeto está pronto para deploy no Vercel com pnpm. As configurações garantem:
- Instalação correta das dependências
- Build otimizado para produção
- Configuração de ambiente adequada

## Troubleshooting

Se houver problemas com o deploy:

1. **Verificar variáveis de ambiente** no Vercel
2. **Confirmar versão do Node.js** (recomendado: 18+)
3. **Verificar logs de build** no painel do Vercel
4. **Testar build local** com `pnpm run build:frontend`
