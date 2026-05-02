# Arquitetura BFF com NestJS + Nx para CRM Arrighi

> ⚠️ **DEPRECATED.** This document describes the legacy NestJS BFF architecture. The project is migrating to a Next.js server-side orchestration layer plus a thin Go API gateway. See:
> - `docs/adr/0001-bff-deprecation.md` — decision and rationale
> - `docs/architecture/target-architecture.md` — target topology and request flows
> - `frontend/src/server/README.md` — Next.js server-side conventions
>
> Kept for historical context only. Do not extend.

## Visão Geral da Nova Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                         │
│                  localhost:3000 ou arrighi.com                   │
│                                                                  │
│  - UI Components (React)                                         │
│  - Clean Architecture (já implementada)                          │
│  - State Management                                              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│              BFF - Backend for Frontend (NestJS)                 │
│                    localhost:4000 ou api.arrighi.com             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Responsabilidades do BFF:                                 │ │
│  │                                                             │ │
│  │  ✓ Agregação de dados de múltiplos endpoints              │ │
│  │  ✓ Transformação de dados (Backend → Frontend)            │ │
│  │  ✓ Cache inteligente (Redis)                              │ │
│  │  ✓ Rate limiting por usuário                              │ │
│  │  ✓ Autenticação/Autorização (JWT)                         │ │
│  │  ✓ Validação de entrada                                   │ │
│  │  ✓ Logs e monitoramento                                   │ │
│  │  ✓ WebSockets para real-time                              │ │
│  │  ✓ Upload de arquivos                                     │ │
│  │  ✓ Geração de relatórios                                  │ │
│  │  ✓ Integração com serviços externos                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│           BACKEND MONOLITO (.NET 10)                             │
│              localhost:5000 ou backend.arrighi.com               │
│                                                                  │
│  - Business Logic                                                │
│  - Database Access (SQL Server)                                  │
│  - Domain Models                                                 │
│  - Validações de negócio                                         │
│  - Integridade de dados                                          │
└──────────────────────────────────────────────────────────────────┘
```

## Estrutura do Monorepo Nx

```
arrighi-crm/
├── apps/
│   ├── frontend/                    # Next.js 16 (já existe)
│   │   ├── src/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── bff/                         # NestJS BFF (novo)
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── clientes/
│       │   │   ├── contratos/
│       │   │   ├── consultores/
│       │   │   ├── usuarios/
│       │   │   └── dashboard/
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── filters/
│       │   │   └── decorators/
│       │   └── config/
│       ├── test/
│       └── package.json
│
├── libs/                            # Bibliotecas compartilhadas
│   ├── shared/
│   │   ├── types/                   # Types compartilhados
│   │   │   ├── cliente.types.ts
│   │   │   ├── contrato.types.ts
│   │   │   └── usuario.types.ts
│   │   ├── dtos/                    # DTOs compartilhados
│   │   ├── constants/
│   │   └── utils/
│   │
│   ├── backend-client/              # Cliente HTTP para .NET
│   │   ├── src/
│   │   │   ├── cliente.client.ts
│   │   │   ├── contrato.client.ts
│   │   │   └── auth.client.ts
│   │   └── package.json
│   │
│   └── cache/                       # Estratégias de cache
│       ├── src/
│       │   ├── redis.service.ts
│       │   └── cache.decorator.ts
│       └── package.json
│
├── nx.json
├── package.json
├── tsconfig.base.json
└── .env.example
```

## O que fica no BFF vs Backend .NET

### 🟢 BFF (NestJS) - Responsabilidades

#### 1. Agregação de Dados
```typescript
// Exemplo: Dashboard que precisa de dados de múltiplos endpoints
@Get('dashboard/overview')
async getDashboardOverview(@User() user) {
  const [clientes, contratos, atividades, estatisticas] = await Promise.all([
    this.backendClient.getClientes({ limit: 10 }),
    this.backendClient.getContratos({ status: 'ativo' }),
    this.backendClient.getAtividades({ userId: user.id }),
    this.backendClient.getEstatisticas()
  ]);

  return {
    clientes: this.transformClientes(clientes),
    contratos: this.transformContratos(contratos),
    atividades,
    estatisticas
  };
}
```

#### 2. Transformação de Dados
```typescript
// Backend .NET retorna estrutura complexa
// BFF simplifica para o frontend
transformCliente(backendCliente: BackendCliente): FrontendCliente {
  return {
    id: backendCliente.id,
    nome: backendCliente.pessoaFisica?.nome || backendCliente.pessoaJuridica?.razaoSocial,
    email: backendCliente.pessoaFisica?.emailEmpresarial || backendCliente.pessoaJuridica?.email,
    documento: backendCliente.pessoaFisica?.cpf || backendCliente.pessoaJuridica?.cnpj,
    documentoFormatado: this.formatDocument(backendCliente),
    tipo: backendCliente.tipoPessoa === 'Fisica' ? 'PF' : 'PJ',
    status: backendCliente.status.toLowerCase(),
    valorContrato: backendCliente.valorContrato,
    filial: {
      id: backendCliente.filialId,
      nome: backendCliente.filialNavigation?.nome
    }
  };
}
```

#### 3. Cache Inteligente
```typescript
@Get('clientes')
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutos
async getClientes(@Query() filters: ClienteFilters) {
  return this.backendClient.getClientes(filters);
}

