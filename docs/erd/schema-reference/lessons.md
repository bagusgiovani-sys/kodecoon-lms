# lessons

Existing schema.sql:105. Not a standalone migration.

```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  sequence_number int not null, -- position on the journey path, 1-indexed
  title text not null,
  description text,
  created_at timestamptz default now(),
  unique (class_id, sequence_number)
);
alter table lessons add constraint lessons_id_class_unique unique(id,class_id);
alter table lessons add column course_id uuid;
alter table lessons add column course_lesson_id uuid;
alter table lessons add constraint lessons_course_mapping_pair
  check ((course_id is null) = (course_lesson_id is null));
alter table lessons add constraint lessons_course_mapping_source_fk
  foreign key (course_lesson_id,course_id) references course_lessons(id,course_id);
```
