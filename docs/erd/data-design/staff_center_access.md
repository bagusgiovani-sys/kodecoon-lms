## staff_center_access

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | user_id | uuid | users.id |
| FK | center_id | uuid | centers.id |
|  | active | bool |  |