@Post('clientes')
async createCliente(@Body() dto: CreateClienteDto) {
  const result = await this.backendClient.createCliente(dto);
  // Invalida cache relacionado
  await this.cacheManager.del('clientes:*');
  return result;
}
```

#### 4. Autenticação e Autorização
```typescript
@Post('auth/login')
async login(@Body() credentials: LoginDto) {
  // Autentica no backend .NET
  const user = await this.backendClient.login(credentials);

  // Gera JWT próprio do BFF
  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.grupoAcesso
  });

  // Armazena sessão no Redis
  await this.redis.set(`session:${user.id}`, JSON.stringify(user), 'EX', 3600);

  return { token, user };
}
```

#### 5. Rate Limiting
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests por minuto
@Get('clientes')
async getClientes() {
  return this.backendClient.getClientes();
}
```

#### 6. WebSockets para Real-time
```typescript
@WebSocketGateway()
export class NotificationsGateway {
  @SubscribeMessage('subscribe:atividades')
  handleSubscribe(@ConnectedSocket() client: Socket) {
    // Cliente se inscreve para receber atualizações em tempo real
  }

  // Quando algo muda no backend, notifica clientes conectados
  notifyAtividadeCreated(atividade: Atividade) {
    this.server.emit('atividade:created', atividade);
  }
}
```

#### 7. Upload de Arquivos
```typescript
@Post('contratos/:id/anexos')
@UseInterceptors(FileInterceptor('file'))
async uploadAnexo(
  @Param('id') contratoId: number,
  @UploadedFile() file: Express.Multer.File
) {
  // Valida arquivo
  this.validateFile(file);

  // Upload para S3/Azure Blob
  const url = await this.storageService.upload(file);

  // Registra no backend .NET
  return this.backendClient.addAnexo(contratoId, { url, nome: file.originalname });
}
```

### 🔵 Backend .NET - Responsabilidades (mantém)

#### 1. Business Logic
- Validações de negócio complexas
- Regras de domínio
- Cálculos financeiros
- Workflows

#### 2. Acesso a Dados
- CRUD no SQL Server
- Transações
- Stored Procedures
- Entity Framework

#### 3. Integridade
- Constraints de banco
- Validações de unicidade
- Relacionamentos


## Configuração de Variáveis de Ambiente

### Frontend (.env.local)
```bash
# Antes (apontava direto para .NET)
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Depois (aponta para BFF)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Produção
# NEXT_PUBLIC_API_URL=https://api.arrighi.com/api
# NEXT_PUBLIC_WS_URL=wss://api.arrighi.com
```

### BFF (.env)
```bash
# Servidor
PORT=4000
NODE_ENV=development

# Backend .NET (NOVO - BFF se comunica com .NET)
BACKEND_API_URL=http://localhost:5000/api
BACKEND_TIMEOUT=30000

# JWT
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRATION=1h

# Redis (Cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,png

# Storage (S3/Azure)
STORAGE_TYPE=local  # local, s3, azure
AWS_S3_BUCKET=arrighi-crm-files
AWS_REGION=us-east-1

# Logs
LOG_LEVEL=debug
```

