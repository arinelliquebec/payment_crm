import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { BffUserPayload } from '../auth/auth.dto';
import { JwtService } from '@nestjs/jwt';

const COOKIE_NAME = 'bff_session';

// Headers que não devem ser repassados ao backend
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async forward(
    req: Request & { user?: BffUserPayload },
    res: Response,
  ): Promise<void> {
    const backendUrl = this.configService.get<string>('dotnetBackendUrl');

    // Reconstrói o path: /api/Cliente → /api/Cliente
    const targetPath = req.url;
    const targetUrl = `${backendUrl}${targetPath}`;

    // Extrai o token do cookie para repassar ao .NET como Bearer
    const cookieToken = (req.cookies as Record<string, string>)?.[COOKIE_NAME];
    const bearerToken = cookieToken ?? this.extractBearerFromHeader(req);

    // Monta headers limpos
    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && typeof value === 'string') {
        forwardHeaders[key] = value;
      }
    }

    if (bearerToken) {
      forwardHeaders['Authorization'] = `Bearer ${bearerToken}`;
    }

    // Injeta identificadores do usuário autenticado para auditoria no .NET
    if (req.user) {
      forwardHeaders['X-Usuario-Id'] = String(req.user.sub);
      forwardHeaders['X-Usuario-Login'] = req.user.login;
    }

    const config: AxiosRequestConfig = {
      method: req.method as AxiosRequestConfig['method'],
      url: targetUrl,
      headers: forwardHeaders,
      data: ['GET', 'HEAD', 'DELETE'].includes(req.method.toUpperCase()) ? undefined : req.body,
      params: req.query,
      responseType: 'arraybuffer',
      validateStatus: () => true, // repassa todos os status sem lançar erro
      maxRedirects: 0,
      timeout: 30_000,
    };

    this.logger.debug(`${req.method} ${targetUrl}`);

    let axiosRes: AxiosResponse<Buffer>;
    try {
      axiosRes = await firstValueFrom(
        this.httpService.request<Buffer>(config),
      );
    } catch (err: any) {
      this.logger.error(`Erro ao encaminhar ${req.method} ${targetUrl}: ${err.message}`);
      res.status(502).json({ message: 'BFF: falha ao contatar o backend', detail: err.message });
      return;
    }

    // Repassa status e headers de resposta
    res.status(axiosRes.status);

    for (const [key, value] of Object.entries(axiosRes.headers)) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value as string);
      }
    }

    res.send(axiosRes.data);
  }

  private extractBearerFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
