import { Role } from '@prisma/client';

export interface QuotaLimit {
  maxExchanges: number;
  maxTokens: number;
}

export const AI_QUOTA_LIMITS: Record<Role, QuotaLimit> = {
  [Role.INSTRUCTOR]: {
    maxExchanges: 15,
    maxTokens: 100_000,
  },
  [Role.LEARNER]: {
    maxExchanges: 20, // 20 exchanges per day as specified in Phase 15 Section 8.3
    maxTokens: 40_000,
  },
  [Role.ADMIN]: {
    maxExchanges: 200,
    maxTokens: 1_000_000,
  },
};

export const AI_ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'AI_RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_REACHED: 'DAILY_LIMIT_REACHED',
} as const;
