## report_publications

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | report_id | uuid | feedback_reports.id |
| FK | published_by | uuid | users.id |
|  | report_revision | int |  |
|  | content_snapshot | json |  |
| FK | pdf_media_id | uuid | media_files.id |
|  | published_at | timestamp |  |
|  | withdrawn_at | timestamp? |  |

