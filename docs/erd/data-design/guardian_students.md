## guardian_students

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | guardian_id | uuid | users.id |
| FK | student_id | uuid | students.id |
|  | linked_at | timestamp |  |
|  | revoked_at | timestamp? |  |

