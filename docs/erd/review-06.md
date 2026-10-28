## Proposed: learning belongs to students

PROPOSED / Names and migration mapping require joint review

```mermaid
flowchart LR
  n0["shared STUDENT<br/>PK canonical_student_id<br/>Reuse colleague's agreed identity<br/>No duplicate student master"]
  n1["STUDENT_MODULE<br/>PK id; FK student_id, module_id<br/>started_at; completed_at; status<br/>A repeat module is a new attempt"]
  n2["MODULE / LESSON<br/>MODULE PK id; title; version<br/>LESSON PK id; FK module_id<br/>Reusable curriculum definitions"]
  n3["CLASS_ENROLMENT<br/>PK id; FK student_id, class_id<br/>valid_from; valid_to<br/>Preserve later membership changes"]
  n4["LESSON_PROGRESS<br/>PK id; FK student_module_id, lesson_id<br/>status; completed_at<br/>UNIQUE student_module + lesson"]
  n5["STUDENT_SESSION<br/>PK id; FK session_id, student_id<br/>attendance; actual_teacher_id<br/>UNIQUE session + student"]
  n6["CLASS / SLOT / SESSION<br/>Center + stable class code<br/>Slot: weekday, start/end, time zone<br/>Session: actual dated occurrence"]
  n7["LEARNING_ACTIVITY<br/>PK id; FK student_session_id<br/>FK student_module_id, lesson_id<br/>Several activities may occur per class"]
  n8["DOCUMENTATION / MEDIA<br/>Document FK learning_activity_id<br/>Feedback; draft/shared; author/time<br/>Media: Drive file ID + media type"]
  n0 -->|1:N| n1
  n0 -->|1:N| n3
  n1 -->|1:N| n4
  n7 -->|1:N| n8
  n5 -->|1:N| n7
  n2 -->|1:N| n1
  n6 -->|1:N| n3
```

A class groups students by schedule; each learner has independent module attempts. Each activity links one student's dated session to the module/lesson actually studied. Validate that progress, activity and lesson all refer to the same module and student.
Source mapping is not a migration plan: classes/enrollments/slots remain scheduling concepts; courses/course_lessons are candidates for modules/lessons. Existing class lessons, progress and IDs must be reconciled before conversion. Drive stays academy-controlled; private parent playback remains a release test.
