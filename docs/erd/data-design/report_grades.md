## report_grades

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | report_id | uuid | module_reports.id |
| FK | criterion_id | uuid | assessment_criteria.id |
|  | grade | enum |  |
|  | evidence | text |  |

