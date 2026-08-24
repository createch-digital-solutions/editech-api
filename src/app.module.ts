import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
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
})
export class AppModule {}
