// src/common/exception-handler.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from './exception';

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const body = exception.getResponse() as any;

    res.status(exception.getStatus()).json({
      status_code: exception.getStatus(),
      message: body.message,
      error: body.error,
      data: body.data ?? null,
    });
  }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse() as any;

    // Validation error từ ValidationPipe
    if (body?.message && Array.isArray(body.message)) {
      return res.status(400).json({
        status_code: 400,
        message: 'Invalid request data',
        error: 'VALIDATION_ERROR',
        data: body.message.map((msg: string) => ({ message: msg })),
      });
    }

    res.status(status).json({
      status_code: status,
      message: body?.message ?? 'HTTP error',
      error: status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR',
      data: null,
    });
  }
}

@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GenericExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    this.logger.error('Unhandled error', exception);

    res.status(500).json({
      status_code: 500,
      message: 'Internal server error',
      error: 'INTERNAL_SERVER_ERROR',
      data: null,
    });
  }
}
