import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.id || `req_unknown`;

    return next.handle().pipe(
      map((response: unknown) => {
        // If response is primitive or null/undefined
        if (
          response === null ||
          response === undefined ||
          typeof response !== 'object'
        ) {
          return {
            success: true,
            data: response,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        const resObj = response as Record<string, unknown>;

        // Handle pre-formatted paginated responses: { data: [...], pagination: { ... } }
        if ('data' in resObj && 'pagination' in resObj) {
          const { data, pagination, ...rest } = resObj;
          return {
            success: true,
            data,
            pagination,
            ...rest,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        // If response is already an envelope with success flag
        if ('success' in resObj && 'data' in resObj) {
          const existingMeta =
            typeof resObj.meta === 'object' && resObj.meta !== null
              ? (resObj.meta as Record<string, unknown>)
              : {};
          return {
            ...resObj,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
              ...existingMeta,
            },
          };
        }

        // Standard object wrapping
        return {
          success: true,
          data: response,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}
