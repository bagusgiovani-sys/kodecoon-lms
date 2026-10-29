## student_modules

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_id | uuid | students.id |
| FK | module_id | uuid | modules.id |
|  | attempt_no | int |  |
|  | started_at | date |  |
|  | completed_at | date? |  |
|  | status | enum |  |

