## checklist_reviews

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | session_checklist_id | uuid | session_checklists.id |
| FK | reviewed_by | uuid | users.id |
|  | notes | text |  |
|  | reviewed_at | timestamp |  |

