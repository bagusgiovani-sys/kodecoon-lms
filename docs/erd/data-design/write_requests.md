## write_requests

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | actor_id | uuid? | users.id |
|  | source_system | text |  |
|  | external_request_id | text |  |
|  | operation_type | text |  |
|  | payload_hash | text |  |
|  | result | json |  |
|  | created_at | timestamp |  |

