## submission_versions

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | thread_id | uuid | submission_threads.id |
| FK | submitted_by | uuid | users.id |
| FK | request_id | uuid | write_requests.id |
|  | version_no | int |  |
|  | project_url | text |  |
|  | reflection | text |  |
|  | submitted_at | timestamp |  |

