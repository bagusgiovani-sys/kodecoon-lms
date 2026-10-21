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
const course = { title: 'Robotics', category: 'STEM', age_range: '8â€“12', level: 'Beginner', description: '', prerequisites: '', archived: false }
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
  await db.exec(forwardMigration ? read('schema.sql').split('-- Explicit assignment roster changes (forward migration).')[0] : read('schema.sql'))
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
  await manage('create',0,2000,content)
  await manage('publish',1,2001)
  const submission = (await db.query('select submit_assignment($1,$2,$3,$4,$5) as result',
    [id(400),id(301),id(2002),'https://example.org','Original work'])).rows[0].result
  await db.exec('reset role')
  if (forwardMigration) {
    const before = (await db.query('select * from assignment_learners')).rows
    await db.exec(read('supabase/migrations/202610210001_assignment_roster.sql'))
    const after = (await db.query('select * from assignment_learners')).rows
    check(after.map(({revision, ...row}) => { assert.equal(revision,1); return row }),before)
    check(await scalar('select count(*)::int from submission_versions'),1)
    check(await scalar('select reflection from submission_versions'),'Original work')
  }
  await db.exec(read('supabase/local-harness/submission-rpc-grants.sql'))
  await db.exec(read('supabase/local-harness/assignment-roster-rpc-grants.sql'))
  const roster = async (student, open, revision, request=++requestNumber, assignment=400) =>
    (await db.query('select set_assignment_learner($1,$2,$3,$4,$5) as result',
      [id(assignment),id(student),open,revision,id(request)])).rows[0].result
  const learner = async student => (await db.query('select submission_open,revision from assignment_learners where assignment_id=$1 and student_id=$2',[id(400),id(student)])).rows[0]
  const submit = async () => (await db.query('select submit_assignment($1,$2,$3,$4,$5) as result',
    [id(400),id(301),id(++requestNumber),'https://example.org','New work'])).rows[0].result
  for (const n of [12,13,15,16]) { await actor(n); await denied('42501',()=>roster(301,false,1)) }
  await actor(0,'anon'); await denied('42501',()=>roster(301,false,1))
  await actor(11)
  await denied('22023',()=>roster(301,null,1))
  await denied('22023',()=>roster(301,false,-1))
  await denied('22023',()=>roster(301,false,null))
  await denied('42501',()=>roster(301,false,1,undefined,999))
  await denied('P0002',()=>roster(301,false,0))
  await denied('22023',()=>roster(303,true,0))
  await denied('P0002',()=>roster(303,false,0))
  await denied('P0002',()=>roster(301,false,1,2000)) // shared assignment receipt namespace
  const closed = await roster(301,false,1,3000)
  check(closed,{assignmentId:id(400),studentId:id(301),submissionOpen:false,revision:2})
  check(await roster(301,false,1,3000),closed)
  await denied('P0002',()=>roster(301,true,1,3000))
  await denied('P0002',()=>roster(301,true,1))
  check(await roster(301,false,2),closed) // already closed is a safe no-op
  await actor(15)
  check(await scalar('select count(*)::int from submission_versions'),1)
  check(await scalar('select count(*)::int from assignments'),1)
  check(await scalar('select count(*)::int from assignment_write_receipts'),0)
  await denied('P0002',submit)
  await actor(14)
  check((await roster(301,true,2)).revision,3)
  await actor(15); check((await submit()).version,2)
  await db.exec('reset role')
  await db.exec(`insert into enrollments(class_id,student_id) values('${id(200)}','${id(303)}');
    insert into students(id,center_id,name) values('${id(304)}','${id(2)}','Other center');
    insert into enrollments(class_id,student_id) values('${id(200)}','${id(304)}');`)
  await actor(11)
  check(await scalar(`select count(*)::int from assignment_learners where student_id='${id(303)}'`),0)
  await denied('22023',()=>roster(304,true,0))
  check(await roster(303,true,0,3001),{assignmentId:id(400),studentId:id(303),submissionOpen:true,revision:1})
  check((await roster(303,true,0,3001)).revision,1)
  await denied('P0002',()=>roster(303,true,0))
  await actor(15)
  check(await scalar('select count(*)::int from assignment_learners'),1) // sibling/unrelated snapshot stays private
  await db.exec('reset role')
  await db.exec(`delete from enrollments where student_id='${id(301)}'`)
  await actor(11)
  check(await learner(301),{submission_open:false,revision:4})
  await denied('22023',()=>roster(301,true,4))
  check((await roster(301,false,4)).revision,4)
  await db.exec('reset role')
  await db.exec(`insert into enrollments(class_id,student_id) values('${id(200)}','${id(301)}')`)
  await actor(11)
  check(await learner(301),{submission_open:false,revision:4})
  await denied('P0002',()=>roster(301,true,3))
  check((await roster(301,true,4)).revision,5)
  check(await roster(301,false,1,3000),closed) // retry reports original operation without changing current state
  check(await learner(301),{submission_open:true,revision:5})
  check(await scalar(`select count(*)::int from submission_versions where thread_id='${submission.threadId}'`),2)
  check((await db.query('update assignment_learners set submission_open=false,revision=1 returning student_id')).rows,[])
  check((await db.query('delete from assignment_learners returning student_id')).rows,[])
  await denied('42501',()=>db.exec('truncate assignment_learners cascade'))
  await denied('42501',()=>db.exec('select bump_assignment_learner_revision()'))
  await manage('create',0,4000,content,401)
  await denied('P0002',()=>roster(301,true,0,undefined,401))
  await manage('archive',2)
  check(await learner(301),{submission_open:false,revision:6})
  check(await learner(303),{submission_open:false,revision:2})
  await denied('P0002',()=>roster(301,true,6))
  await denied('P0002',()=>roster(301,false,6))
  check(await roster(301,false,1,3000),closed)
  await db.exec('reset role')
  await db.exec(`update classes set teacher_id='${id(12)}' where id='${id(200)}'`)
  await actor(11); await denied('42501',()=>roster(301,false,1,3000))
  await actor(15)
  check(await scalar('select count(*)::int from submission_versions'),2)
  await db.exec('reset role')
  await db.exec(`delete from student_guardians where guardian_id='${id(15)}'`)
  await actor(15)
  check(await scalar('select count(*)::int from assignment_learners'),0)
  console.log(`Assignment roster database checks passed (${forwardMigration ? 'forward migration' : 'fresh schema'}): ${checks}`)
} finally { await db.close() }
