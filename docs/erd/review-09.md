## Proposed: responsibility for data changes

PROPOSED / No assumption that the colleague's migrated database accepts writes

| Data | Authoritative record / writer | What each app receives |
|---|---|---|
| Student / center / class code | Shared core agreed with colleague. Reuse canonical IDs. KodeHub changes use the agreed API or controlled database operation. | KodeHub: permitted operational fields. Analytics: approved fields/views. |
| Enrolment / schedule | One shared record; staff changes through KodeHub after ownership agreement. Do not maintain a second editable roster. | Both apps read the same effective-dated history. |
| Learning / documentation / awards | KodeHub owns modules, learner progress, Drive references, module reports and award albums. Awards need a new student-linked record plus media links. | Parents: only their child's shared records. Analytics: permitted summaries. |
| Checklist and supervision | KodeHub owns versioned template, results, completion history and supervisor review. | Staff-only; analytics receives completion aggregates if approved. |
| Credits | One shared ledger. Finance grants units using an external operation ID; KodeHub records usage/refunds and authorized adjustments. | Balance and unit history only. No payment amount or banking details. |
| Money / payments | Finance domain maintained outside KodeHub access. Final owner to be agreed with colleague. | Analytics access only as authorized. KodeHub and parent APIs receive no financial rows. |

An ERD documents relationships; this matrix assigns responsibility. 'Shared' means one canonical record, not necessarily one physical database. Different databases can integrate through controlled APIs. Analytics should not independently rewrite operational records. No credentials or live records are needed for this comparison.
