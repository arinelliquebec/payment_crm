# CRM Arrighi - API Backend

## 📋 Descrição
Sistema CRM desenvolvido em C# com .NET 8, utilizando ASP.NET Core Web API e Entity Framework Core para gerenciamento de pessoas físicas, jurídicas e usuários.

## 🏗️ Arquitetura

### Tecnologias Utilizadas
- **.NET 8**
- **ASP.NET Core Web API**
- **Entity Framework Core**
- **SQL Server / Azure SQL Database**
- **CORS habilitado para frontend**

### Estrutura do Projeto
```
CadastroPessoas/
├── Controllers/          # Controllers da API
├── Models/              # Modelos de dados
├── Data/                # Contexto do Entity Framework
├── Migrations/          # Migrações do banco de dados
└── Properties/          # Configurações do projeto
```

## 🗄️ Modelos de Dados

### PessoaFisica
- **Id**: Chave primária
- **Nome**: Nome completo (obrigatório, max 200 chars)
- **Email**: Email único (obrigatório, max 150 chars)
- **Codinome**: Nome alternativo (opcional, max 100 chars)
- **Sexo**: Masculino/Feminino/Outro (obrigatório)
- **DataNascimento**: Data de nascimento (obrigatório)
- **EstadoCivil**: Estado civil (opcional)
- **Cpf**: CPF único (obrigatório, 14 chars)
- **Rg**: RG (opcional, max 20 chars)
- **Cnh**: CNH (opcional, max 20 chars)
- **Telefone1**: Telefone principal (obrigatório, max 15 chars)
- **Telefone2**: Telefone secundário (opcional, max 15 chars)
- **EnderecoId**: Relacionamento com Endereco (obrigatório)
- **DataCadastro**: Data de criação automática
- **DataAtualizacao**: Data de última atualização

### PessoaJuridica
- **Id**: Chave primária
- **RazaoSocial**: Razão social (obrigatório, max 200 chars)
- **NomeFantasia**: Nome fantasia (opcional, max 200 chars)
- **Cnpj**: CNPJ único (obrigatório, 18 chars)
- **ResponsavelTecnicoId**: Relacionamento com PessoaFisica (obrigatório)
- **Email**: Email único (obrigatório, max 150 chars)
- **Telefone1**: Telefone principal (obrigatório, max 15 chars)
- **Telefone2**: Telefone secundário (opcional, max 15 chars)
- **EnderecoId**: Relacionamento com Endereco (obrigatório)
- **DataCadastro**: Data de criação automática
- **DataAtualizacao**: Data de última atualização

### Endereco
- **Id**: Chave primária
- **Cidade**: Cidade (obrigatório, max 100 chars)
- **Bairro**: Bairro (obrigatório, max 100 chars)
- **Logradouro**: Logradouro (obrigatório, max 200 chars)
- **Cep**: CEP (obrigatório, 9 chars)
- **Numero**: Número (obrigatório, max 10 chars)
- **Complemento**: Complemento (opcional, max 100 chars)

### Usuario
- **Id**: Chave primária
- **Login**: Login único (obrigatório, max 50 chars)
- **Email**: Email único (obrigatório, max 150 chars)
- **Senha**: Senha (obrigatório, max 100 chars)
- **GrupoAcesso**: Grupo de acesso (obrigatório, max 50 chars)
- **TipoPessoa**: "Fisica" ou "Juridica" (obrigatório)
- **PessoaFisicaId**: Relacionamento opcional com PessoaFisica
- **PessoaJuridicaId**: Relacionamento opcional com PessoaJuridica
- **Ativo**: Status ativo/inativo (padrão: true)
- **DataCadastro**: Data de criação automática
- **DataAtualizacao**: Data de última atualização
- **UltimoAcesso**: Data do último acesso

## 🔗 Relacionamentos

### PessoaFisica ↔ Endereco
- **Tipo**: One-to-One
- **Comportamento**: Cascade Delete
- **Restrição**: Uma PessoaFisica deve ter um Endereco

### PessoaJuridica ↔ Endereco
- **Tipo**: One-to-One
- **Comportamento**: Cascade Delete
- **Restrição**: Uma PessoaJuridica deve ter um Endereco

### PessoaJuridica ↔ PessoaFisica (Responsável Técnico)
- **Tipo**: Many-to-One
- **Comportamento**: Restrict Delete
- **Restrição**: Uma PessoaJuridica deve ter um Responsável Técnico (PessoaFisica)

### Usuario ↔ PessoaFisica
- **Tipo**: One-to-One (opcional)
- **Comportamento**: Restrict Delete
- **Restrição**: Usuário pode ser associado a uma PessoaFisica

### Usuario ↔ PessoaJuridica
- **Tipo**: One-to-One (opcional)
- **Comportamento**: Restrict Delete
- **Restrição**: Usuário pode ser associado a uma PessoaJuridica

## 🚀 Endpoints da API

### PessoaFisica
- `GET /api/PessoaFisica` - Listar todas as pessoas físicas
- `GET /api/PessoaFisica/{id}` - Obter pessoa física por ID
- `POST /api/PessoaFisica` - Criar nova pessoa física
- `PUT /api/PessoaFisica/{id}` - Atualizar pessoa física
- `DELETE /api/PessoaFisica/{id}` - Excluir pessoa física
- `GET /api/PessoaFisica/responsaveis-tecnicos` - Listar responsáveis técnicos

