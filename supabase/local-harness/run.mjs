import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const here = (f) => fileURLToPath(new URL(f, import.meta.url))
const KOMS = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(p, 'utf8')
const migration = read(`${KOMS}/supabase/migrations/202610170001_report_publications.sql`)
const fullSchema = read(`${KOMS}/schema.sql`)
const legacySchema = fullSchema.split('-- Report publication boundary (also supplied as a forward migration).')[0]
const migrationDb = await PGlite.create()
await migrationDb.exec(read(here('shim.sql')))
await migrationDb.exec(legacySchema)
await migrationDb.exec(`
  insert into centers(id,name) values ('00000000-0000-4000-8000-000000000001','Migration test');
  insert into students(id,center_id,name) values ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Existing student');
  insert into reports(student_id,raw_notes,final_pdf_url) values ('00000000-0000-4000-8000-000000000002','Preserve private notes','https://legacy.invalid/report');
`)
await migrationDb.exec(migration)
const migrated = await migrationDb.query(`select
  (select count(*) from reports where raw_notes = 'Preserve private notes' and pdf_storage_path is null) as preserved,
  (select count(*) from published_reports) as published,
  (select count(*) from pg_policies where policyname = 'reports_select_parent') as legacy_policy`)
if (migrated.rows[0].preserved !== 1 || migrated.rows[0].published !== 0 || migrated.rows[0].legacy_policy !== 0) throw new Error('Migration privacy/preservation failed')
await migrationDb.exec(`
  insert into auth.users(id) values ('00000000-0000-4000-8000-000000000003');
  insert into users(id,email,name,role,center_id) values ('00000000-0000-4000-8000-000000000003','migration@example.invalid','Teacher','teacher','00000000-0000-4000-8000-000000000001');
  insert into classes(id,center_id,teacher_id,name) values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','Legacy class');
  insert into sessions(id,class_id,teacher_id,session_date) values ('00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003',current_date);
  insert into attendance(session_id,student_id,status) values ('00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000002','present');
`)
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610180001_credit_ledger.sql`))
const cutover = await migrationDb.query(`select
 (select credit_billable from sessions limit 1) as billable,
 (select balance from credit_accounts limit 1) as balance,
 (select count(*) from credit_entries) as entries,
 (select status from attendance limit 1) as attendance`)
if (cutover.rows[0].billable !== false || cutover.rows[0].balance !== 0 || cutover.rows[0].entries !== 0 || cutover.rows[0].attendance !== 'present') throw new Error('Credit cutover changed legacy attendance/balances')
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610190001_course_library.sql`))
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610190002_class_course_links.sql`))
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610190003_assignments.sql`))
if ((await migrationDb.query('select count(*)::int as n from assignments')).rows[0].n !== 0) throw new Error('Assignment migration backfilled data')
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610200001_submissions.sql`))
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610210001_assignment_roster.sql`))
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610210002_feedback_publications.sql`))
await migrationDb.exec(read(`${KOMS}/supabase/migrations/202610210003_family_course_reads.sql`))
const familyCoursePolicies = await migrationDb.query(`select count(*)::int as n from pg_policies where policyname in (
  'courses_read_guardian_active_class',
  'course_lessons_read_guardian_active_class',
  'class_course_assignments_read_guardian_active_class'
)`)
if (familyCoursePolicies.rows[0].n !== 3) throw new Error('Family course read migration is incomplete')
if ((await migrationDb.query('select count(*)::int as n from published_feedback')).rows[0].n !== 0) throw new Error('Feedback migration published data')
if ((await migrationDb.query('select count(*)::int as n from submission_threads')).rows[0].n !== 0) throw new Error('Submission migration backfilled data')
const library = await migrationDb.query(`select
 (select count(*) from courses) as courses,
 (select count(*) from course_lessons) as lessons,
 (select count(*) from reports where raw_notes = 'Preserve private notes') as reports,
  (select count(*) from attendance where status = 'present') as attendance,
  (select count(*) from class_course_assignments) as links`)
if (library.rows[0].courses !== 0 || library.rows[0].lessons !== 0 || library.rows[0].reports !== 1 || library.rows[0].attendance !== 1 || library.rows[0].links !== 0) throw new Error('Course migration changed existing data')
await migrationDb.close()
console.log('OK  course migration adds an empty library and preserves existing data')
console.log('OK  class course link migration adds no links or changes to existing data')
console.log('OK  credit migration exempts existing sessions without retroactive charges')
console.log('OK  forward migration preserves legacy reports as private')
const db = await PGlite.create()

async function stage(name, sql) {
  try { const r = await db.exec(sql); console.log(`OK  ${name}`); return r }
  catch (e) {
    console.log(`ERR ${name}`)
    console.log(`    ${e.code ?? ''} ${e.message}`)
    for (const k of ['where','detail','hint']) if (e[k]) console.log(`    ${k}: ${e[k]}`)
    process.exit(1)
  }
}

await stage('shim (auth schema, roles)', read(here('shim.sql')))
await stage('schema.sql', read(`${KOMS}/schema.sql`))
await stage('supabase bootstrap grants', read(here('grants.sql')))
await stage('session RPC grants', read(here('session-rpc-grants.sql')))
await stage('report RPC grants', read(here('report-rpc-grants.sql')))
await stage('credit RPC grants', read(here('credit-rpc-grants.sql')))
await stage('course RPC grants', read(here('course-rpc-grants.sql')))
await stage('class course RPC grants', read(here('class-course-rpc-grants.sql')))
await stage('assignment RPC grants', read(here('assignment-rpc-grants.sql')))
await stage('submission RPC grants', read(here('submission-rpc-grants.sql')))
await stage('assignment roster RPC grants', read(here('assignment-roster-rpc-grants.sql')))
await stage('feedback RPC grants', read(here('feedback-rpc-grants.sql')))
const res = await stage('rls-verification.sql', read(`${KOMS}/supabase/rls-verification.sql`))

const sets = res.filter(r => r.rows && r.rows.length)
const verdict = sets[sets.length - 1].rows[0]
const table = sets[sets.length - 2].rows
const fails = table.filter(r => r.result === 'FAIL')

console.log('')
console.log('=== VERDICT ===')
console.log('  ' + JSON.stringify(verdict))
if (fails.length) {
  console.log('')
  console.log('=== FAILING CHECKS ===')
  fails.forEach(r => console.log('  FAIL  ' + r.name + (r.detail ? '  [' + r.detail + ']' : '')))
}
console.log('')
console.log('=== all checks (' + table.length + ') ===')
table.forEach(r => console.log('  ' + String(r.result).padEnd(6) + r.name))
await db.close()
if (fails.length) process.exitCode = 1
