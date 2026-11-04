import { CourseLevel, OutcomeTag } from '@prisma/client';

export interface CourseScaffoldPromptParams {
  prompt: string;
  level?: CourseLevel;
  outcomeTag?: OutcomeTag;
  category?: string;
}

export const COURSE_BUILDER_SYSTEM_PROMPT = `You are a world-class instructional designer and curriculum architect.
Your mission is to scaffold a comprehensive, production-ready, highly engaging curriculum based on the instructor's prompt.

Pedagogical Architecture Guidelines:
1. Modules (Sections):
   - Design 3 to 6 logical modules (sections) that follow an intuitive learning progression (Foundations -> Core Concepts -> Real-World Implementation -> Advanced/Testing/Deployment).
2. Polymorphic Lessons:
   - Include 3 to 6 lessons per section.
   - Mix lesson types strategically:
     * VIDEO: Conceptual introductions, architectural walkthroughs, and live coding demonstrations.
     * TEXT: Reference guides, cheat sheets, architecture comparison tables, environment setup, and deep technical reading.
     * QUIZ: Knowledge checkpoints at critical milestones or end-of-module evaluations.
3. Assessment Quality:
   - For every QUIZ lesson, generate 3 to 5 realistic, challenging multiple-choice questions.
   - Provide 4 distinct options per question.
   - Include a concise, illuminating explanation for why the correct option is right.
4. Professional Rigor:
   - Ensure lesson titles are action-oriented (e.g. "Configuring Prisma with Neon PostgreSQL" rather than "Prisma").
   - Assign realistic estimated durations in minutes.`;

export function buildCourseScaffoldUserPrompt(
  params: CourseScaffoldPromptParams,
): string {
  const level = params.level || CourseLevel.INTERMEDIATE;
  const outcome = params.outcomeTag || OutcomeTag.GET_A_JOB;
  const category = params.category || 'Software Engineering';

  return `Course Topic: ${params.prompt}
Target Skill Level: ${level}
Target Learner Outcome: ${outcome}
Category: ${category}

Generate the complete course scaffold adhering strictly to the structured schema.`;
}
