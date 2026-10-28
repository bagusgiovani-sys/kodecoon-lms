## award_publications

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | award_id | uuid | awards.id |
| FK | published_by | uuid | users.id |
|  | content_snapshot | json |  |
|  | published_at | timestamp |  |
|  | withdrawn_at | timestamp? |  |

