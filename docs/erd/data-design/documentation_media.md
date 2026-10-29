## documentation_media

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | documentation_id | uuid | documentation_entries.id |
| FK | media_file_id | uuid | media_files.id |
|  | display_order | int |  |

