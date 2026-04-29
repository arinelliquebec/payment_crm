# Configuração para Desenvolvimento

## Acesso Livre sem Login

Para navegar livremente pelo sistema sem precisar fazer login, siga estas instruções:

### 1. Criar arquivo .env.local

Crie um arquivo `.env.local` na pasta `frontend` com o seguinte conteúdo:

```env
# Configurações de Desenvolvimento
NODE_ENV=development
NEXT_PUBLIC_BYPASS_AUTH=true

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-for-development

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5058/api/v1
```

### 2. Reiniciar o servidor

Após criar o arquivo `.env.local`, reinicie o servidor de desenvolvimento:

```bash
cd frontend
npm run dev
```

### 3. Acessar as páginas

Agora você pode acessar diretamente:
- http://localhost:3000/contracts
- http://localhost:3000/dashboard
- http://localhost:3000/profile

### 4. Banner de Desenvolvimento

Quando o modo de bypass estiver ativo, você verá um banner amarelo no topo da página indicando "Modo Desenvolvimento - Acesso Livre".

### 5. Usuário Fake

O sistema automaticamente simula um usuário logado com:
- **Nome**: Usuário Desenvolvimento
- **Email**: dev@fradema.com.br
- **ID**: dev-user-123

### 6. Desativar o Modo de Bypass

Para voltar ao modo normal com autenticação, remova ou comente a linha:
```env
# NEXT_PUBLIC_BYPASS_AUTH=true
```

## Notas Importantes

- Este modo só funciona em desenvolvimento (`NODE_ENV=development`)
- Nunca use `NEXT_PUBLIC_BYPASS_AUTH=true` em produção
- O banner de desenvolvimento só aparece quando o bypass está ativo
- Todas as funcionalidades do sistema estarão disponíveis para teste 