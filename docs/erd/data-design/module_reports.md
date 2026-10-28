## module_reports

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_module_id | uuid | student_modules.id |
| FK | author_id | uuid | users.id |
|  | revision | int |  |
|  | strengths | text |  |
|  | next_steps | text |  |
|  | summary | text |  |

