## checklist_items

Owner: kodehub

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | section_id | uuid | checklist_sections.id |
|  | wording | text |  |
|  | scope | enum |  |
|  | applicability_rule | text |  |
|  | display_order | int |  |

