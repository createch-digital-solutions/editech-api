# 01. Course & Lesson Hierarchy Architecture

## 1. Executive Summary & Domain Model
In Editech, a course is a structured learning path organized hierarchically. To support diverse learning experiences, lessons are **polymorphic activities** (not restricted to video).

```text
Course (Root Container)
 └── CourseSection (Chapter / Module)
      └── Lesson (Atomic Curriculum Step / Activity)
           ├── [VIDEO] Video Asset + Duration + Progress Telemetry
           ├── [TEXT]  Rich Article + Code Highlighting + Read Tracker
           └── [QUIZ]  Assessment Engine + Question Set + Grading
```

---

## 2. Structural Hierarchy & Database Mapping

### A. The Course Container (`Course`)
* **Role**: The commercial, pedagogical, and discovery unit.
* **Key Fields**: `id`, `title`, `slug`, `description`, `price`, `thumbnailUrl`, `level`, `outcomeTag`.
* **Relations**: Owned by an `InstructorProfile`; contains one or more `CourseSections`.

### B. The Section / Module (`CourseSection`)
* **Role**: Logical chapters grouping atomic lessons into milestones.
* **Key Fields**: `id`, `courseId`, `title`, `position` (integer ordering `1, 2, 3...`).
* **Relations**: Has many `Lessons`. Cascades on deletion.

### C. The Lesson (`Lesson`)
* **Role**: The ordered curriculum step a student must complete to progress.
* **Polymorphic Type (`LessonType`)**:
  1. `VIDEO`: Video streaming URL, video duration in seconds.
  2. `TEXT`: Formatted rich markdown, code blocks, diagrams, downloadable links.
  3. `QUIZ`: Linked to the `Quiz` entity; contains questions, options, and pass threshold.
* **Access & State Attributes**:
  * `position`: Ordered index inside the section (`1, 2, 3...`).
  * `isPreview`: Boolean. If true, non-enrolled users can view/watch as a sample on the public landing page.
  * `isPublished`: Boolean. Allows instructors to draft content without publishing immediately.

---

## 3. Child Entities & Interactions

Every lesson anchors several learner-specific interactions:

1. **`LessonProgress`**:
   * Tracks `watchTime` (seconds watched) and `isCompleted` (boolean).
   * Uniquely constrained by `(learnerId, lessonId)`.
   * Drives course percentage: `(completedLessons / totalPublishedLessons) * 100`.

2. **`LearnerNote`**:
   * Private timestamped notes taken by the learner while studying the lesson.

3. **`AiConversation`**:
   * Chat interactions with **Aria** anchored specifically to this lesson's context.

4. **`OfflineDownload`**:
   * Caches lesson packages for offline mobile app consumption.

---

## 4. Why Quiz is a Lesson Type (Architectural Rationale)

From a pedagogical perspective, a quiz is an evaluation. However, in LMS system architecture:
1. **Linear Navigation**: A student navigates via **Next / Previous**. Placing quizzes in the `lessons` sequence allows seamless linear flow:
   $$\text{Lesson 1 (Video)} \longrightarrow \text{Lesson 2 (Text)} \longrightarrow \text{Lesson 3 (Quiz)} \longrightarrow \text{Lesson 4 (Video)}$$
2. **Placement Flexibility**: Quizzes can be placed anywhere: a quick 2-question knowledge check mid-module, a comprehensive end-of-module assessment, or a course final exam.
3. **Unified Progress Calculation**: The system calculates progress uniformly across all activities without requiring bifurcated progress tables.

---

## 5. Course Studio (Editor) vs. Classroom (Renderer) Specifications

### A. Course Studio (Instructor)
The editor must present a dynamic interface based on the active `LessonType`:
* **Video Mode**: Direct-to-storage presigned upload (S3/R2), auto-calculated duration, thumbnail frame selection.
* **Text Mode**: Rich Markdown/WYSIWYG editor with syntax highlighting and callout blocks.
* **Quiz Mode**: Interactive question builder (question prompt, multiple choices, correct answer designation, explanation, and `passMark` percentage).

### B. Classroom Player (Learner)
The player viewport (`/learn/[slug]`) dispatches to specialized renderers:
* **`<VideoLessonPlayer />`**: Custom controls, speed selection, auto-heartbeat telemetry ping every 10s, auto-completion at 90% watch time.
* **`<ArticleLessonReader />`**: Clean typography, code syntax highlighter with copy button, reading progress observer.
* **`<QuizLessonAssessment />`**: Question progression, option selection, instant scoring against `passMark`, retry flow, and XP reward triggers.
