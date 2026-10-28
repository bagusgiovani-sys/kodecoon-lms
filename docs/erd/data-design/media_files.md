## media_files

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | uploaded_by | uuid | users.id |
|  | drive_file_id | text |  |
|  | mime_type | text |  |
|  | size_bytes | bigint |  |
|  | upload_state | enum |  |

