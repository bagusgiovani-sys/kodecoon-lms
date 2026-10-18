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
await migrationDb.close()
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
