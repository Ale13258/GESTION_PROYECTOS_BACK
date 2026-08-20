import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export type ErrorEnvelope = {
  code: string;
  message: string;
  details: unknown[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Error interno del servidor';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = this.codeFromStatus(status);
      } else if (typeof body === 'object' && body) {
        const obj = body as Record<string, unknown>;
        message = String(obj.message ?? obj.error ?? message);
        code = String(obj.code ?? this.codeFromStatus(status));
        if (Array.isArray(obj.message)) {
          details = obj.message;
          message = 'Validación fallida';
          code = 'VALIDATION_ERROR';
        } else if (Array.isArray(obj.details)) {
          details = obj.details;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    const envelope: ErrorEnvelope = { code, message, details };
    res.status(status).json(envelope);
  }

  private codeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'PAYLOAD_TOO_LARGE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'HTTP_ERROR';
  }
}
