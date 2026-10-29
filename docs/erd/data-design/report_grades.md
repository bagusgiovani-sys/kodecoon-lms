## report_grades

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | report_id | uuid | feedback_reports.id |
| FK | criterion_id | uuid | assessment_criteria.id |
|  | grade | enum |  |
|  | evidence | text |  |

