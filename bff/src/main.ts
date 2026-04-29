import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Cookie parser para ler cookies httpOnly
  app.use(cookieParser());

  // CORS: apenas origins do frontend
  const frontendOrigins = config.get<string[]>('frontendOrigins') ?? [];
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Usuario-Id',
      'Idempotency-Key',
    ],
    exposedHeaders: ['Content-Disposition', 'X-Convert-To-PDF', 'X-Document-Title'],
  });

  // Parsear body JSON/urlencoded antes do proxy
  const port = config.get<number>('port') ?? 3001;
  await app.listen(port);

  logger.log(`BFF rodando em http://localhost:${port}`);
  logger.log(`Encaminhando para: ${config.get<string>('dotnetBackendUrl')}`);
}

bootstrap();
