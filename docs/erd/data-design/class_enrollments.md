## class_enrollments

Owner: shared

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_id | uuid | students.id |
| FK | class_group_id | uuid | class_groups.id |
|  | valid_from | date |  |
|  | valid_to | date? |  |

