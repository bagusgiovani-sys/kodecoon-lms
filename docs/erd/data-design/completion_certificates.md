## completion_certificates

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_module_id | uuid | student_modules.id |
| FK | pdf_media_id | uuid | media_files.id |
| FK | published_by | uuid | users.id |
|  | revision | int |  |
|  | published_at | timestamp |  |
|  | withdrawn_at | timestamp? |  |