### PessoaJuridica
- `GET /api/PessoaJuridica` - Listar todas as pessoas jurídicas
- `GET /api/PessoaJuridica/{id}` - Obter pessoa jurídica por ID
- `POST /api/PessoaJuridica` - Criar nova pessoa jurídica
- `PUT /api/PessoaJuridica/{id}` - Atualizar pessoa jurídica
- `DELETE /api/PessoaJuridica/{id}` - Excluir pessoa jurídica

### Endereco
- `GET /api/Endereco` - Listar todos os endereços
- `GET /api/Endereco/{id}` - Obter endereço por ID
- `POST /api/Endereco` - Criar novo endereço
- `PUT /api/Endereco/{id}` - Atualizar endereço
- `DELETE /api/Endereco/{id}` - Excluir endereço

### Usuario
- `GET /api/Usuario` - Listar todos os usuários
- `GET /api/Usuario/{id}` - Obter usuário por ID
- `POST /api/Usuario` - Criar novo usuário
- `PUT /api/Usuario/{id}` - Atualizar usuário
- `DELETE /api/Usuario/{id}` - Excluir usuário
- `GET /api/Usuario/pessoas-fisicas` - Listar pessoas físicas para associação
- `GET /api/Usuario/pessoas-juridicas` - Listar pessoas jurídicas para associação

## 📝 Exemplos de Uso

### Criar Pessoa Física
```json
POST /api/PessoaFisica
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "cpf": "123.456.789-00",
  "sexo": "Masculino",
  "dataNascimento": "1990-01-01",
  "estadoCivil": "Solteiro",
  "telefone1": "(11) 99999-9999",
  "endereco": {
    "cidade": "São Paulo",
    "bairro": "Centro",
    "logradouro": "Rua das Flores",
    "cep": "01234-567",
    "numero": "123"
  }
}
```

### Criar Pessoa Jurídica
```json
POST /api/PessoaJuridica
{
  "razaoSocial": "Empresa LTDA",
  "nomeFantasia": "Empresa",
  "cnpj": "12.345.678/0001-90",
  "responsavelTecnicoId": 1,
  "email": "contato@empresa.com",
  "telefone1": "(11) 88888-8888",
  "endereco": {
    "cidade": "São Paulo",
    "bairro": "Vila Madalena",
    "logradouro": "Av. Paulista",
    "cep": "01310-100",
    "numero": "1000"
  }
}
```

### Criar Usuário
```json
POST /api/Usuario
{
  "login": "usuario123",
  "email": "usuario@email.com",
  "senha": "senha123",
  "grupoAcesso": "Administrador",
  "tipoPessoa": "Fisica",
  "pessoaFisicaId": 1
}
```

## 🗄️ Configuração do Banco de Dados

### Azure SQL Database
- **Servidor**: `frademasql.database.windows.net`
- **Banco**: `frademabr`
- **Usuário**: `frademasql`
- **Connection String**: Configurada em `appsettings.json`

### Migrações
```bash
# Criar nova migração
dotnet ef migrations add NomeDaMigracao

# Aplicar migrações
dotnet ef database update

# Remover última migração
dotnet ef migrations remove
```

## 🔧 Configuração do Projeto

### App Service
- **Nome**: `backend-arrighi`
- **Runtime**: .NET 8
- **Sistema Operacional**: Linux
- **Região**: Brazil South

### Variáveis de Ambiente
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=frademasql.database.windows.net;Database=frademabr;User Id=frademasql;Password=akiko!@#777bBhoho123;TrustServerCertificate=true;MultipleActiveResultSets=true"
  }
}
```

## 🚀 Execução

### Desenvolvimento Local
```bash
# Restaurar dependências
dotnet restore

# Compilar projeto
dotnet build

# Executar aplicação
dotnet run
```

### Produção
```bash
# Publicar para produção
dotnet publish -c Release

# Executar em produção
dotnet CadastroPessoas.dll
```

## 🔒 Validações e Restrições

### Índices Únicos
- **PessoaFisica.Cpf**: CPF deve ser único
- **PessoaFisica.Email**: Email deve ser único
- **PessoaJuridica.Cnpj**: CNPJ deve ser único
- **PessoaJuridica.Email**: Email deve ser único
- **Usuario.Login**: Login deve ser único
- **Usuario.Email**: Email deve ser único

### Regras de Negócio
- **Responsável Técnico**: PessoaJuridica deve ter um Responsável Técnico (PessoaFisica)
- **Exclusão Restrita**: Não é possível excluir PessoaFisica se for Responsável Técnico
- **Associação de Usuário**: Usuário pode ser associado a PessoaFisica OU PessoaJuridica (não ambos)
- **Cascade Delete**: Endereco é excluído automaticamente com PessoaFisica/Juridica

## 🌐 CORS
Configurado para permitir todas as origens, métodos e headers para integração com frontend.

## 📊 Status do Projeto
✅ **Concluído**: Todas as funcionalidades implementadas
✅ **Testado**: Migrações aplicadas com sucesso
✅ **Produção**: Deployado no Azure App Service
✅ **Banco de Dados**: Tabelas criadas no Azure SQL Database
- ✅ Buscar por ID