import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const db = await PGlite.create()
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,'0')}`
let checks=0, requestNumber=1000
const check = (actual,expected) => { assert.deepEqual(actual,expected); checks++ }
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0]
const actor = async (n,role='authenticated') => db.exec(`reset role; set role ${role}; set request.jwt.claim.sub='${id(n)}'`)
const denied = async (code,action) => { await assert.rejects(action,error=>error.code===code); checks++ }
const content = {title:'Motor skills',lessonId:id(501),strengths:'Built a working rover',nextSteps:'Add sensors',rating:'Growing'}
const feedback = async (action, revision, request=++requestNumber, body=null, target=id(400), student=301, cls=200) =>
  (await db.query('select manage_feedback($1,$2,$3,$4,$5,$6,$7::jsonb) as result',
    [action,target,action==='create'?id(student):null,action==='create'?id(cls):null,revision,id(request),body===null?null:JSON.stringify(body)])).rows[0].result
try {
  const forwardMigration=process.argv.includes('--migration')
  await db.exec(read('supabase/local-harness/shim.sql'))
  const schema=read('schema.sql')
  await db.exec(forwardMigration?schema.split('-- General feedback publication boundary (forward migration).')[0]:schema)
  await db.exec(`insert into centers(id,name) values('${id(1)}','One'),('${id(2)}','Two');
    insert into auth.users(id) values ${[11,12,13,14,15,16,17].map(n=>`('${id(n)}')`).join(',')};
    insert into users(id,email,name,role,center_id) values
      ('${id(11)}','owner@invalid','Owner','teacher','${id(1)}'),
      ('${id(12)}','peer@invalid','Peer','teacher','${id(1)}'),
      ('${id(13)}','other@invalid','Other admin','admin','${id(2)}'),
      ('${id(14)}','admin@invalid','Admin','admin','${id(1)}'),
      ('${id(15)}','parent@invalid','Parent','parent',null),
      ('${id(16)}','manager@invalid','Manager','center_manager','${id(1)}'),
      ('${id(17)}','family@invalid','Other parent','parent',null);
    insert into classes(id,center_id,teacher_id,name) values
      ('${id(200)}','${id(1)}','${id(11)}','Class'),('${id(201)}','${id(1)}','${id(12)}','Peer class');
    insert into students(id,center_id,name) values
      ('${id(301)}','${id(1)}','Child'),('${id(302)}','${id(1)}','Sibling'),('${id(303)}','${id(2)}','Other center');
    insert into student_guardians(student_id,guardian_id) values('${id(301)}','${id(15)}'),('${id(302)}','${id(15)}');
    insert into enrollments(class_id,student_id) values('${id(200)}','${id(301)}'),('${id(200)}','${id(302)}');
    insert into lessons(id,class_id,title,sequence_number) values('${id(501)}','${id(200)}','Motors',1),('${id(502)}','${id(201)}','Other lesson',1);`)
  if (forwardMigration) {
    const before=(await db.query('select * from lessons order by id')).rows
    await db.exec(read('supabase/migrations/202610210002_feedback_publications.sql'))
    check((await db.query('select * from lessons order by id')).rows,before)
    check(await scalar('select count(*)::int from student_feedback'),0)
    check(await scalar('select count(*)::int from published_feedback'),0)
    check(await scalar('select count(*)::int from enrollments'),2)
  }
  await db.exec(read('supabase/local-harness/grants.sql'))
  await db.exec(read('supabase/local-harness/feedback-rpc-grants.sql'))
  await actor(11)
  await denied('22023',()=>feedback(null,0))
  await denied('22023',()=>feedback('create',0,undefined,{}))
  for (const invalid of [{...content,rating:'Excellent'},{...content,strengths:' \n\t'},{...content,nextSteps:''},{...content,title:'x'.repeat(201)}])
    await denied('23514',()=>feedback('create',0,undefined,invalid))
  await denied('22023',()=>feedback('create',0,undefined,{...content,actorId:id(14)}))
  await denied('22023',()=>feedback('create',0,undefined,{...content,lessonId:undefined}))
  await denied('23503',()=>feedback('create',0,undefined,{...content,lessonId:id(502)}))
  await denied('22023',()=>feedback('create',0,undefined,content,id(400),303))
  await denied('42501',()=>feedback('create',0,undefined,content,id(400),301,201))
  for (const n of [12,13,15,16,17]) { await actor(n); await denied('42501',()=>feedback('create',0,undefined,content)) }
  await actor(0,'anon'); await denied('42501',()=>feedback('create',0,undefined,content))
  await actor(11)
  const draft=await feedback('create',0,2000,content)
  check(draft,{id:id(400),revision:1});check(await feedback('create',0,2000,content),draft)
  await denied('P0002',()=>feedback('create',0,2000,{...content,title:'Changed'}))
  await denied('P0002',()=>feedback('create',0,undefined,content))
  await denied('P0002',()=>feedback('publish',2))
  await actor(15)
  check(await scalar('select count(*)::int from student_feedback'),0)
  check(await scalar('select count(*)::int from published_feedback'),0)
  await denied('42501',()=>feedback('publish',1))
  await actor(11)
  const first=await feedback('publish',1,2001)
  check(first.draftRevision,1);check(first.withdrawn,false)
  check(await feedback('publish',1,2001),first)
  await denied('P0002',()=>feedback('publish',1))
  await denied('P0002',()=>feedback('edit',1,2001,content))
  check(await feedback('edit',1,2002,{...content,strengths:'Private newer draft'}),{id:id(400),revision:2})
  check(await feedback('edit',1,2002,{...content,strengths:'Private newer draft'}),{id:id(400),revision:2})
  await denied('P0002',()=>feedback('edit',1,undefined,content))
  await denied('P0002',()=>feedback('publish',1))
  for (const n of [12,13,16,17]) {
    await actor(n)
    check(await scalar('select count(*)::int from student_feedback'),0)
    check(await scalar('select count(*)::int from published_feedback'),0)
    await denied('42501',()=>feedback('edit',2,undefined,content))
    await denied('42501',()=>feedback('withdraw',1,undefined,null,first.id))
  }
  await actor(15)
  check(await scalar('select count(*)::int from student_feedback'),0)
  check(await scalar('select strengths from published_feedback'),'Built a working rover')
  check(await scalar('select count(*)::int from feedback_write_receipts'),0)
  await denied('42501',()=>feedback('withdraw',1,undefined,null,first.id))
  await actor(14)
  check(await scalar('select count(*)::int from student_feedback'),1)
  const second=await feedback('publish',2,2003)
  check(second.draftRevision,2);check(second.id===first.id,false)
  await actor(11)
  await feedback('create',0,2004,{...content,lessonId:null},id(401),302)
  const sibling=await feedback('publish',1,2005,null,id(401))
  await actor(15)
  check(await scalar(`select count(*)::int from published_feedback where student_id='${id(301)}'`),2)
  check(await scalar(`select count(*)::int from published_feedback where student_id='${id(302)}'`),1)
  for (const table of ['student_feedback','published_feedback','feedback_write_receipts']) {
    check((await db.query(`delete from ${table} returning *`)).rows,[])
    await denied('42501',()=>db.exec(`truncate ${table} cascade`))
  }
  check((await db.query("update published_feedback set strengths='Tamper' returning id")).rows,[])
  await denied('42501',()=>db.exec(`insert into feedback_write_receipts(actor_id,request_id,payload,result) values('${id(15)}','${id(9999)}','{}','{}')`))
  await actor(11)
  check((await db.query("update student_feedback set strengths='Bypass' returning id")).rows,[])
  await denied('42501',()=>db.exec(`insert into published_feedback select '${id(499)}',feedback_id,student_id,class_id,center_id,999,title,strengths,next_steps,rating,published_by,published_at,withdrawn_by,withdrawn_at from published_feedback limit 1`))
  await denied('42501',()=>db.exec(`insert into student_feedback select '${id(499)}',student_id,class_id,center_id,lesson_id,title,strengths,next_steps,rating,revision,created_by,updated_by,created_at,updated_at from student_feedback limit 1`))
  await denied('P0002',()=>feedback('withdraw',2,undefined,null,first.id))
  const withdrawn=await feedback('withdraw',1,2006,null,first.id)
  check(withdrawn.withdrawn,true)
  check(await feedback('withdraw',1,2006,null,first.id),withdrawn)
  check(await feedback('withdraw',1,undefined,null,first.id),withdrawn)
  check(await feedback('publish',1,2001),first) // retry never reopens withdrawn snapshot
  await actor(15)
  check(await scalar(`select count(*)::int from published_feedback where id='${first.id}'`),0)
  check(await scalar(`select strengths from published_feedback where id='${second.id}'`),'Private newer draft')
  await db.exec('reset role')
  await db.exec(`delete from enrollments where student_id='${id(301)}'`)
  await actor(15)
  check(await scalar(`select count(*)::int from published_feedback where student_id='${id(301)}'`),1)
  await actor(11)
  check(await feedback('create',0,2000,content),draft)
  check((await feedback('edit',2,undefined,{...content,nextSteps:'Historical correction'})).revision,3)
  check((await feedback('publish',3)).draftRevision,3)
  await denied('22023',()=>feedback('create',0,undefined,content,id(402)))
  await db.exec('reset role')
  await db.exec(`delete from student_guardians where student_id='${id(301)}'`)
  await actor(15)
  check(await scalar('select count(*)::int from published_feedback'),1)
  check(await scalar('select id from published_feedback'),sibling.id)
  await db.exec('reset role')
  await db.exec(`update classes set teacher_id='${id(12)}' where id='${id(200)}'`)
  await actor(11)
  await denied('42501',()=>feedback('create',0,2000,content))
  await denied('42501',()=>feedback('publish',1,2001))
  await denied('42501',()=>feedback('withdraw',1,2006,null,first.id))
  await actor(12)
  check(await scalar('select count(*)::int from student_feedback'),2)
  check((await feedback('withdraw',2,undefined,null,second.id)).withdrawn,true)
  await actor(0,'anon')
  check(await scalar('select count(*)::int from published_feedback'),0)
  check(await scalar('select count(*)::int from student_feedback'),0)
  console.log(`Feedback database checks passed (${forwardMigration?'forward migration':'fresh schema'}): ${checks}`)
} finally { await db.close() }
