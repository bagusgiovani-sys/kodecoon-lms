## sessions

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | class_slot_id | uuid | class_slots.id |
| FK | teacher_id | uuid | users.id |
|  | starts_at | timestamp |  |
|  | ends_at | timestamp |  |
|  | status | enum |  |
|  | revision | int |  |

