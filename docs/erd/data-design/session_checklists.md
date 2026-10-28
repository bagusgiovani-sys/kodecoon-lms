## session_checklists

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | session_id | uuid | sessions.id |
| FK | template_id | uuid | checklist_templates.id |
|  | created_at | timestamp |  |

