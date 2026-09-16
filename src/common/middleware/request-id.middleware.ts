import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existingId = req.headers['x-request-id'] as string | undefined;
    const requestId =
      existingId || `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    req.id = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
