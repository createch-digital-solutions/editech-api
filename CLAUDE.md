# Createch Learning Platform — Backend API (`createch-api` / `editech-api`)

## Mission & Boundary Rules
- **Role**: NestJS backend REST API service for Createch AI-powered learning marketplace.
- **Hard Boundary**: Communicates **ONLY** over HTTP REST with `createch-web`.
- **Contract Source of Truth**: Interactive Swagger/OpenAPI documentation hosted live at `/docs`.
- **No Monorepo / Shared Code**: Zero cross-directory imports, no shared npm workspaces.
- **Scope Lock**: ONLY implement what is listed as MUST/SHOULD in the MVP Definition. Any other ideas/features go to `TODO.md`, not into code.

## Approved Tech Stack
- **Framework**: NestJS 11 + TypeScript + Express
- **Package Manager**: `pnpm`
- **Database & ORM**: PostgreSQL via Prisma ORM (owned completely inside this repo)
- **Auth**: Clerk (`@clerk/backend`, webhook verification via `svix`)
- **Search (Infrastructure)**: Meilisearch (`docker-compose.yml`)
- **Payments (Stubs)**: Paystack & Stripe wrappers
- **AI (Stubs)**: OpenAI (course generation) & Anthropic (tutoring) wrappers
- **Email (Stub)**: Resend wrapper
- **Analytics/Monitoring**: PostHog & Sentry Node SDK wrappers
- **Testing**: Jest unit & smoke tests (in `test/modules/`) and integration tests (in `test/`) — *All tests live outside `src/`*

## Key Commands
```bash
pnpm start:dev       # Start NestJS in watch mode (default port 5000)
pnpm build           # Build production TypeScript output into dist/
pnpm start:prod      # Run production build (node dist/main)
pnpm lint            # Run ESLint checks
pnpm test            # Run Jest test suite
pnpm test:e2e        # Run e2e tests
pnpm prisma:generate # Generate Prisma client
pnpm prisma:migrate  # Run Prisma migrations
pnpm prisma:seed     # Run database seed script
```

## Directory Conventions
```
createch-api/
├── src/
│   ├── modules/            # 12 domain feature modules + health module
│   ├── common/             # Filters, interceptors, guards, external client wrappers
│   ├── app.module.ts       # Root module aggregator
│   └── main.ts             # App bootstrap with Swagger (/docs) & global pipes
├── prisma/                 # schema.prisma, migrations, and seed.ts
├── test/                   # Unit, smoke, and integration tests (outside src/)
├── docker-compose.yml      # Local Postgres & Meilisearch services
├── .github/workflows/      # Independent GitHub Actions CI pipeline
├── CLAUDE.md               # Agent brief & guidance
├── TODO.md                 # Scanned deferred backlog (MUST/SHOULD/PHASE 2)
└── README.md
```
