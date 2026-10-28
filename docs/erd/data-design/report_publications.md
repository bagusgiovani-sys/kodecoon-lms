## report_publications

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | report_id | uuid | module_reports.id |
| FK | published_by | uuid | users.id |
|  | report_revision | int |  |
|  | content_snapshot | json |  |
|  | private_pdf_key | text |  |
|  | published_at | timestamp |  |
|  | withdrawn_at | timestamp? |  |

