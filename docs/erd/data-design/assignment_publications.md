## assignment_publications

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | assignment_id | uuid | assignments.id |
| FK | published_by | uuid | users.id |
|  | content_snapshot | json |  |
|  | due_at | timestamp? |  |
|  | published_at | timestamp |  |
|  | archived_at | timestamp? |  |

