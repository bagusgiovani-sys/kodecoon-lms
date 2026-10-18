// Exercise the actual download handler with isolated Auth/Storage adapters.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
const requireModule = createRequire(import.meta.url)
const { NextResponse } = requireModule('next/server')
const { z } = requireModule('zod')
const id = '00000000-0000-4000-8000-000000000123'
const student = '00000000-0000-4000-8000-000000000501'
let row, queryError, authFailure, signFailure, storageCalls, filters, authKind
const query = {
  select() { return this },
  eq(key, value) { filters.push(['eq', key, value]); return this },
  is(key, value) { filters.push(['is', key, value]); return this },
  async maybeSingle() { return { data: row, error: queryError } },
}
const authenticate = kind => async () => {
  authKind = kind
  return authFailure ?? { ok: true, ctx: { supabase: { from: table => {
    filters.push(['table', table]); return query
  } } } }
}
const mocks = {
  'server-only': {}, 'next/server': { NextResponse }, zod: { z },
  '@/lib/utils/apiAuth': { getAuthContext: authenticate('authenticated'), requireStaff: authenticate('staff') },
  '@/lib/supabase/admin': { createAdminClient: () => ({ storage: { from: bucket => ({
    async createSignedUrl(path, seconds) {
      storageCalls.push({ bucket, path, seconds })
      return { data: signFailure ? null : { signedUrl: 'https://storage.example/report.pdf?token=fixture' }, error: signFailure }
    },
  }) } }) },
}
const source = readFileSync(new URL('../lib/reports/download.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const exports = {}
vm.runInNewContext(compiled, { exports, require: name => {
  if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`)
  return mocks[name]
} })
function reset() {
  row = { student_id: student, pdf_storage_path: `${student}/${id}.pdf` }
  queryError = authFailure = signFailure = null
  storageCalls = []; filters = []; authKind = null
}
reset()
authFailure = { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
assert.equal((await exports.downloadReport(id, true)).status, 401)
assert.equal(storageCalls.length, 0)
reset()
assert.equal((await exports.downloadReport('not-a-uuid', true)).status, 404)
assert.equal(filters.length, 0)
reset()
row = null // RLS hides another family's, withdrawn, or removed-guardian report.
assert.equal((await exports.downloadReport(id, true)).status, 404)
assert.equal(storageCalls.length, 0)
assert.deepEqual(filters, [['table', 'published_reports'], ['eq', 'id', id], ['is', 'withdrawn_at', null]])
reset()
queryError = { message: 'database unavailable' }
assert.equal((await exports.downloadReport(id, true)).status, 500)
assert.equal(storageCalls.length, 0)
reset()
row.pdf_storage_path = 'another-child/private.pdf'
assert.equal((await exports.downloadReport(id, false)).status, 404)
assert.equal(authKind, 'staff')
assert.equal(storageCalls.length, 0)
reset()
row.pdf_storage_path = null
assert.equal((await exports.downloadReport(id, false)).status, 404)
assert.equal(storageCalls.length, 0)
reset()
signFailure = { message: 'object unavailable' }
assert.equal((await exports.downloadReport(id, true)).status, 500)
reset()
const response = await exports.downloadReport(id, true)
assert.equal(response.status, 303)
assert.equal(response.headers.get('cache-control'), 'private, no-store')
assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
assert.equal(authKind, 'authenticated')
assert.deepEqual(storageCalls, [{ bucket: 'reports', path: `${student}/${id}.pdf`, seconds: 60 }])
console.log('PASS: auth denial, invalid ID, RLS-hidden/withdrawn report, query failure, forged draft path, legacy URL exclusion, Storage failure, authorized short-lived redirect')
