## lesson_materials

Owner: kodenexus

| Key | Field | Type | References |
|---|---|---|---|
| PK | id | uuid |  |
| FK | module_lesson_id | uuid | module_lessons.id |
| FK | source_media_id | uuid | media_files.id |
| FK | preview_media_id | uuid? | media_files.id |
|  | title | text |  |
|  | audience | enum |  |
|  | version | int |  |
|  | archived_at | timestamp? |  |

