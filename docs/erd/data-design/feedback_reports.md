## feedback_reports

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | cycle_id | uuid? | feedback_cycles.id |
| FK | author_id | uuid | users.id |
|  | revision | int |  |
|  | strengths | text |  |
|  | next_steps | text |  |
|  | summary | text |  |
|  | report_date | date? |  |
|  | source_system | enum |  |

