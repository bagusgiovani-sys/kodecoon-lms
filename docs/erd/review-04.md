## Current: submissions and publications

CURRENT LOCAL SCHEMA / History and family visibility

```mermaid
flowchart LR
  n0["assignment_learners<br/>PK assignment_id + student_id<br/>Captured assignment recipient"]
  n1["submission_threads<br/>PK id; FK assignment_id + student_id<br/>UNIQUE assignment + student<br/>next_version"]
  n2["submission_versions<br/>PK id; FK thread_id, submitted_by<br/>version; project_url; reflection<br/>Immutable submitted version"]
  n3["reports<br/>PK id; FK student_id, class_id<br/>FK template_id; final_text<br/>Private PDF storage path"]
  n4["published_reports<br/>PK id; UNIQUE FK report_id<br/>FK student_id, class_id, published_by<br/>Snapshot; published_at; withdrawn_at"]
  n5["submission_reviews<br/>PK id; FK submission_id, reviewed_by<br/>revision / approved; feedback<br/>Optional prior review reference"]
  n6["student_feedback<br/>PK id; FK student, class, lesson<br/>strengths; next_steps; rating<br/>Private draft; revision"]
  n7["published_feedback<br/>PK id; FK feedback_id + scope keys<br/>UNIQUE feedback + draft_revision<br/>Immutable public content"]
  n8["student_media<br/>PK id; FK student_id, created_by<br/>kind; storage_path; description<br/>ready; recorded_date"]
  n0 -->|1:0..1| n1
  n1 -->|1:N| n2
  n2 -->|1:N| n5
  n3 -->|1:0..1| n4
  n6 -->|1:N| n7
```

Families read their child's permitted submissions and non-withdrawn publications. Private drafts are separate. Existing report publication is one snapshot per report row; a new exported report is required for a new version.
Current student_media is student-linked private Storage metadata; session_videos stores Drive links. Neither is the complete proposed student + session + module + lesson documentation model. Module criterion grades and awards are not yet modeled. Source: schema.sql:684, 1516-1553, 1776-1817, 2350.
