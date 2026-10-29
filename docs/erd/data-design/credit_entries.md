## credit_entries

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | account_id | uuid | credit_accounts.id |
| FK | request_id | uuid | write_requests.id |
| FK | student_session_id | uuid? | student_sessions.id |
|  | quantity | int |  |
|  | entry_type | enum |  |
|  | reason | text |  |
|  | recorded_at | timestamp |  |

