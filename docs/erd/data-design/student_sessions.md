## student_sessions

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_id | uuid | students.id |
| FK | session_id | uuid | sessions.id |
|  | attendance | enum |  |
|  | revision | int |  |

