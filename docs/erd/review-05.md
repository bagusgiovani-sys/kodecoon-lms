## Current: credits and retry records

CURRENT LOCAL SCHEMA / Credits are session units, not money

```mermaid
flowchart LR
  n0["students<br/>PK id<br/>One learner identity"]
  n1["credit_accounts<br/>PK/FK student_id -> students<br/>balance >= 0; revision<br/>Created lazily"]
  n2["credit_entries<br/>PK id; FK student_id -> account<br/>amount; kind; effective_date<br/>FK actor + request; optional session"]
  n3["users<br/>PK/FK id -> auth.users<br/>role; center_id<br/>Current teacher/admin/parent rules"]
  n4["credit_operations<br/>PK actor_id + request_id<br/>FK actor_id -> users<br/>payload; result; created_at"]
  n5["session_credit_state<br/>PK session_id + student_id<br/>FK session, credit account<br/>charged"]
  n6["sessions<br/>PK id; class_id; session_date<br/>credit_billable; revision"]
  n7["domain write receipts<br/>7 additional receipt tables<br/>Per-actor request + payload/result<br/>See complete inventory"]
  n8["financial payment records<br/>Not present in KodeHub schema<br/>Amounts / receipts remain external<br/>Do not send finance data to families"]
  n0 -->|1:0..1| n1
  n1 -->|1:N| n2
  n3 -->|1:N| n4
```

Attendance charges/refunds and account changes commit through authorized RPCs. A receipt makes an exact repeated request return its prior result. Not every older endpoint or roster operation has this protection.
Current credit_accounts contains no center_id; scope is derived through the student. The shared design must choose one ledger owner. Finance may grant credit units, while KodeHub consumes/refunds them; neither app should maintain an independent editable balance. Source: schema.sql:764-795.
