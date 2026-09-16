import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { InstructorModule } from './modules/instructor/instructor.module.js';
import { LearnerModule } from './modules/learner/learner.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { QuizzesModule } from './modules/quizzes/quizzes.module.js';
import { GamificationModule } from './modules/gamification/gamification.module.js';
import { CertificatesModule } from './modules/certificates/certificates.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AppController } from './app.controller.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    InstructorModule,
    LearnerModule,
    AiModule,
    QuizzesModule,
    GamificationModule,
    CertificatesModule,
    PaymentsModule,
    CommunityModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
