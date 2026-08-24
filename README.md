# Createch Learning Platform — Backend REST API (`createch-api`)

This repo is independently installable and runnable. It does not depend on any other Createch repo at build or install time — only at runtime, over HTTP, against `NEXT_PUBLIC_API_BASE_URL` / CORS-allowed origins.

> **Context Pointer**: For full architectural rules and AI agent boundaries, see [CLAUDE.md](./CLAUDE.md). For deferred backlog items, see [TODO.md](./TODO.md).

---

## Tech Stack
- **Framework**: NestJS 11 + TypeScript + Express
- **Database**: PostgreSQL with Prisma ORM (owned completely inside this repo)
- **API Documentation**: OpenAPI / Swagger live at `/docs`
- **Auth**: Clerk (`@clerk/backend`, `svix` webhook signature verification)
- **Search Engine**: Meilisearch (dockerized)
- **Testing**: Jest module unit/smoke tests & integration tests in `test/`

---

## Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose (for local PostgreSQL & Meilisearch)

---

## Getting Started

### 1. Installation
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Local Infrastructure
```bash
docker compose up -d
```

### 4. Database Setup & Migrations
```bash
# Generate Prisma Client
pnpm prisma:generate

# Run Migrations
pnpm prisma:migrate

# Seed Database
pnpm prisma:seed
```

### 5. Run Development Server
```bash
pnpm start:dev
```
- API Base: [http://localhost:5000](http://localhost:5000)
- OpenAPI / Swagger Docs: [http://localhost:5000/docs](http://localhost:5000/docs)
- Health Check: [http://localhost:5000/health](http://localhost:5000/health)

---

## Testing & Quality Commands
```bash
# Run unit & module smoke tests
pnpm test

# Run e2e / integration tests
pnpm test:e2e

# Run linter
pnpm lint

# Build for production
pnpm build
```

---

## Shared Contracts & Types Note
Any type or contract that both `createch-web` and `createch-api` need is documented by the OpenAPI spec at `/docs`.

Once the API contracts stabilize, schemas will be exported and published as an independent, versioned npm package (e.g. `@createch/api-contracts`) and installed as a normal external dependency — never as a local path/workspace reference.

---

## What is NOT Built Yet (MVP Scope)
The following are deferred until Phase 6+ PRD implementation:
- AI Course Builder logic & curriculum generation pipelines (stub client wrappers only)
- AI Tutor live streaming responses (stub client wrappers only)
- Payment charges & webhook processing for Paystack and Stripe (stub client wrappers only)
- Gamification XP badges, quizzes grading, and PDF certificate generation
- Community forum discussion threads & moderation
