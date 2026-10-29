## feedback_cycles

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | student_id | uuid | students.id |
|  | cycle_no | int |  |
|  | attended_from | int |  |
|  | attended_to | int |  |
|  | status | enum |  |

