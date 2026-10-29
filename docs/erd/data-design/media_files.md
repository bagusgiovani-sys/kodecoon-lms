## media_files

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | uploaded_by | uuid | users.id |
|  | storage_provider | enum |  |
|  | storage_key | text |  |
|  | file_name | text |  |
|  | mime_type | text |  |
|  | size_bytes | bigint |  |
|  | upload_state | enum |  |

