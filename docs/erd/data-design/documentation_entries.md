## documentation_entries

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | learning_activity_id | uuid | learning_activities.id |
| FK | author_id | uuid | users.id |
|  | feedback | text |  |
|  | visibility | enum |  |
|  | shared_at | timestamp? |  |

