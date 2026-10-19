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
  await actor(11)
  check(await save(100,null,0,course,1000), { id: id(100), revision: 1 })
  check(await save(100,null,0,course,1000), { id: id(100), revision: 1 })
  await denied('P0002', () => save(100,null,0,{ ...course, title: 'Changed' },1000))
  await denied('P0002', () => save(100,null,0,course))
  check(await save(100,101,0,lesson,1001), { id: id(101), revision: 1 })
  check(await save(100,101,0,lesson,1001), { id: id(101), revision: 1 })
  await denied('P0002', () => save(100,101,0,{ ...lesson, title: 'Changed' },1001))
  await denied('23505', () => save(100,102,0,lesson))
  check(await scalar(`select count(*)::int from course_lessons`), 1)
  await denied('23514', () => save(100,102,0,{ ...lesson, sequence: 2, minutes: 0 }))
  await denied('22023', () => save(100,102,0,{ ...lesson, sequence: 2.5 }))
  await denied('23514', () => save(100,null,1,{ ...course, title: ' ' }))
  await denied('22023', () => save(100,null,1,{ ...course, owner_id: id(12) }))
  await denied('22023', () => save(100,null,1,{ ...course, title: {} }))
  await denied('22023', () => save(100,null,1,{ ...course, archived: null }))
  await denied('42501', () => db.query(`insert into courses select '${id(199)}',center_id,owner_id,title,category,age_range,level,description,prerequisites,revision,archived_at,created_at,updated_at from courses`))
  check((await db.query('update courses set title = $1 returning id', ['Bypass'])).rows, [])
  check((await db.query('delete from course_lessons returning id')).rows, [])
  check((await db.query('update course_lessons set minutes=1 returning id')).rows, [])
  await denied('42501', () => db.query(`insert into course_lessons(id,course_id,sequence,title,minutes,objective,materials,steps,evidence)
    values('${id(199)}','${id(100)}',3,'Bypass',60,'','','','')`))
  await denied('42501', () => db.query(`insert into course_write_receipts(actor_id,request_id,payload,result)
    values('${id(11)}','${id(199)}','{}','{}')`))
  check(await scalar('select count(*)::int from course_write_receipts'), 0)
  await denied('42501', () => db.exec('truncate courses,course_lessons,course_write_receipts'))
  await actor(12)
  check(await scalar('select count(*)::int from courses'), 1)
  check(await scalar('select count(*)::int from course_lessons'), 1)
  await denied('42501', () => save(100,null,1,course))
  await denied('42501', () => save(100,101,1,lesson))
  await save(200,null,0,course)
  await denied('42501', () => save(200,101,1,lesson))
  for (const n of [13,15,16]) {
    await actor(n)
    check(await scalar('select count(*)::int from courses'), 0)
    check(await scalar('select count(*)::int from course_lessons'), 0)
    await denied('42501', () => save(100,null,1,course))
  }
  await actor(0,'anon')
  check(await scalar('select count(*)::int from courses'), 0)
  await denied('42501', () => save(100,null,1,course))
  await actor(14)
  check(await save(100,null,1,{ ...course, archived: true },1100), { id: id(100), revision: 2 })
  check(await scalar(`select owner_id from courses where id='${id(100)}'`),id(11))
  await denied('P0002', () => save(100,101,1,lesson))
  check(await save(100,null,2,course), { id: id(100), revision: 3 })
  check(await save(100,null,1,{ ...course, archived: true },1100), { id: id(100), revision: 2 })
  check(await scalar(`select archived_at from courses where id='${id(100)}'`),null)
  check(await save(100,101,1,{ ...lesson, archived: true }), { id: id(101), revision: 2 })
  check(await save(100,101,2,lesson), { id: id(101), revision: 3 })
  await denied('P0002', () => save(100,101,1,lesson))
  // Retry authorization follows the current role, not the original receipt.
  await db.exec(`reset role; set request.jwt.claim.sub = ''; update users set role='parent',center_id=null where id='${id(14)}';`)
  await actor(14)
  await denied('42501', () => save(100,null,1,{ ...course, archived: true },1100))
  await db.exec('reset role')
  await denied('23503', () => db.query(`update courses set center_id='${id(2)}' where id='${id(100)}'`))
  check(await scalar('select count(*)::int from lessons'), 0)
  check(await scalar('select count(*)::int from student_lesson_progress'), 0)
  console.log(`PASS: ${checks} course database assertions (RLS, owner/center constraints, retries, revisions, archive/restore, input validation, unchanged journey tables)`)
} finally { await db.close() }
