import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/** Menerjemahkan error constraint database (MySQL; juga SQLite saat tes) menjadi respons HTTP yang rapi. */
@Catch(QueryFailedError)
export class DbExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const driver: any = (exception as any).driverError ?? {};
    const code: string = driver.code ?? '';
    const msg = exception.message || '';
    let status = HttpStatus.BAD_REQUEST;
    let message = 'Data tidak memenuhi constraint database';
    if (code === 'ER_DUP_ENTRY' || /UNIQUE/.test(msg)) {
      status = HttpStatus.CONFLICT;
      message = 'Data duplikat (email/nama sudah dipakai)';
    } else if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_NO_REFERENCED_ROW_2' || /FOREIGN KEY/i.test(msg)) {
      status = HttpStatus.CONFLICT;
      message = 'Data masih dipakai oleh data lain, tidak bisa dihapus';
    }
    res.status(status).json({ statusCode: status, message, error: 'Database Constraint' });
  }
}
