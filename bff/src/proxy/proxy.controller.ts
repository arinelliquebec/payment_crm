import {
  All,
  Controller,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtGuard } from '../auth/jwt.guard';
import { BffUserPayload } from '../auth/auth.dto';

@Controller('api')
@UseGuards(JwtGuard)
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async proxy(
    @Req() req: Request & { user?: BffUserPayload },
    @Res() res: Response,
  ) {
    await this.proxyService.forward(req, res);
  }
}
