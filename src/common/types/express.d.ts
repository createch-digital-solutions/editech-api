/* eslint-disable @typescript-eslint/no-namespace */
import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: Buffer;
      user?: AuthenticatedUser;
    }
  }
}
