import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuditInterceptor } from './audit.interceptor';

async function bootstrap() {
  process.env.TZ = 'America/La_Paz';
  process.env.PGTZ = 'America/La_Paz';
  const app = await NestFactory.create(AppModule);

  // CORS
  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or listed origins
      if (!origin || configuredOrigins.includes(origin) || configuredOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback to allow production domain / tunnel connectivity
      }
    },
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new AuditInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('GIPAAF API')
    .setDescription('Sistema de Compras, Ventas e Inventario')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 GIPAAF Backend corriendo en http://localhost:${port}`);
  console.log(`📖 Swagger disponible en http://localhost:${port}/api`);
}
bootstrap();
