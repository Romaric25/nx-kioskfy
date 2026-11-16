import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ConfigService } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';
const serverUrl = isProduction ? 'https://api.kioskfy.com' : 'http://localhost:3000';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Expire les anciens cookies de session émis avec `Domain=kioskfy.com`
  // (avant le passage aux cookies host-only, commit f48a245). Les
  // navigateurs qui les conservent encore les envoient en doublon avec le
  // cookie host-only : la session peut échouer (session en base purgée)
  // et l'utilisateur est déconnecté à chaque rechargement. La première
  // réponse de l'API purge ces cookies chez le client.
  const legacySessionCookies = [
    '__Secure-kioskfy.session_token',
    'kioskfy.session_token',
  ];
  app.use((req: Request, res: Response, next: NextFunction) => {
    for (const name of legacySessionCookies) {
      res.append(
        'Set-Cookie',
        `${name}=; Domain=kioskfy.com; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`,
      );
    }
    next();
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const envOrigins = (configService.get<string>('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ];

  // CORS dynamique : autorise les domaines officiels, les domaines de test
  // (*.sslip.io, préfixes aléatoires générés par Coolify) et la liste explicite
  // ALLOWED_ORIGINS. Le cookie de session ne peut de toute façon être envoyé
  // que depuis un site de la même famille que l'API.
  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        // Requêtes sans Origin (SSR, curl, même origine) — autorisées.
        return callback(null, true);
      }

      const allowed =
        devOrigins.includes(origin) ||
        envOrigins.includes(origin) ||
        origin === 'https://kioskfy.com' ||
        origin.endsWith('.kioskfy.com') ||
        origin.endsWith('.sslip.io');

      callback(null, allowed);
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Kioskfy API')
    .setDescription('API pour la plateforme de vente de journaux')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(serverUrl)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Scalar avec les deux sources
  app.use(
    '/docs',
    apiReference({
      pageTitle: 'Kioskfy API Documentation',
      theme: 'purple',
      content: document,
    }),
  );

  const port = configService.get<number>('port', 3000);
  await app.listen(port);
  Logger.log(`🚀 API : http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📖 Docs : http://localhost:${port}/docs`);
}

bootstrap();
