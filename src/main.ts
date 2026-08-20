import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function createApp() {
  process.env.TZ = process.env.TZ || 'America/Bogota';

  const app = await NestFactory.create(AppModule, { cors: false });
  const prefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(prefix);

  const extraOrigins = [
    'http://localhost:4200',
    'https://promanage-engineering.web.app',
    'https://preubaproyecto.web.app',
  ];
  const origin = [
    ...new Set(
      `${process.env.CORS_ORIGIN || ''}`
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .concat(extraOrigins),
    ),
  ];
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('ProManage Engineering API')
    .setDescription('API REST /api/v1 — proyectos PTAR, inventario, cotizaciones y SAE')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger), {
    useGlobalPrefix: false,
  });

  return app;
}

async function bootstrap() {
  const app = await createApp();
  const prefix = process.env.API_PREFIX || 'api/v1';
  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ProManage API http://localhost:${port}/${prefix}  docs=/docs`);
}

let cachedHandler: ((req: unknown, res: unknown) => unknown) | undefined;

export default async function handler(req: unknown, res: unknown) {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance() as (req: unknown, res: unknown) => unknown;
  }
  return cachedHandler!(req, res);
}

if (!process.env.VERCEL) {
  void bootstrap();
}
