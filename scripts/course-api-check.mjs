// Actual handlers with isolated Auth/PostgREST adapters. SQL tests prove RLS.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
const requireModule = createRequire(import.meta.url)
const { NextResponse } = requireModule('next/server')
const { z } = requireModule('zod')
const id = '10000000-0000-4000-8000-000000000100'
const lessonId = '10000000-0000-4000-8000-000000000101'
let failure = null, rpcError = null, queryError = null, rows = [], single = { id }, calls = [], filters = []
const db = {
  from(table) {
    filters.push(['from', table])
    return { select() { return this }, eq(...args) { filters.push(['eq', ...args]); return this },
      gt(...args) { filters.push(['gt', ...args]); return this }, order(...args) { filters.push(['order', ...args]); return this },
      limit(...args) { filters.push(['limit', ...args]); return this }, is(...args) { filters.push(['is', ...args]); return this },
      not(...args) { filters.push(['not', ...args]); return this },
      async maybeSingle() { return { data: single, error: queryError } },
      then(resolve, reject) { return Promise.resolve({ data: rows, error: queryError }).then(resolve, reject) },
    }
  },
  async rpc(name, args) { calls.push({ name, args }); return { data: { id, revision: 1 }, error: rpcError } },
}
const auth = async () => failure ?? { ok: true, ctx: { supabase: db } }
function load(path, extra = {}) {
  const exports = {}
  const mocks = { 'next/server': { NextResponse }, zod: { z }, '@/lib/utils/apiAuth': { requireStaff: auth }, ...extra }
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { exports, URL, console, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`)
    return mocks[name]
  } })
  return exports
}
const extra = { '@/lib/validators/courses': load('../lib/validators/courses.ts'), '@/lib/utils/courseErrors': load('../lib/utils/courseErrors.ts') }
const library = load('../app/api/courses/route.ts', extra)
const detail = load('../app/api/courses/[id]/route.ts', extra)
const lessons = load('../app/api/courses/[id]/lessons/route.ts', extra)
const lesson = load('../app/api/courses/[id]/lessons/[lessonId]/route.ts', extra)
const content = { title: 'Robotics', category: '', age_range: '', level: '', description: '', prerequisites: '', archived: false }
const body = { id, expectedRevision: 0, requestId: lessonId, content }
const edit = { expectedRevision: 1, requestId: lessonId, content }
const lessonBody = { ...edit, content: { title: 'Motors', sequence: 1, minutes: 60, objective: '', materials: '', steps: '', evidence: '', archived: false } }
const request = data => new Request('https://kodehub.example/api/courses', { method: 'POST', body: JSON.stringify(data) })
const get = query => new Request(`https://kodehub.example/api/courses${query}`)
const context = { params: Promise.resolve({ id, lessonId }) }
for (const status of [401,403]) {
  failure = { ok: false, response: NextResponse.json({ error: 'Denied' }, { status }) }
  for (const [handler, payload] of [[library.POST,body],[detail.PATCH,edit],[lesson.PATCH,lessonBody]]) assert.equal((await handler(request(payload),context)).status,status)
  for (const handler of [library.GET,detail.GET,lessons.GET]) assert.equal((await handler(get(''),context)).status,status)
}
assert.equal(calls.length,0)
assert.equal(filters.length,0)
failure = null
for (const invalid of [{ ...body, content: { ...content, owner_id: id } }, { ...body, expectedRevision: 1 }, { ...body, requestId: 'bad' }, { ...body, content: { ...content, title: '' } }]) assert.equal((await library.POST(request(invalid))).status,422)
assert.equal((await library.POST(new Request('https://kodehub.example', { method: 'POST', body: '{' }))).status,422)
assert.equal((await detail.PATCH(request({ ...edit, expectedRevision: 0 }),context)).status,422)
assert.equal((await lesson.PATCH(request({ ...lessonBody, content: { ...lessonBody.content, minutes: 0 } }),context)).status,422)
assert.equal(calls.length,0)
assert.equal((await library.POST(request(body))).status,200)
assert.equal((await detail.PATCH(request(edit),context)).status,200)
assert.equal((await lesson.PATCH(request(lessonBody),context)).status,200)
assert.equal(calls[0].name,'save_course_content')
assert.equal(calls[0].args.p_lesson,null)
assert.equal(calls[2].args.p_lesson,lessonId)
assert.equal(calls[2].args.p_expected_revision,1)
assert.equal(calls[2].args.p_request,lessonId)
for (const [code,status] of [['42501',404],['P0002',409],['23505',409],['23514',422],['XX000',500]]) {
  rpcError = { code, message: 'private database details' }
  const response = await library.POST(request(body))
  assert.equal(response.status,status)
  assert.equal((await response.text()).includes('private database details'),false)
}
rpcError = null
for (const query of ['?limit=0','?limit=101','?after=bad','?archived=yes','?centerId=forged']) assert.equal((await library.GET(get(query))).status,422)
rows = [{ id }, { id: lessonId }]
filters = []
assert.deepEqual(await (await library.GET(get(`?limit=1&after=${id}&archived=true`))).json(), { courses: [{ id }], nextCursor: id })
assert.ok(filters.some(f => JSON.stringify(f) === JSON.stringify(['gt','id',id])))
assert.ok(filters.some(f => JSON.stringify(f) === JSON.stringify(['not','archived_at','is',null])))
single = null
assert.equal((await detail.GET(get(''),context)).status,404)
assert.equal((await lessons.GET(get(''),context)).status,404)
single = { id }; rows = [{ id: lessonId, sequence: 2 }, { id, sequence: 3 }]; filters = []
assert.deepEqual(await (await lessons.GET(get(`?limit=1&after=${id}`),context)).json(), { lessons: [rows[0]], nextCursor: lessonId })
assert.ok(filters.some(f => JSON.stringify(f) === JSON.stringify(['eq','course_id',id])))
queryError = { code: 'XX000' }
assert.equal((await library.GET(get(''))).status,500)
assert.equal((await detail.GET(get(''),context)).status,500)
assert.equal((await lessons.GET(get(''),context)).status,500)
console.log('PASS: course handlers enforce auth, bounded inputs, revisions/IDs, sanitized failures, hidden resources, and scoped pagination')
