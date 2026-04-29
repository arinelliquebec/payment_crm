import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { BffUserPayload } from './auth.dto';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: BffUserPayload }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Sessão não encontrada. Faça login novamente.');
    }

    try {
      const payload = this.jwtService.verify<BffUserPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
  }

  private extractToken(request: Request): string | undefined {
    // Prioridade: cookie httpOnly → Authorization header (para compatibilidade)
    const cookieToken = (request.cookies as Record<string, string>)?.['bff_session'];
    if (cookieToken) return cookieToken;

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
