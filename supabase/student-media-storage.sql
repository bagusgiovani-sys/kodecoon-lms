-- Apply in the Supabase SQL Editor after schema.sql (or media migration).
-- Private files; upload tokens and short-lived download URLs are issued by the API.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-media','student-media',false,104857600,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Downloads are authorized against the metadata row under the caller's RLS.
create policy student_media_objects_read on storage.objects for select to authenticated
using (bucket_id='student-media' and exists (
 select 1 from public.student_media m where m.storage_path=name and m.ready
));
