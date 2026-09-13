import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ConfigService } from '@nestjs/config';

const isProduction = process.env.NODE_ENV === 'production';
const serverUrl = isProduction ? 'https://api.kioskfy.com' : 'http://localhost:3000';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')
    ? configService.get<string>('ALLOWED_ORIGINS')!.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://kioskfy.com',
        'https://admin.kioskfy.com',
        'https://labo.kioskfy.com',
      ];

  app.enableCors({ credentials: true, origin: allowedOrigins });

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
