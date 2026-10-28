## Proposed: checklist supervision

PROPOSED / Based on supplied 3-page checklist; scope assignments are recommendations

```mermaid
flowchart LR
  n0["CHECKLIST_TEMPLATE<br/>PK id; version; effective_from<br/>Source document version<br/>Published versions immutable"]
  n1["CHECKLIST_SECTION<br/>PK id; FK template_id<br/>Eight stages, numbered 0 to 7<br/>Display order; timing"]
  n2["CHECKLIST_ITEM<br/>PK id; FK section_id<br/>wording; class/student scope<br/>required; applicability rule"]
  n3["SESSION_CHECKLIST<br/>PK id; FK session_id, template_id<br/>Pinned template version<br/>Staff-only workflow"]
  n4["CLASS_ITEM_RESULT<br/>PK checklist_id + item_id<br/>pending / done / not_applicable<br/>completed_by; time; reason; revision"]
  n5["STUDENT_ITEM_RESULT<br/>PK checklist_id + item_id + student_id<br/>FK student_session + checklist item<br/>status; actor/time; reason; revision"]
  n6["REVIEW / CHANGE HISTORY<br/>FK checklist/result; reviewer_id<br/>Recorded edits and supervisor notes<br/>Do not overwrite completion history"]
  n7["SUPERVISOR OVERVIEW<br/>Computed view, not another master<br/>Date range -> center -> time slot<br/>Student detail + missing items"]
  n8["APPLICABILITY<br/>Break: where applicable<br/>Parent communication: when required<br/>Exclude approved N/A from total"]
  n0 -->|1:N| n1
  n1 -->|1:N| n2
  n0 -->|1:N| n3
  n3 -->|1:N| n4
  n2 -->|1:N| n5
```

38 checkboxes: Pre-class 7; Before class 4; Opening 5; Delivery 8; Breaktime 3; End of class 5; Parent communication 3; Admin duties 3. Page 3 gives guidance, not extra scored tasks. The PDF does not assign database scope; proposed class/student splits need review.
Overview = completed applicable results / all applicable results for the selected sessions. Count class items once and student items per applicable learner. Show pending separately from overdue; future stages are not yet due. N/A needs a reason; no applicable tasks shows N/A, not 100%.
