# Editech Technical Specifications & Architecture Documents

This directory contains lower-level technical specifications, architectural decisions (ADRs), and contract blueprints for the Editech platform. These documents guide both backend (`editech-api`) and frontend (`editech-web`) implementations.

---

## Directory Index

| Document | Description | Target Modules |
| :--- | :--- | :--- |
| [01. Course & Lesson Hierarchy Architecture](./architecture/01-course-and-lesson-structure.md) | Structural hierarchy of Courses, Sections, and Lessons. Details the polymorphic lesson types (`VIDEO`, `TEXT`, `QUIZ`), Editor workflows, and Classroom Player specifications. | `CoursesModule`, `InstructorModule`, `PlayerView`, `CourseStudio` |
| [02. AI Architecture & Provider Strategy](./architecture/02-ai-system-architecture.md) | Vercel AI SDK integration, Google Gemini free development setup, Dual-Scope Aria Coach, paywall security guardrails, and AI Course Builder workflows. | `AiModule`, `QueueModule`, `CoachView`, `AskAria` |
| [03. Curriculum & Delivery API Contracts](./contracts/api-contracts-curriculum.md) | Concrete REST endpoint signatures, request payloads, response schemas, and error codes for instructor authoring and learner consumption. | NestJS Controllers, React Query hooks |

---

## Document Governance
- All major architectural shifts or cross-repository contracts must be documented here before implementation.
- Both backend and frontend developers should treat these documents as the Single Source of Truth (SSOT).
