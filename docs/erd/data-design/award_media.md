## award_media

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | award_id | uuid | awards.id |
| FK | media_file_id | uuid | media_files.id |
|  | display_order | int |  |

