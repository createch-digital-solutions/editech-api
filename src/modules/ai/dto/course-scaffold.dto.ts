import { z } from 'zod';
import { CourseLevel, OutcomeTag, LessonType } from '@prisma/client';

export const QuizQuestionScaffoldSchema = z.object({
  questionText: z.string().describe('The assessment question prompt'),
  options: z.array(z.string()).min(2).max(5).describe('List of multiple choice options'),
  correctOptionIndex: z.number().int().min(0).max(4).describe('Zero-based index of the correct option'),
  explanation: z.string().optional().describe('Why this option is correct'),
});

export const LessonScaffoldSchema = z.object({
  title: z.string().describe('Clear, action-oriented lesson title'),
  type: z.nativeEnum(LessonType).describe('The lesson activity type: VIDEO, TEXT, or QUIZ'),
  position: z.number().int().min(1).describe('Ordering index inside the section'),
  estimatedDuration: z.number().int().min(1).describe('Duration in minutes for videos/reading, or minutes to complete quiz'),
  contentSummary: z.string().describe('Brief outline of what is covered in this lesson or draft article markdown'),
  quizQuestions: z.array(QuizQuestionScaffoldSchema).optional().describe('Questions for QUIZ type lessons'),
});

export const SectionScaffoldSchema = z.object({
  title: z.string().describe('Module or section title (e.g., Section 1: Foundations)'),
  position: z.number().int().min(1).describe('Sequential position in curriculum'),
  lessons: z.array(LessonScaffoldSchema).min(1).describe('Ordered lessons within this section'),
});

export const CourseScaffoldSchema = z.object({
  title: z.string().describe('Engaging, professional course title'),
  description: z.string().describe('Detailed course description covering prerequisites and outcomes'),
  category: z.string().describe('Primary subject category (e.g. Backend Development, DevOps)'),
  level: z.nativeEnum(CourseLevel).describe('BEGINNER, INTERMEDIATE, or ADVANCED'),
  outcomeTag: z.nativeEnum(OutcomeTag).describe('START_FREELANCING or GET_A_JOB'),
  tags: z.array(z.string()).min(2).max(6).describe('Keywords and technologies covered'),
  sections: z.array(SectionScaffoldSchema).min(1).max(10).describe('Ordered sections of the course'),
});

export type CourseScaffold = z.infer<typeof CourseScaffoldSchema>;
export type SectionScaffold = z.infer<typeof SectionScaffoldSchema>;
export type LessonScaffold = z.infer<typeof LessonScaffoldSchema>;
export type QuizQuestionScaffold = z.infer<typeof QuizQuestionScaffoldSchema>;
