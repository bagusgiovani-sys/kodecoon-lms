import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const here = (f) => fileURLToPath(new URL(f, import.meta.url))
const KOMS = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(p, 'utf8')
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
