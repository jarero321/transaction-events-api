import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './infrastructure/http/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 8080;

  await app.listen(port);

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Transaction API started on port ${port}`,
    service: 'transaction-api',
  }));
}

bootstrap();
