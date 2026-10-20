import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const db = await PGlite.create()
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
let checks = 0, requestNumber = 1000
const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++ }
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0]
const actor = async (n, role = 'authenticated') => {
  await db.exec(`reset role; set role ${role}; set request.jwt.claim.sub = '${id(n)}'`)
}
const course = { title: 'Robotics', category: 'STEM', age_range: '8–12', level: 'Beginner', description: '', prerequisites: '', archived: false }
const lesson = { title: 'Motors', sequence: 1, minutes: 60, objective: 'Build', materials: 'Kit', steps: 'Connect', evidence: 'Video', archived: false }
const save = async (courseId, lessonId, revision, content, request = ++requestNumber) => {
  const result = await db.query('select save_course_content($1,$2,$3,$4,$5::jsonb) as result',
    [id(courseId), lessonId === null ? null : id(lessonId), revision, id(request), JSON.stringify(content)])
  return result.rows[0].result
}
const link = async (classId, courseId, request = ++requestNumber) => {
  const result = await db.query('select set_class_course($1,$2,$3) as result', [id(classId), courseId === null ? null : id(courseId), id(request)])
  return result.rows[0].result
}
async function denied(code, action) {
  await assert.rejects(action, error => error.code === code)
  checks++
}
try {
  const forwardMigration = process.argv.includes('--migration')
  await db.exec(read('supabase/local-harness/shim.sql'))
  await db.exec(forwardMigration ? read('schema.sql').split('-- Versioned learner submissions and review history (forward migration).')[0] : read('schema.sql'))
  for (const file of ['supabase/local-harness/grants.sql', 'supabase/local-harness/course-rpc-grants.sql']) await db.exec(read(file))
  await db.exec(`insert into centers(id,name) values ('${id(1)}','One'),('${id(2)}','Two');
    insert into auth.users(id) values ${[11,12,13,14,15,16].map(n => `('${id(n)}')`).join(',')};
    insert into users(id,email,name,role,center_id) values
      ('${id(11)}','a@invalid','Owner','teacher','${id(1)}'),
      ('${id(12)}','b@invalid','Peer','teacher','${id(1)}'),
      ('${id(13)}','c@invalid','Other center','admin','${id(2)}'),
      ('${id(14)}','d@invalid','Admin','admin','${id(1)}'),
      ('${id(15)}','e@invalid','Parent','parent',null),
      ('${id(16)}','f@invalid','Manager','center_manager','${id(1)}');`)
  await db.exec(`insert into classes(id,center_id,teacher_id,name) values
    ('${id(200)}','${id(1)}','${id(11)}','Owner class'),
    ('${id(201)}','${id(1)}','${id(12)}','Peer class'),
    ('${id(202)}','${id(2)}','${id(13)}','Other center class');`)

  await db.exec(read('supabase/local-harness/assignment-rpc-grants.sql'))
  await db.exec(`insert into students(id,center_id,name) values
    ('${id(301)}','${id(1)}','Child'),('${id(302)}','${id(1)}','Sibling'),('${id(303)}','${id(1)}','Later learner');
    insert into student_guardians(student_id,guardian_id) values ('${id(301)}','${id(15)}'),('${id(302)}','${id(15)}');
    insert into enrollments(class_id,student_id) values ('${id(200)}','${id(301)}');`)
  await actor(11)
  await save(100,null,0,course)
  await save(100,101,0,lesson)
  await link(200,100)
  const content = {title:'Build a motor',brief:'Share evidence',dueAt:null,courseLessonId:id(101)}
  const manage = async (action, revision, request=++requestNumber, body=null, assignment=400) =>
    (await db.query('select manage_assignment($1,$2,$3,$4,$5,$6::jsonb) as result',
      [action,id(assignment),action==='create'?id(200):null,revision,id(request),body===null?null:JSON.stringify(body)])).rows[0].result
  if (forwardMigration) {
    await manage('create',0,9000,content,401)
    await manage('publish',1,9001,null,401)
    await db.exec('reset role')
    await db.exec(`delete from enrollments where student_id='${id(301)}'`)
    await db.exec(read('supabase/migrations/202610200001_submissions.sql'))
    await db.exec('grant all on submission_threads,submission_versions,submission_reviews,submission_write_receipts to anon,authenticated')
    check(await scalar(`select submission_open from assignment_learners where assignment_id='${id(401)}'`),false)
    check(await scalar(`select title from assignments where id='${id(401)}'`),'Build a motor')
    check(await scalar(`select lesson_title_snapshot from assignments where id='${id(401)}'`),'Motors')
    check(await scalar('select count(*)::int from submission_threads'),0)
    await db.exec(`insert into enrollments(class_id,student_id) values('${id(200)}','${id(301)}')`)
    await actor(11)
  }
  await db.exec('reset role')
  await db.exec(read('supabase/local-harness/submission-rpc-grants.sql'))
  await actor(11)
  await manage('create',0,2000,{...content,dueAt:'2020-01-01T00:00:00Z'})
  const submit = async (student=301, request=++requestNumber, url='https://example.org/project', reflection='I built a motor', assignment=400) =>
    (await db.query('select submit_assignment($1,$2,$3,$4,$5) as result',[id(assignment),id(student),id(request),url,reflection])).rows[0].result
  const review = async (submission, version, previous=null, request=++requestNumber, outcome='approved', feedback='Well done') =>
    (await db.query('select review_submission($1,$2,$3,$4,$5,$6) as result',[submission,version,previous,id(request),outcome,feedback])).rows[0].result
  await denied('42501',()=>submit())
  await manage('publish',1,2001)
  for (const url of ['https://example.org\n','http://example.org','javascript:alert(1)','https://user:pass@example.org','https://example.org:65536','https://example.org:0','https://example.org/with space','https://example.org/\\bad','https://example.org\n.evil'])
    await denied('22023',()=>submit(301,undefined,url))
  await denied('22023',()=>submit(301,undefined,undefined,''))
  await denied('22023',()=>submit(301,undefined,undefined,'\t\n'))
  await denied('42501',()=>submit(302))
  for (const n of [12,13,16]) { await actor(n); await denied('42501',()=>submit()) }
  await actor(0,'anon'); await denied('42501',()=>submit())
  await actor(15)
  const first=await submit(301,3000)
  check(first.version,1);check(first.status,'submitted');check(first.isLate,true)
  check(await submit(301,3000),first)
  await denied('P0002',()=>submit(301,3000,'https://example.org/changed'))
  check(await scalar('select count(*)::int from submission_versions'),1)
  check(await scalar('select submitted_role from submission_versions'),'parent')
  await denied('42501',()=>review(first.id,1))
  await denied('42501',()=>submit(302))
  check(await scalar('select count(*)::int from submission_threads'),1)
  for (const n of [12,13,16]) {
    await actor(n)
    check(await scalar('select count(*)::int from submission_versions'),0)
    await denied('42501',()=>review(first.id,1))
  }
  await actor(11)
  await denied('22023',()=>review(first.id,1,null,undefined,'other'))
  await denied('P0002',()=>review(first.id,2))
  const approved=await review(first.id,1,null,3001)
  check(approved.status,'approved');check(approved.sequence,1)
  check(await review(first.id,1,null,3001),approved)
  await denied('P0002',()=>review(first.id,1,null,3001,'revision'))
  await denied('P0002',()=>review(first.id,1))
  const corrected=await review(first.id,1,approved.id,3002,'revision','Try adding a switch')
  check(corrected.sequence,2)
  check(await scalar(`select supersedes_id from submission_reviews where id='${corrected.id}'`),approved.id)
  check(await review(first.id,1,approved.id,3002,'revision','Try adding a switch'),corrected)
  await actor(15)
  check(await scalar('select count(*)::int from submission_reviews'),2)
  check(await scalar('select count(*)::int from submission_write_receipts'),0)
  check((await db.query("update submission_versions set reflection='tamper' returning id")).rows,[])
  check((await db.query('delete from submission_reviews returning id')).rows,[])
  check((await db.query('update submission_threads set next_version=99 returning id')).rows,[])
  await denied('42501',()=>db.exec(`insert into submission_versions(thread_id,version,project_url,reflection,submitted_by,submitted_role,is_late,request_id) values('${first.threadId}',2,'https://example.org','Fake','${id(15)}','teacher',false,'${id(3999)}')`))
  await denied('42501',()=>db.exec(`insert into submission_reviews(submission_id,sequence,outcome,feedback,reviewed_by,request_id) values('${first.id}',3,'approved','Fake','${id(15)}','${id(3999)}')`))
  await denied('42501',()=>db.exec(`insert into submission_write_receipts values('${id(15)}','${id(3999)}','{}','{}')`))
  await denied('42501',()=>db.exec('truncate submission_threads,submission_versions,submission_reviews,submission_write_receipts'))
  const second=await submit(301,3003)
  check(second.version,2);check(second.status,'submitted')
  check(await scalar(`select count(*)::int from submission_reviews where submission_id='${second.id}'`),0)
  await actor(11)
  await denied('P0002',()=>review(first.id,1,corrected.id))
  check(await review(first.id,1,null,3001),approved)
  const third=await submit(301,3004)
  check(third.version,3)
  check(await scalar(`select submitted_role from submission_versions where id='${third.id}'`),'teacher')
  await denied('P0002',()=>review(third.id,3,null,3004))
  await actor(14)
  check((await review(third.id,3)).status,'approved')
  await actor(15)
  const fourth=await submit(301,3005)
  check(fourth.version,4)
  await db.exec('reset role')
  await db.exec(`delete from enrollments where student_id='${id(301)}'`)
  await actor(15)
  check(await scalar(`select submission_open from assignment_learners where assignment_id='${id(400)}'`),false)
  check(await scalar('select count(*)::int from submission_versions'),4)
  await denied('P0002',()=>submit())
  check(await submit(301,3000),first)
  await db.exec('reset role')
  await db.exec(`insert into enrollments(class_id,student_id) values('${id(200)}','${id(301)}')`)
  await actor(15)
  await denied('P0002',()=>submit())
  await db.exec('reset role')
  await db.exec(`delete from student_guardians where guardian_id='${id(15)}'`)
  await actor(15)
  check(await scalar('select count(*)::int from submission_threads'),0)
  check(await scalar('select count(*)::int from submission_versions'),0)
  check(await scalar('select count(*)::int from submission_reviews'),0)
  await denied('42501',()=>submit(301,3000))
  await actor(11)
  await manage('archive',2,2002)
  await denied('P0002',()=>review(fourth.id,4))
  await denied('P0002',()=>submit())
  check(await submit(301,3004),third)
  await db.exec('reset role')
  await db.exec(`update classes set teacher_id='${id(12)}' where id='${id(200)}'`)
  await actor(11)
  await denied('42501',()=>submit(301,3004))
  await denied('42501',()=>review(first.id,1,null,3001))
  await actor(12)
  check(await scalar('select count(*)::int from submission_versions'),4)
  console.log(`Submission database checks passed (${forwardMigration ? 'forward migration' : 'fresh schema'}): ${checks}`)
} finally { await db.close() }
