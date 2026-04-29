# Como Testar a Correção de Sessões Ativas

## Passo 1: Executar o Script SQL (Opcional)

Se preferir corrigir manualmente antes de reiniciar o backend:

```bash
# No SQL Server Management Studio ou Azure Data Studio
# Execute o arquivo: CORRIGIR_SESSOES_ATIVAS_ADMIN.sql
```

## Passo 2: Reiniciar o Backend

O backend agora verifica e corrige automaticamente o grupo Administrador na inicialização.

```bash
cd backend

# Parar o backend se estiver rodando
# Ctrl+C ou:
./kill-backend.sh

# Iniciar o backend
./start-backend.sh
# OU
dotnet run --project CadastroPessoas.csproj
```

## Passo 3: Verificar os Logs

Ao iniciar, você deve ver no console:

```
🔄 Verificando configuração do grupo Administrador...
✅ Grupo Administrador encontrado (ID: X) - Configuração correta!
📊 Total de administradores ativos: X

📋 Lista de Administradores (X):
═══════════════════════════════════════════════════════
  • ID: 1 | Login: admin | Nome: Administrador
    Email: admin@example.com
    Último acesso: 20/11/2024 10:30:00

═══════════════════════════════════════════════════════

✅ Verificação do grupo Administrador concluída!
```

## Passo 4: Limpar Cache do Frontend

No navegador:

1. Abra o Console (F12)
2. Execute:
```javascript
localStorage.clear();
sessionStorage.clear();
```
3. Ou use Ctrl+Shift+Delete e limpe o cache

## Passo 5: Fazer Login Novamente

1. Acesse o sistema
2. Faça login com um usuário administrador
3. Vá para o Dashboard

## Passo 6: Verificar se o Card Aparece

No Dashboard, você deve ver o card **"Sessões Ativas"** com:
- Ícone roxo/rosa (Activity)
- Número de sessões ativas
- Texto "Em tempo real"
- Clicável para abrir o modal

## Passo 7: Testar o Modal

1. Clique no card "Sessões Ativas"
2. Deve abrir um modal mostrando:
   - Lista de usuários online
   - Nome, email, perfil
   - Tempo online
   - Página atual
   - Endereço IP

## Verificação no Console do Navegador

Execute no Console (F12):

```javascript
// Verificar permissões
const perm = JSON.parse(localStorage.getItem('permissoes'));
console.log('Grupo:', perm?.grupo);
console.log('É Admin?', perm?.grupo === 'Administrador');

// Verificar se o hook está funcionando
// (Abra o React DevTools e procure por useSessoesAtivas)
```

## Testes da API

### Teste 1: Verificar Permissões do Usuário

```bash
# Substitua USER_ID pelo ID do seu usuário
curl -X GET "http://localhost:5000/api/Permission/usuario/USER_ID" \
  -H "X-Usuario-Id: USER_ID"
```

Resposta esperada:
```json
{
  "usuarioId": 1,
  "nome": "Administrador",
  "login": "admin",
  "grupo": "Administrador",
  "semPermissao": false,
  "permissoes": [...]
}
```

### Teste 2: Buscar Sessões Ativas

```bash
# Substitua USER_ID pelo ID do seu usuário administrador
curl -X GET "http://localhost:5000/api/SessaoAtiva" \
  -H "X-Usuario-Id: USER_ID"
```

Resposta esperada:
```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "nomeUsuario": "Admin",
    "email": "admin@example.com",
    "ultimoAcesso": "2024-11-20T10:30:00",
    "perfil": "Administrador",
    "inicioSessao": "2024-11-20T10:00:00",
    "ultimaAtividade": "2024-11-20T10:30:00",
    "tempoOnline": "00:30:00",
    "enderecoIP": "192.168.1.1",
    "paginaAtual": "Dashboard"
  }
]
```

### Teste 3: Contar Sessões Ativas

```bash
curl -X GET "http://localhost:5000/api/SessaoAtiva/count" \
  -H "X-Usuario-Id: USER_ID"
```

Resposta esperada:
```json
3
```

## Troubleshooting

### Problema: Card ainda não aparece

**Solução 1:** Verificar logs do backend
```bash
# Procure por:
# "✅ Grupo Administrador encontrado"
# "📊 Total de administradores ativos: X"
```

**Solução 2:** Verificar no banco de dados
```sql
SELECT u.Id, u.Login, g.Nome as Grupo
FROM Usuarios u
INNER JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE u.Login = 'SEU_LOGIN';
```

**Solução 3:** Forçar atualização de permissões
```javascript
// No Console do navegador
localStorage.removeItem('permissoes');
// Depois faça logout e login novamente
```

### Problema: Erro 403 ao buscar sessões

**Causa:** Usuário não é reconhecido como administrador

**Solução:**
```sql
-- Verificar e corrigir manualmente
DECLARE @AdminGroupId INT;
SELECT @AdminGroupId = Id FROM GruposAcesso WHERE Nome = 'Administrador';

UPDATE Usuarios
SET GrupoAcessoId = @AdminGroupId
WHERE Login = 'SEU_LOGIN';
```

### Problema: Modal abre vazio

**Causa:** Hook não está buscando dados

**Solução:** Verificar no Console do navegador:
```
🔒 useSessoesAtivas: Usuário não é administrador, bloqueando acesso
```

Se aparecer essa mensagem, o problema é nas permissões.

## Comandos Úteis

### Promover usuário para administrador via código

Adicione temporariamente no Program.cs (após a verificação do grupo):

```csharp
// Promover usuário específico para admin (REMOVER DEPOIS!)
await AdminGroupHelper.PromoteUserToAdminAsync(context, USER_ID_AQUI);
```

### Verificar logs em tempo real

```bash
# No terminal do backend
tail -f logs/app.log

# Ou simplesmente observe o console onde o backend está rodando
```

## Checklist Final

- [ ] Backend iniciou sem erros
- [ ] Logs mostram "✅ Grupo Administrador encontrado"
- [ ] Logs listam os administradores corretamente
- [ ] Frontend: localStorage limpo
- [ ] Login realizado com sucesso
- [ ] Dashboard carregou
- [ ] Card "Sessões Ativas" está visível
- [ ] Card mostra número correto de sessões
- [ ] Modal abre ao clicar no card
- [ ] Modal mostra lista de usuários
- [ ] Lista atualiza automaticamente

## Sucesso! 🎉

Se todos os itens do checklist estão marcados, o problema foi resolvido!

O card "Sessões Ativas" agora deve aparecer para todos os administradores e atualizar automaticamente a cada 30 segundos.
