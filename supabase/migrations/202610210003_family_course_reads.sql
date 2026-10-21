begin;

-- A guardian can read only the currently assigned module and its active lessons
-- for a class in which their linked child is enrolled.
drop policy if exists "courses_read_guardian_active_class" on courses;
drop policy if exists "course_lessons_read_guardian_active_class" on course_lessons;
drop policy if exists "class_course_assignments_read_guardian_active_class" on class_course_assignments;

create policy "courses_read_guardian_active_class" on courses for select to authenticated
using (
  archived_at is null and exists (
    select 1
    from class_course_assignments ca
    join enrollments e on e.class_id = ca.class_id
    join student_guardians sg on sg.student_id = e.student_id
    where ca.course_id = courses.id
      and ca.ended_at is null
      and sg.guardian_id = auth.uid()
  )
);

create policy "course_lessons_read_guardian_active_class" on course_lessons for select to authenticated
using (
  archived_at is null and exists (
    select 1
    from class_course_assignments ca
    join enrollments e on e.class_id = ca.class_id
    join student_guardians sg on sg.student_id = e.student_id
    where ca.course_id = course_lessons.course_id
      and ca.ended_at is null
      and sg.guardian_id = auth.uid()
  )
);

create policy "class_course_assignments_read_guardian_active_class" on class_course_assignments for select to authenticated
using (
  ended_at is null and exists (
    select 1
    from enrollments e
    join student_guardians sg on sg.student_id = e.student_id
    where e.class_id = class_course_assignments.class_id
      and sg.guardian_id = auth.uid()
  )
);

commit;
