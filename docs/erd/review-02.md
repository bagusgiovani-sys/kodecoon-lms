## Current: classes and attendance

CURRENT LOCAL SCHEMA / Selected relationships

```mermaid
flowchart LR
  n0["centers<br/>PK id; name; country"]
  n1["classes<br/>PK id; FK center_id, teacher_id<br/>name; age_bracket"]
  n2["students<br/>PK id; FK center_id<br/>name"]
  n3["weekly_class_slots<br/>PK id; FK class_id<br/>weekday; start_time; starts_on"]
  n4["sessions<br/>PK id; FK class_id, teacher_id<br/>FK weekly_slot_id (optional)<br/>session_date; revision; credit_billable"]
  n5["enrollments<br/>PK id; FK student_id, class_id<br/>UNIQUE student_id + class_id<br/>enrolled_date"]
  n6["weekly_slot_members<br/>PK id; FK slot_id, student_id<br/>starts_on; ends_on"]
  n7["attendance<br/>PK id; FK session_id, student_id<br/>UNIQUE session_id + student_id<br/>status"]
  n8["student_guardians<br/>PK id; FK student_id, guardian_id<br/>guardian_id -> users.id<br/>UNIQUE student_id + guardian_id"]
  n0 -->|1:N| n1
  n1 -->|1:N| n4
  n2 -->|1:N| n5
  n3 -->|1:N| n6
  n3 -->|1:N| n4
  n4 -->|1:N| n7
```

Class membership, dated weekly-slot membership and attendance are separate records. They must not be treated as interchangeable. The supplied checklist also requires expected absences and make-up students.
Gap: classes has no dedicated class-code column, and weekly slots have a start time but no end time/duration. The requested timetable needs stable class-code mapping, duration and center time-zone rules. Source: schema.sql:43-93, 2246-2263.
