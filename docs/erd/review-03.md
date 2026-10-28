## Current: curriculum and assignments

CURRENT LOCAL SCHEMA / Class-level course assignment

```mermaid
flowchart LR
  n0["courses<br/>PK id; FK center_id, owner_id<br/>title; lesson_count; revision"]
  n1["course_lessons<br/>PK id; FK course_id<br/>sequence; objective; materials; steps"]
  n2["class_course_assignments<br/>PK id; FK class_id, course_id<br/>center_id; assigned_at; ended_at<br/>At most one active course per class"]
  n3["classes<br/>PK id<br/>Timetable group / class identity"]
  n4["lessons<br/>PK id; FK class_id<br/>FK course_id + course_lesson_id<br/>Optional explicit course mapping"]
  n5["assignments<br/>PK id; FK class_id, course_assignment_id<br/>FK course_id, course_lesson_id<br/>draft / published / archived"]
  n6["students<br/>PK id<br/>Learner identity"]
  n7["student_lesson_progress<br/>PK id; FK student_id, lesson_id<br/>FK session_id (optional)<br/>status; completed_date; notes"]
  n8["assignment_learners<br/>PK assignment_id + student_id<br/>FK assignment, student, class, center<br/>submission_open; revision"]
  n0 -->|1:N| n1
  n1 -->|1:N| n4
  n3 -->|1:N| n4
  n4 -->|1:N| n7
  n6 -->|1:N| n7
  n2 -->|1:N| n5
  n5 -->|1:N| n8
```

Existing class-course history permits one active course per class. Individual completion records do not solve the requirement for different active modules within the same time slot.
Assignments also reference that class-course link. A future learner-module design must update assignment targeting as well as Journey display; preserve published assignment snapshots, submissions and reviews. Source: schema.sql:993-1348 and 1980-1986.
