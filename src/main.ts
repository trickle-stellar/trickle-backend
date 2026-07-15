import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Trickle API')
    .setDescription('Backend API for Trickle — Continuous payment streaming on Stellar')
    .setVersion('0.1.0')
    .addTag('auth', 'Wallet-based authentication and API key management')
    .addTag('streams', 'Payment stream lifecycle and queries')
    .addTag('multistreams', 'Multi-recipient stream management')
    .addTag('vesting', 'Time-locked token release')
    .addTag('stream-nfts', 'Receiver role as transferable tokens')
    .addTag('fees', 'Protocol fee configuration and queries')
    .addTag('indexer', 'Event indexing and state sync')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Trickle API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
