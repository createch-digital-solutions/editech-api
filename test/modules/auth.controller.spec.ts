/* eslint-disable @typescript-eslint/unbound-method */
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { AuthController } from '../../src/modules/auth/auth.controller.js';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { PrismaService } from '../../src/modules/prisma/prisma.service.js';
import type { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-1',
    clerkId: 'user_clerk_123',
    email: 'adaeze@createch.example.com',
    firstName: 'Adaeze',
    lastName: 'Okonkwo',
    role: Role.LEARNER,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getHealth: jest
              .fn()
              .mockReturnValue({ status: 'ok', module: 'auth' }),
            getMe: jest.fn().mockResolvedValue(mockUser),
            updateUserRole: jest.fn().mockResolvedValue({
              id: 'user-uuid-1',
              email: 'adaeze@createch.example.com',
              role: Role.INSTRUCTOR,
            }),
            handleClerkWebhook: jest.fn().mockResolvedValue({ synced: true }),
            provisionUser: jest.fn().mockResolvedValue({
              success: true,
              message: 'User provisioned successfully',
              role: Role.LEARNER,
              status: UserStatus.ACTIVE,
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok', module: 'auth' });
  });

  it('should provision user on provision', async () => {
    const result = await controller.provision({
      clerkId: 'user_clerk_123',
    });

    expect(result).toEqual({
      success: true,
      message: 'User provisioned successfully',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
    });
    expect(authService.provisionUser).toHaveBeenCalledWith('user_clerk_123');
  });

  it('should return current user profile on getMe', async () => {
    const result = await controller.getMe(mockUser);
    expect(result).toEqual(mockUser);
    expect(authService.getMe).toHaveBeenCalledWith(mockUser.id);
  });

  it('should update user role on updateRole', async () => {
    const adminUser: AuthenticatedUser = {
      ...mockUser,
      id: 'admin-uuid',
      role: Role.ADMIN,
    };

    const result = await controller.updateRole(adminUser, {
      userId: 'user-uuid-1',
      role: Role.INSTRUCTOR,
    });

    expect(result).toEqual({
      id: 'user-uuid-1',
      email: 'adaeze@createch.example.com',
      role: Role.INSTRUCTOR,
    });
    expect(authService.updateUserRole).toHaveBeenCalledWith(
      'user-uuid-1',
      Role.INSTRUCTOR,
    );
  });
});
