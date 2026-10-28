## lesson_progress

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_module_id | uuid | student_modules.id |
| FK | module_lesson_id | uuid | module_lessons.id |
|  | status | enum |  |
|  | completed_at | timestamp? |  |

