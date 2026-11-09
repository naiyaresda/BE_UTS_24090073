import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gym API jalan di http://localhost:${port}`);
}
bootstrap();
