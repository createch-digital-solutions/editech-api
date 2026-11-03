# 03. Curriculum & Delivery API Contracts

## 1. Overview
This document defines the REST API contracts between the NestJS backend (`editech-api`) and the Next.js frontend (`editech-web`) for course authoring, curriculum delivery, and student progress tracking.

---

## 2. Instructor Course Authoring APIs

### A. Create Course Draft
* **Method**: `POST`
* **Route**: `/api/v1/instructor/courses`
* **Auth**: `Bearer <token>` (`Role: INSTRUCTOR | ADMIN`)
* **Request Body**:
```json
{
  "title": "Mastering Microservices with NestJS",
  "category": "Backend Development",
  "level": "INTERMEDIATE",
  "outcomeTag": "GET_A_JOB",
  "price": 45000,
  "description": "Learn event-driven architectures, Kafka, and Redis caching.",
  "tags": ["nestjs", "microservices", "kafka"]
}
```
* **Response (201 Created)**:
```json
{
  "id": "018f3a72-8812-7000-8000-000000000001",
  "instructorId": "user_123",
  "title": "Mastering Microservices with NestJS",
  "slug": "mastering-microservices-with-nestjs",
  "status": "DRAFT",
  "price": 45000,
  "createdAt": "2026-11-03T09:00:00.000Z"
}
```

---

### B. Create Course Section
* **Method**: `POST`
* **Route**: `/api/v1/instructor/courses/:courseId/sections`
* **Request Body**:
```json
{
  "title": "Section 1: Event-Driven Architecture Fundamentals",
  "position": 1
}
```
* **Response (201 Created)**:
```json
{
  "id": "018f3a72-8812-7000-8000-000000000002",
  "courseId": "018f3a72-8812-7000-8000-000000000001",
  "title": "Section 1: Event-Driven Architecture Fundamentals",
  "position": 1
}
```

---

### C. Create Lesson in Section
* **Method**: `POST`
* **Route**: `/api/v1/instructor/sections/:sectionId/lessons`
* **Request Body**:
```json
{
  "title": "Understanding Event Buses and Message Brokers",
  "type": "VIDEO",
  "position": 1,
  "isPreview": false
}
```
* **Response (201 Created)**:
```json
{
  "id": "018f3a72-8812-7000-8000-000000000003",
  "sectionId": "018f3a72-8812-7000-8000-000000000002",
  "courseId": "018f3a72-8812-7000-8000-000000000001",
  "title": "Understanding Event Buses and Message Brokers",
  "type": "VIDEO",
  "position": 1,
  "isPreview": false,
  "isPublished": false
}
```

---

### D. Update Lesson Content (Polymorphic)
* **Method**: `PATCH`
* **Route**: `/api/v1/instructor/lessons/:lessonId`
* **Request Body (Video Lesson)**:
```json
{
  "videoUrl": "https://cdn.editech.io/courses/microservices/lesson-1.m3u8",
  "videoDuration": 420,
  "isPublished": true
}
```
* **Request Body (Text / Article Lesson)**:
```json
{
  "content": "# Event Bus Fundamentals\n\nIn this lesson, we explore publish-subscribe patterns...",
  "isPublished": true
}
```
* **Response (200 OK)**:
```json
{
  "id": "018f3a72-8812-7000-8000-000000000003",
  "isPublished": true,
  "updatedAt": "2026-11-03T09:15:00.000Z"
}
```

---

### E. Get Presigned S3/R2 Upload URL for Video
* **Method**: `POST`
* **Route**: `/api/v1/instructor/lessons/:lessonId/upload-url`
* **Request Body**:
```json
{
  "fileName": "lesson1_intro.mp4",
  "fileType": "video/mp4",
  "fileSize": 154820300
}
```
* **Response (200 OK)**:
```json
{
  "uploadUrl": "https://storage.editech.io/uploads/temp/...?signature=...",
  "assetUrl": "https://cdn.editech.io/courses/raw/lesson1_intro.mp4",
  "expiresInSeconds": 900
}
```

---

## 3. Learner Classroom & Progress APIs

### A. Get Course Classroom Curriculum
* **Method**: `GET`
* **Route**: `/api/v1/courses/:slug/classroom`
* **Auth**: `Bearer <token>` (Enrolled student)
* **Response (200 OK)**:
```json
{
  "courseId": "018f3a72-8812-7000-8000-000000000001",
  "title": "Mastering Microservices with NestJS",
  "enrolmentStatus": "ACTIVE",
  "overallProgress": 33,
  "sections": [
    {
      "id": "sec_01",
      "title": "Section 1: Event-Driven Architecture Fundamentals",
      "position": 1,
      "lessons": [
        {
          "id": "les_01",
          "title": "Understanding Event Buses",
          "type": "VIDEO",
          "position": 1,
          "videoUrl": "https://cdn.editech.io/courses/microservices/lesson-1.mp4",
          "videoDuration": 420,
          "progress": {
            "watchTime": 390,
            "isCompleted": true
          }
        },
        {
          "id": "les_02",
          "title": "Architecture Comparison Matrix",
          "type": "TEXT",
          "position": 2,
          "content": "# Architecture Matrix...",
          "progress": {
            "isCompleted": false
          }
        },
        {
          "id": "les_03",
          "title": "Section 1 Checkpoint",
          "type": "QUIZ",
          "position": 3,
          "quiz": {
            "id": "quiz_01",
            "passMark": 75,
            "questionsCount": 5
          },
          "progress": {
            "isCompleted": false
          }
        }
      ]
    }
  ]
}
```

---

### B. Sync Video Watch Progress (Heartbeat)
* **Method**: `POST`
* **Route**: `/api/v1/learner/lessons/:lessonId/progress`
* **Request Body**:
```json
{
  "watchTime": 125
}
```
* **Response (200 OK)**:
```json
{
  "watchTime": 125,
  "isCompleted": false
}
```

---

### C. Mark Lesson Complete
* **Method**: `POST`
* **Route**: `/api/v1/learner/lessons/:lessonId/complete`
* **Response (200 OK)**:
```json
{
  "lessonId": "les_01",
  "isCompleted": true,
  "courseProgressPercentage": 33,
  "completedAt": "2026-11-03T09:20:00.000Z"
}
```

---

### D. Submit Quiz Attempt
* **Method**: `POST`
* **Route**: `/api/v1/learner/quizzes/:quizId/attempt`
* **Request Body**:
```json
{
  "answers": [
    { "questionId": "q1", "selectedOption": 2 },
    { "questionId": "q2", "selectedOption": 0 }
  ]
}
```
* **Response (200 OK)**:
```json
{
  "score": 100,
  "passed": true,
  "xpAwarded": 50,
  "lessonMarkedComplete": true
}
```
