import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
