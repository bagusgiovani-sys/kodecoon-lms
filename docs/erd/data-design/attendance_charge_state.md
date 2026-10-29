## attendance_charge_state

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_session_id | uuid | student_sessions.id |
| FK | account_id | uuid | credit_accounts.id |
|  | charged | bool |  |
|  | revision | int |  |

