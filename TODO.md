# Createch API — Deferred Work & Backlog (TODOs)

This file tracks all deferred work and mirrors inline `// TODO:` comments across the backend codebase. Grouped by priority based on the MVP Definition.

---

## MUST (Phase 5 MVP Core)
- [ ] `src/modules/auth/auth.controller.ts`: Implement Clerk webhook event handling (`user.created`, `user.updated`, `user.deleted`) to sync users into PostgreSQL.
- [ ] `prisma/schema.prisma`: Expand foundational data models (`User`, `Course`, `Enrolment`) with lessons, modules, quiz questions, payments ledger, and review ratings during Phase 6 PRD data modeling.
- [ ] `src/modules/courses/courses.service.ts`: Implement course creation, publishing lifecycle, and public catalog search filtering.
- [ ] `src/modules/learner/learner.service.ts`: Implement course enrollment enrollment flow and progress tracking.
- [ ] `src/modules/instructor/instructor.service.ts`: Implement instructor course draft management and curriculum structuring.
- [ ] `src/modules/payments/payments.service.ts`: Implement Paystack charge initialization and webhook signature verification for Naira payments.
- [ ] `src/modules/ai/ai.service.ts`: Implement AI course curriculum generation pipeline via OpenAI client wrapper.
- [ ] `src/common/guards/roles.guard.ts`: Enforce `@Roles()` metadata guard against Clerk JWT claims.

---

## SHOULD (MVP Enhancements)
- [ ] `src/modules/payments/payments.service.ts`: Implement Stripe checkout sessions for international USD payments.
- [ ] `src/modules/ai/ai.service.ts`: Implement Anthropic Claude AI tutor conversational streaming endpoint.
- [ ] `src/common/clients/resend.client.ts`: Implement transactional email templates for signup, enrollment receipts, and course completion.
- [ ] `src/modules/health/health.controller.ts`: Add Meilisearch health check indicator to `/health`.
- [ ] `src/common/interceptors/logging.interceptor.ts`: Connect structured request logging to PostHog / Sentry telemetry.

---

## PHASE 2 (Post-MVP / Future Iterations)
- [ ] Redis caching layer for course discovery and heavy analytics queries.
- [ ] BullMQ background worker queue for video transcoding and AI batch jobs.
- [ ] Granular rate-limiting per API key / subscription tier.
