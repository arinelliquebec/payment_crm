import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  LoginDto,
  DotnetLoginResponse,
  BffUserPayload,
} from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ token: string; user: Omit<BffUserPayload, 'iat' | 'exp'> }> {
    const backendUrl = this.configService.get<string>('dotnetBackendUrl');

    let dotnetResponse: DotnetLoginResponse;

    try {
      const response = await firstValueFrom(
        this.httpService.post<DotnetLoginResponse>(
          `${backendUrl}/api/Auth/login`,
          { login: dto.login, senha: dto.senha },
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );
      dotnetResponse = response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message ?? err?.response?.data ?? 'Credenciais inválidas';
      this.logger.warn(`Login falhou (status ${status}): ${JSON.stringify(message)}`);

      if (status === 400 || status === 401) {
        throw new UnauthorizedException(message);
      }

      throw err;
    }

    const payload: BffUserPayload = {
      sub: dotnetResponse.usuarioId,
      login: dotnetResponse.login,
      nome: dotnetResponse.nome,
      email: dotnetResponse.email,
      grupoAcesso: dotnetResponse.grupoAcesso,
      grupoAcessoId: dotnetResponse.grupoAcessoId,
      filialId: dotnetResponse.filialId,
      filialNome: dotnetResponse.filialNome,
      consultorId: dotnetResponse.consultorId,
      tipoPessoa: dotnetResponse.tipoPessoa,
    };

    const token = this.jwtService.sign(payload);

    const { sub, ...user } = payload;
    return { token, user: { ...user, sub } };
  }

  verifyToken(token: string): BffUserPayload {
    return this.jwtService.verify<BffUserPayload>(token);
  }
}
