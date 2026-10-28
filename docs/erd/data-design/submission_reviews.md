## submission_reviews

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | submission_id | uuid | submission_versions.id |
| FK | reviewed_by | uuid | users.id |
| FK | supersedes_id | uuid? | submission_reviews.id |
| FK | request_id | uuid | write_requests.id |
|  | outcome | enum |  |
|  | feedback | text |  |
|  | reviewed_at | timestamp |  |

