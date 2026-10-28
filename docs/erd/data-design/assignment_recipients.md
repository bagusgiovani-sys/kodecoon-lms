## assignment_recipients

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | publication_id | uuid | assignment_publications.id |
| FK | student_module_id | uuid | student_modules.id |
|  | submission_open | bool |  |
|  | revision | int |  |

