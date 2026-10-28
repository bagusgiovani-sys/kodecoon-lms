## learning_activities

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_session_id | uuid | student_sessions.id |
| FK | student_module_id | uuid | student_modules.id |
| FK | module_lesson_id | uuid | module_lessons.id |
|  | lesson_goal | text |  |
|  | work_completed | text |  |

