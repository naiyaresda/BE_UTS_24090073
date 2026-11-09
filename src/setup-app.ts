import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DbExceptionFilter } from './common/db-exception.filter';

export function setupApp(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.useGlobalFilters(new DbExceptionFilter());
  return app;
}
