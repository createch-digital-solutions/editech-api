import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { RolesGuard } from '../../src/common/guards/roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: unknown): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when role is required but user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when user role does not match required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext({
      id: 'u1',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user role matches one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.INSTRUCTOR, Role.ADMIN]);
    const context = createMockContext({
      id: 'u1',
      role: Role.INSTRUCTOR,
      status: UserStatus.ACTIVE,
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
