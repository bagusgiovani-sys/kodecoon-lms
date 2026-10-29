## checklist_results

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | session_checklist_id | uuid | session_checklists.id |
| FK | item_id | uuid | checklist_items.id |
| FK | student_session_id | uuid? | student_sessions.id |
| FK | completed_by | uuid? | users.id |
|  | status | enum |  |
|  | reason | text |  |
|  | completed_at | timestamp? |  |
|  | revision | int |  |

