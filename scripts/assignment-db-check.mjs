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
  for (const file of ['supabase/local-harness/shim.sql', 'schema.sql', 'supabase/local-harness/grants.sql', 'supabase/local-harness/course-rpc-grants.sql']) await db.exec(read(file))
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
  const created = await manage('create',0,2000,content)
  check(created,{id:id(400),revision:1,status:'draft'})
  check(await manage('create',0,2000,content),created)
  await denied('P0002',()=>manage('create',0,2000,{...content,title:'Reused'}))
  await denied('P0002',()=>manage('create',0,undefined,content))
  await denied('22023',()=>manage(null,1))
  await denied('22023',()=>manage('edit',1,undefined,{}))
  await denied('22023',()=>manage('edit',1,undefined,{...content,dueAt:undefined}))
  await denied('22023',()=>manage('edit',1,undefined,{...content,courseLessonId:id(999)}))
  await denied('42501',()=>db.exec('truncate assignments,assignment_learners,assignment_write_receipts'))
  check((await db.query("update assignments set title='Bypass' returning id")).rows,[])
  check((await db.query('delete from assignments returning id')).rows,[])
  check(await scalar('select count(*)::int from assignment_write_receipts'),0)
  await denied('42501',()=>db.exec(`insert into assignment_write_receipts(actor_id,request_id,payload,result) values('${id(11)}','${id(999)}','{}','{}')`))
  await denied('42501',()=>db.exec(`insert into assignment_learners(assignment_id,class_id,center_id,student_id) values('${id(400)}','${id(200)}','${id(1)}','${id(302)}')`))
  await denied('42501',()=>db.exec(`insert into assignments select '${id(499)}',class_id,center_id,course_assignment_id,course_id,course_lesson_id,title,brief,due_at,status,lesson_title_snapshot,lesson_objective_snapshot,revision,created_by,updated_by,created_at,updated_at,published_at from assignments`))
  check((await db.query('update assignment_learners set submission_open=false returning assignment_id')).rows,[])
  await db.exec('reset role')
  await denied('23503',()=>db.exec(`update assignments set center_id='${id(2)}' where id='${id(400)}'`))
  await denied('23503',()=>db.exec(`insert into assignment_learners(assignment_id,class_id,center_id,student_id) values('${id(400)}','${id(200)}','${id(2)}','${id(302)}')`))
  await actor(11)
  for (const n of [12,13,15,16]) {
    await actor(n)
    check(await scalar('select count(*)::int from assignments'),0)
    await denied('42501',()=>manage('publish',1))
  }
  await actor(0,'anon')
  await denied('42501',()=>manage('publish',1))
  await actor(11)
  check(await manage('edit',1,2001,{...content,title:'Final brief'}),{id:id(400),revision:2,status:'draft'})
  await denied('P0002',()=>manage('publish',1))
  const published=await manage('publish',2,2002)
  check(published,{id:id(400),revision:3,status:'published',learnerCount:1})
  check(await manage('publish',2,2002),published)
  await denied('P0002',()=>manage('edit',3,undefined,content))
  await save(100,101,1,{...lesson,title:'Changed reusable lesson'})
  check(await scalar(`select lesson_title_snapshot from assignments where id='${id(400)}'`),'Motors')
  await db.exec('reset role')
  await db.exec(`delete from enrollments where student_id='${id(301)}';
    insert into enrollments(class_id,student_id) values ('${id(200)}','${id(303)}');`)
  await actor(15)
  check(await scalar('select count(*)::int from assignments'),1)
  check(await scalar('select count(*)::int from assignment_learners'),1)
  check(await scalar(`select count(*)::int from assignment_learners where student_id='${id(302)}'`),0)
  check(await scalar('select count(*)::int from course_lessons'),0)
  await actor(11)
  await link(200,null)
  check(await manage('create',0,2000,content),created)
  check(await manage('publish',2,2002),published)
  await denied('P0002',()=>manage('create',0,undefined,content,401))
  check(await scalar('select count(*)::int from assignment_learners'),1)
  const archived=await manage('archive',3,2003)
  check(archived,{id:id(400),revision:4,status:'archived'})
  check(await manage('archive',3,2003),archived)
  check(await scalar('select submission_open from assignment_learners'),false)
  await actor(15)
  check(await scalar('select count(*)::int from assignments'),1)
  await db.exec('reset role')
  await db.exec(`delete from student_guardians where guardian_id='${id(15)}'`)
  await actor(15)
  check(await scalar('select count(*)::int from assignments'),0)
  check(await scalar('select count(*)::int from assignment_learners'),0)
  await actor(11)
  await link(200,100)
  await manage('create',0,2010,content,401)
  await link(200,null)
  await denied('P0002',()=>manage('publish',1,undefined,null,401))
  await denied('P0002',()=>manage('edit',1,undefined,content,401))
  await actor(14)
  check((await manage('archive',1,undefined,null,401)).status,'archived')
  await db.exec('reset role')
  await db.exec(`update classes set teacher_id='${id(12)}' where id='${id(200)}'`)
  await actor(11)
  await denied('42501',()=>manage('create',0,2000,content))
  await denied('42501',()=>manage('publish',2,2002))
  console.log(`Assignment database checks passed: ${checks}`)
} finally { await db.close() }
