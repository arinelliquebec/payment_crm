# Implementação das Filiais no Formulário de Consultor

## Resumo

Implementada funcionalidade para buscar filiais disponíveis do backend e exibi-las como opções no campo filial do formulário de novo consultor.

## Arquivos Modificados

### 1. Backend (já existia)
- **`backend/Controllers/FilialController.cs`**: Endpoint `GET: api/Filial` para buscar todas as filiais
- **`backend/Models/Filial.cs`**: Modelo da entidade Filial

### 2. Frontend (novos/modificados)
- **`frontend/src/hooks/useFiliais.ts`**: Novo hook para buscar filiais do backend
- **`frontend/src/hooks/index.ts`**: Exportação do novo hook
- **`frontend/src/components/forms/ConsultorForm.tsx`**: Campo filial convertido de input para select

## Funcionalidades Implementadas

### 1. Hook useFiliais
- Busca filiais do endpoint `/api/Filial`
- Gerencia estados de loading, error e dados
- Tratamento de erros robusto
- Logs de debug para troubleshooting

### 2. Campo Filial no Formulário
- **Antes**: Input de texto livre
- **Depois**: Select com opções do backend
- Loading spinner durante carregamento
- Tratamento de erros de carregamento
- Validação mantida (campo obrigatório)

### 3. Filiais Disponíveis
O backend retorna as seguintes filiais:
- Belo Horizonte - BH
- Brasília - DF
- Campinas - SP
- Curitiba - PR
- Joinville - SC
- Manaus - AM
- Nova Iorque - NY
- Orlando - FL
- Recife - PE
- Ribeirão Preto - SP
- Rio de Janeiro - RJ
- Salvador - BA
- São Paulo - SP
- Vitória - ES
- Zona da Mata Mineira - MG

## Benefícios

1. **Consistência**: Garante que apenas filiais válidas sejam selecionadas
2. **Usabilidade**: Interface mais intuitiva com dropdown
3. **Manutenibilidade**: Filiais centralizadas no backend
4. **Validação**: Reduz erros de digitação
5. **Performance**: Dados carregados uma vez e reutilizados

## Como Usar

1. Abrir formulário de novo consultor
2. Campo "Filial" agora é um dropdown
3. Selecionar uma das filiais disponíveis
4. Formulário valida se uma filial foi selecionada

## Testes

- ✅ Build do frontend funcionando
- ✅ Endpoint do backend respondendo
- ✅ Hook carregando dados corretamente
- ✅ Formulário renderizando select com opções
