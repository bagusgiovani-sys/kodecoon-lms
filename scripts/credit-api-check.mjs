// Actual Route Handlers, isolated Auth/database adapters; SQL tests cover RLS.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
const requireModule = createRequire(import.meta.url)
const { NextResponse } = requireModule('next/server')
const { z } = requireModule('zod')
const student = '00000000-0000-4000-8000-000000000501'
const session = '00000000-0000-4000-8000-000000000201'
const teacher = '00000000-0000-4000-8000-000000000a02'
const classId = '00000000-0000-4000-8000-000000000c11'
const requestId = '00000000-0000-4000-8000-000000000901'
let failure = null, rpcError = null, calls = []
const db = {
  from(table) {
    const data = table === 'sessions' ? { id: session, teacher_id: teacher, class_id: classId }
      : table === 'enrollments' ? [{ student_id: student }] : []
    return { select() { return this }, eq() { return this },
      async maybeSingle() { return { data } },
      then(resolve, reject) { return Promise.resolve({ data, error: null }).then(resolve, reject) },
    }
  },
  async rpc(name, args) { calls.push({ name, args }); return { data: { revision: 1, balance: 3 }, error: rpcError } },
}
const auth = async () => failure ?? { ok: true, ctx: { supabase: db, userId: teacher, role: 'teacher' } }
function load(path, extra = {}) {
  const exports = {}
  const mocks = { 'next/server': { NextResponse }, zod: { z }, '@/lib/utils/apiAuth': { requireAdmin: auth, requireStaff: auth }, ...extra }
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { exports, console, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`)
    return mocks[name]
  } })
  return exports
}
const adjustment = load('../app/api/students/[id]/credit-adjustments/route.ts')
const validators = load('../lib/validators/sessions.ts')
const logger = load('../app/api/sessions/[id]/log/route.ts', {
  '@/lib/validators/sessions': validators, '@/lib/drive/driveClient': { validateDriveFile: async () => ({ ok: true }) },
})
const body = { requestId, amount: 3, kind: 'top_up', reason: 'Verified receipt' }
const request = data => new Request('https://kodehub.example/api/test', { method: 'POST', body: JSON.stringify(data) })
const context = id => ({ params: Promise.resolve({ id }) })
failure = { ok: false, response: NextResponse.json({ error: 'Not authorized' }, { status: 403 }) }
assert.equal((await adjustment.POST(request(body), context(student))).status, 403)
assert.equal(calls.length, 0)
failure = null
for (const invalid of [{ ...body, amount: -1 }, { ...body, amount: 0 }, { ...body, amount: 1.5 }, { ...body, reason: '' }, { ...body, requestId: 'invalid' }]) {
  assert.equal((await adjustment.POST(request(invalid), context(student))).status, 422)
}
assert.equal(calls.length, 0)
assert.equal((await adjustment.POST(request(body), context(student))).status, 200)
assert.equal(calls[0].name, 'adjust_credits')
assert.equal(calls[0].args.p_request, requestId)
for (const [code, status] of [['42501',404],['P0001',422],['P0002',409]]) {
  rpcError = { code }
  assert.equal((await adjustment.POST(request(body), context(student))).status, status)
}
rpcError = null; calls = []
const log = { requestId, expectedRevision: 0, notes: 'Checked', attendance: [{ studentId: student, status: 'present' }], lessonCompletions: [] }
assert.equal((await logger.PATCH(request({ ...log, requestId: undefined }), context(session))).status, 400)
assert.equal(calls.length, 0)
assert.equal((await logger.PATCH(request(log), context(session))).status, 200)
assert.equal(calls[0].name, 'log_session_credits')
assert.equal(calls[0].args.p_expected_revision, 0)
assert.equal(calls[0].args.p_request, requestId)
for (const [code, status] of [['42501',403],['P0001',422],['P0002',409]]) {
  rpcError = { code }
  assert.equal((await logger.PATCH(request(log), context(session))).status, status)
}
console.log('PASS: credit input bounds, auth denial, request/revision forwarding, authorized database RPC selection, permission/conflict/insufficient-credit HTTP responses')