### Backend .NET (appsettings.json) - MUDA POUCO
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ArrighiCRM;..."
  },
  "Jwt": {
    "Secret": "mesmo-secret-do-bff",
    "Issuer": "ArrighiCRM",
    "Audience": "ArrighiCRM"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:4000",  // ADICIONA BFF
      "http://localhost:3000",  // Mantém frontend (dev)
      "https://arrighi.com",
      "https://api.arrighi.com"
    ]
  }
}
```

## Implementação Passo a Passo

### Passo 1: Configurar Nx Workspace

```bash
# Criar workspace Nx (se ainda não existe)
npx create-nx-workspace@latest arrighi-crm --preset=empty

cd arrighi-crm

# Adicionar plugins
npm install -D @nx/next @nx/nest

# Mover frontend existente para apps/frontend
# (ou criar novo)
nx g @nx/next:app frontend

# Criar BFF
nx g @nx/nest:app bff
```

### Passo 2: Estrutura do BFF

```typescript
// apps/bff/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Prefixo global
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 4000);
  console.log(`🚀 BFF running on http://localhost:${process.env.PORT || 4000}`);
}
bootstrap();
```

```typescript
// apps/bff/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { BackendClientModule } from '@arrighi/backend-client';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Cache (Redis)
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 300, // 5 minutos default
    }),

    // Rate Limiting
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),

    // Módulos de negócio
    AuthModule,
    ClientesModule,
    ContratosModule,
    BackendClientModule,
  ],
})
export class AppModule {}
```

### Passo 3: Módulo de Clientes (Exemplo Completo)

```typescript
// apps/bff/src/modules/clientes/clientes.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, ClienteFiltersDto } from './dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  async findAll(@Query() filters: ClienteFiltersDto) {
    return this.clientesService.findAll(filters);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // 1 minuto
  async findOne(@Param('id') id: number) {
    return this.clientesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.clientesService.remove(id);
  }

  // Endpoint agregado - combina dados de múltiplas fontes
  @Get(':id/detalhes-completos')
  async getDetalhesCompletos(@Param('id') id: number) {
    return this.clientesService.getDetalhesCompletos(id);
  }
}
```

```typescript
// apps/bff/src/modules/clientes/clientes.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BackendClientService } from '@arrighi/backend-client';
import { CreateClienteDto, UpdateClienteDto, ClienteFiltersDto } from './dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly backendClient: BackendClientService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(filters: ClienteFiltersDto) {
    // Busca do backend .NET
    const clientes = await this.backendClient.get('/Cliente', { params: filters });
    
    // Transforma para formato do frontend
    return clientes.map(this.transformCliente);
  }

  async findOne(id: number) {
    const cliente = await this.backendClient.get(`/Cliente/${id}`);
    return this.transformCliente(cliente);
  }

  async create(dto: CreateClienteDto) {
    const cliente = await this.backendClient.post('/Cliente', dto);
    
    // Invalida cache
    await this.invalidateCache();
    
    return this.transformCliente(cliente);
  }

  async update(id: number, dto: UpdateClienteDto) {
    const cliente = await this.backendClient.put(`/Cliente/${id}`, dto);
    
    // Invalida cache
    await this.invalidateCache();
    await this.cacheManager.del(`cliente:${id}`);
    
    return this.transformCliente(cliente);
  }

  async remove(id: number) {
    await this.backendClient.delete(`/Cliente/${id}`);
    await this.invalidateCache();
  }

  // Agregação de dados
  async getDetalhesCompletos(id: number) {
    const [cliente, contratos, atividades] = await Promise.all([
      this.backendClient.get(`/Cliente/${id}`),
      this.backendClient.get(`/Contrato`, { params: { clienteId: id } }),
      this.backendClient.get(`/Atividade`, { params: { clienteId: id } }),
    ]);

    return {
      cliente: this.transformCliente(cliente),
      contratos: contratos.map(this.transformContrato),
      atividades,
      estatisticas: {
        totalContratos: contratos.length,
        valorTotal: contratos.reduce((sum, c) => sum + c.valorDevido, 0),
        ultimaAtividade: atividades[0]?.dataCadastro,
      },
    };
  }

  private transformCliente(backendCliente: any) {
    return {
      id: backendCliente.id,
      nome: backendCliente.pessoaFisica?.nome || backendCliente.pessoaJuridica?.razaoSocial,
      email: backendCliente.pessoaFisica?.emailEmpresarial || backendCliente.pessoaJuridica?.email,
      documento: backendCliente.pessoaFisica?.cpf || backendCliente.pessoaJuridica?.cnpj,
      tipo: backendCliente.tipoPessoa === 'Fisica' ? 'PF' : 'PJ',
      status: backendCliente.status?.toLowerCase() || 'ativo',
      valorContrato: backendCliente.valorContrato,
      filial: {
        id: backendCliente.filialId,
        nome: backendCliente.filialNavigation?.nome || 'Não informada',
      },
      telefones: [
        backendCliente.pessoaFisica?.telefone1 || backendCliente.pessoaJuridica?.telefone1,
        backendCliente.pessoaFisica?.telefone2 || backendCliente.pessoaJuridica?.telefone2,
      ].filter(Boolean),
      dataCadastro: backendCliente.dataCadastro,
    };
  }

  private transformContrato(backendContrato: any) {
    // Transformação similar
    return backendContrato;
  }

  private async invalidateCache() {
    const keys = await this.cacheManager.store.keys('clientes:*');
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
```

### Passo 4: Cliente HTTP para Backend .NET

```typescript
// libs/backend-client/src/lib/backend-client.service.ts
import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class BackendClientService {
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get('BACKEND_API_URL'),
      timeout: this.configService.get('BACKEND_TIMEOUT', 30000),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logs
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Backend] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Interceptor para erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[Backend Error]', error.response?.data || error.message);
        throw new HttpException(
          error.response?.data || 'Backend error',
          error.response?.status || 500,
        );
      },
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Método para adicionar token de autenticação
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}
```


### Passo 5: Autenticação JWT no BFF

```typescript
// apps/bff/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BackendClientService } from '@arrighi/backend-client';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly backendClient: BackendClientService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      // Autentica no backend .NET
      const response = await this.backendClient.post('/Auth/login', loginDto);
      
      if (!response || !response.usuarioId) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Gera JWT próprio do BFF
      const payload = {
        sub: response.usuarioId,
        email: response.email,
        nome: response.nome,
        grupoAcesso: response.grupoAcesso,
      };

      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: {
          id: response.usuarioId,
          nome: response.nome,
          email: response.email,
          grupoAcesso: response.grupoAcesso,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Erro ao fazer login');
    }
  }

  async validateUser(userId: number) {
    // Busca usuário no backend
    return this.backendClient.get(`/Usuario/${userId}`);
  }

  async refreshToken(userId: number) {
    const user = await this.validateUser(userId);
    
    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      grupoAcesso: user.grupoAcesso,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

```typescript
// apps/bff/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      grupoAcesso: payload.grupoAcesso,
    };
  }
}
```

### Passo 6: WebSocket para Real-time

```typescript
// apps/bff/src/modules/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string[]>(); // userId -> socketIds

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove da lista de usuários conectados
    this.connectedUsers.forEach((sockets, userId) => {
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe:atividades')
  handleSubscribeAtividades(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const sockets = this.connectedUsers.get(data.userId) || [];
    sockets.push(client.id);
    this.connectedUsers.set(data.userId, sockets);
    
    client.join(`user:${data.userId}`);
    return { event: 'subscribed', data: { channel: 'atividades' } };
  }

  // Método para notificar usuários específicos
  notifyUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Método para broadcast
  notifyAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Exemplo: notificar quando um contrato muda de situação
  notifyContratoUpdated(contratoId: number, userId: number, data: any) {
    this.notifyUser(userId, 'contrato:updated', {
      contratoId,
      ...data,
    });
  }
}
```

### Passo 7: Atualizar Frontend para usar BFF

```typescript
// apps/frontend/src/lib/api.ts (ATUALIZADO)
import { getApiUrl } from '../../env.config';

// Agora aponta para o BFF
const API_BASE_URL = getApiUrl(); // http://localhost:4000/api

class ApiClient {
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('token') 
        : null;

      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: errorText || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      // Para status 204 (No Content)
      if (response.status === 204) {
        return { data: undefined, status: response.status };
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

```typescript
// apps/frontend/src/lib/websocket.ts (NOVO)
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribe(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  unsubscribe(event: string) {
    this.socket?.off(event);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export const wsClient = new WebSocketClient();
```

```typescript
// apps/frontend/src/hooks/useRealtimeAtividades.ts (NOVO)
import { useEffect, useState } from 'react';
import { wsClient } from '@/lib/websocket';

export function useRealtimeAtividades(userId: number) {
  const [atividades, setAtividades] = useState<any[]>([]);

  useEffect(() => {
    // Conecta ao WebSocket
    const token = localStorage.getItem('token');
    if (token) {
      wsClient.connect(token);
      
      // Inscreve no canal de atividades
      wsClient.emit('subscribe:atividades', { userId });

      // Escuta novas atividades
      wsClient.subscribe('atividade:created', (atividade) => {
        setAtividades(prev => [atividade, ...prev]);
      });
    }

    return () => {
      wsClient.unsubscribe('atividade:created');
    };
  }, [userId]);

  return { atividades };
}
```

## Vantagens da Arquitetura com BFF

### 1. Performance
- ✅ Cache inteligente no BFF (Redis)
- ✅ Agregação de dados (1 request frontend → múltiplos requests backend)
- ✅ Compressão de respostas
- ✅ Rate limiting

### 2. Segurança
- ✅ Backend .NET não exposto diretamente
- ✅ Validação dupla (BFF + Backend)
- ✅ Rate limiting por usuário
- ✅ JWT gerenciado pelo BFF

### 3. Flexibilidade
- ✅ Transformação de dados sem alterar backend
- ✅ Versionamento de API independente
- ✅ Fácil adicionar novos endpoints agregados
- ✅ WebSockets para real-time

### 4. Manutenibilidade
- ✅ Frontend desacoplado do backend
- ✅ Mudanças no backend não quebram frontend
- ✅ Logs centralizados no BFF
- ✅ Monitoramento facilitado

### 5. Escalabilidade
- ✅ BFF pode escalar horizontalmente
- ✅ Cache reduz carga no backend
- ✅ Load balancing no BFF

## Comandos Nx

```bash
# Rodar frontend
nx serve frontend

# Rodar BFF
nx serve bff

# Rodar ambos
nx run-many --target=serve --projects=frontend,bff

# Build para produção
nx build frontend
nx build bff

# Testes
nx test bff
nx test frontend

# Lint
nx lint bff
nx lint frontend
```

## Deploy

### Docker Compose (Desenvolvimento)

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://bff:4000/api
    depends_on:
      - bff

  bff:
    build:
      context: .
      dockerfile: apps/bff/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - BACKEND_API_URL=http://backend:5000/api
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    image: arrighi-backend-dotnet:latest
    ports:
      - "5000:5000"
    environment:
      - ConnectionStrings__DefaultConnection=${DB_CONNECTION}
```

### Produção (Kubernetes/Cloud)

```
Frontend (Next.js) → Vercel/AWS Amplify
BFF (NestJS) → AWS ECS/Fargate ou Kubernetes
Redis → AWS ElastiCache ou Redis Cloud
Backend .NET → Mantém onde está
```

## Resumo das Mudanças

### ✅ Frontend
- Aponta para BFF ao invés do backend .NET
- Adiciona WebSocket para real-time
- Mantém Clean Architecture implementada

### ✅ BFF (Novo)
- Agregação de dados
- Cache (Redis)
- Autenticação JWT
- Rate limiting
- WebSockets
- Upload de arquivos
- Transformação de dados

### ✅ Backend .NET
- CORS adiciona BFF
- Mantém toda lógica de negócio
- Mantém acesso a dados
- Pode remover CORS do frontend (opcional)

### ✅ Infraestrutura
- Adiciona Redis
- Adiciona BFF server
- Mantém tudo mais igual

## Próximos Passos

1. ✅ Configurar Nx workspace
2. ✅ Criar BFF com NestJS
3. ✅ Implementar módulo de Clientes no BFF
4. ✅ Configurar Redis
5. ✅ Implementar autenticação JWT
6. ✅ Adicionar WebSockets
7. ✅ Atualizar frontend para usar BFF
8. ✅ Testar integração completa
9. ✅ Deploy

---

**Quer que eu crie os arquivos de configuração do Nx e a estrutura inicial do BFF?**
