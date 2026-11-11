import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile('.env');
  const app = await NestFactory.create(AppModule);
  
  // Bật CORS để Frontend Next.js gọi API không bị chặn
  app.enableCors();

  // Bật Validation tự động từ class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('Auth and order APIs for the BrewLite coffee ordering app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDocument);

  await app.listen(3001); // Đổi sang cổng 3001 để tránh trùng cổng 3000 với Next.js
  console.log(`Backend is running on: http://localhost:3001`);
}
void bootstrap();