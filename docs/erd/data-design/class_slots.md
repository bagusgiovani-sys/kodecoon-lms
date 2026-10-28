## class_slots

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | class_group_id | uuid | class_groups.id |
|  | weekday | int |  |
|  | start_time | time |  |
|  | end_time | time |  |
|  | valid_from | date |  |
|  | valid_to | date? |  |

