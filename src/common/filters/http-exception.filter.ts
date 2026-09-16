import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const HTTP_STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.id || `req_unknown`;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorCode = HTTP_STATUS_CODE_MAP[status] || 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: unknown = undefined;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const respObj = exceptionResponse as Record<string, unknown>;

      if (typeof respObj.code === 'string') {
        errorCode = respObj.code;
      }

      if (typeof respObj.message === 'string') {
        errorMessage = respObj.message;
      } else if (Array.isArray(respObj.message)) {
        errorCode = 'VALIDATION_ERROR';
        errorMessage = respObj.message.join(', ');
        errorDetails = respObj.message;
      }

      if (respObj.details !== undefined) {
        errorDetails = respObj.details;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} - ${status} [${errorCode}]: ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(errorDetails !== undefined ? { details: errorDetails } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }
}
