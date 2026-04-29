import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { LoginDto, BffUserPayload } from './auth.dto';

const COOKIE_NAME = 'bff_session';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.login(dto);

    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const cookieDomain = this.configService.get<string>('cookie.domain');

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      domain: isProduction ? cookieDomain : undefined,
      maxAge: 8 * 60 * 60 * 1000, // 8 horas em ms
      path: '/',
    });

    return { success: true, user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@Req() req: Request & { user?: BffUserPayload }) {
    if (!req.user) throw new UnauthorizedException();
    const { sub, iat, exp, ...userData } = req.user;
    return { ...userData, usuarioId: sub };
  }
}
