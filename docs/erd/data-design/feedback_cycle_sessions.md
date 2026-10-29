## feedback_cycle_sessions

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | cycle_id | uuid | feedback_cycles.id |
| FK | student_session_id | uuid | student_sessions.id |
|  | ordinal | int |  |

