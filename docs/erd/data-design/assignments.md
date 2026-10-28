## assignments

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | module_id | uuid | modules.id |
| FK | module_lesson_id | uuid? | module_lessons.id |
| FK | author_id | uuid | users.id |
|  | title | text |  |
|  | brief | text |  |
|  | revision | int |  |

