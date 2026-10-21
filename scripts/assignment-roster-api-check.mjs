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
    return { select(...args) { filters.push(['select', ...args]); return this }, in(...args) { filters.push(['in',...args]); return this }, eq(...args) { filters.push(['eq', ...args]); return this },
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
  const mocks = { 'next/server': { NextResponse }, zod: { z }, '@/lib/utils/apiAuth': { requireStaff: auth, requireParent: auth }, ...extra }
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { exports, URL, console, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`)
    return mocks[name]
  } })
  return exports
}
const extra = { '@/lib/validators/assignments': load('../lib/validators/assignments.ts'), '@/lib/utils/assignmentErrors': load('../lib/utils/assignmentErrors.ts') }
const list = load('../app/api/assignments/[id]/learners/route.ts',extra)
const change = load('../app/api/assignments/[id]/learners/[studentId]/route.ts',extra)
const context = {params:Promise.resolve({id,studentId:lessonId})}
const request = data => new Request('https://kodehub.example/api/assignments',{method:'PUT',body:JSON.stringify(data)})
const get = query => new Request(`https://kodehub.example/api/assignments${query}`)
const body = {requestId:lessonId,expectedRevision:0,submissionOpen:true}
for (const status of [401,403]) {
  failure={ok:false,response:NextResponse.json({error:'Denied'},{status})}
  assert.equal((await change.PUT(request(body),context)).status,status)
  assert.equal((await list.GET(get(''),context)).status,status)
}
assert.equal(calls.length,0);assert.equal(filters.length,0);failure=null
for (const invalid of [{...body,expectedRevision:-1},{...body,expectedRevision:2147483648},{...body,expectedRevision:1.5},
  {...body,submissionOpen:'true'},{...body,submissionOpen:null},{...body,requestId:'bad'},{...body,actorId:id}])
  assert.equal((await change.PUT(request(invalid),context)).status,422)
for (const params of [{id:'bad',studentId:lessonId},{id,studentId:'bad'}])
  assert.equal((await change.PUT(request(body),{params:Promise.resolve(params)})).status,422)
assert.equal((await change.PUT(new Request('https://kodehub.example',{method:'PUT',body:'{'}),context)).status,422)
assert.equal(calls.length,0)
assert.equal((await change.PUT(request(body),context)).status,200)
assert.equal(calls[0].name,'set_assignment_learner')
assert.deepEqual(JSON.parse(JSON.stringify(calls[0].args)),{p_assignment:id,p_student:lessonId,p_open:true,p_expected_revision:0,p_request:lessonId})
assert.equal((await change.PUT(request({...body,expectedRevision:2,submissionOpen:false}),context)).status,200)
assert.equal(calls.at(-1).args.p_open,false)
for (const [code,status] of [['42501',404],['P0002',409],['23505',409],['22023',422],['XX000',500]]) {
  rpcError={code,message:'secret details'}
  const response=await change.PUT(request(body),context)
  assert.equal(response.status,status);assert.equal((await response.text()).includes('secret details'),false)
}
rpcError=null
for (const query of ['?limit=0','?limit=101','?after=bad','?unexpected=1']) assert.equal((await list.GET(get(query),context)).status,422)
assert.equal((await list.GET(get(''),{params:Promise.resolve({id:'bad'})})).status,422)
queryError={message:'secret details'}
assert.equal((await list.GET(get(''),context)).status,500);queryError=null
assert.deepEqual(await (await list.GET(get(''),context)).json(),{learners:[],nextCursor:null})
rows=[{student_id:id,revision:1},{student_id:lessonId,revision:2}];filters=[]
const page=await (await list.GET(get(`?limit=1&after=${lessonId}`),context)).json()
assert.equal(page.learners.length,1);assert.equal(page.nextCursor,id)
for (const expected of [['from','assignment_learners'],['eq','assignment_id',id],['gt','student_id',lessonId],['order','student_id'],['limit',2]])
  assert.ok(filters.some(f=>JSON.stringify(f)===JSON.stringify(expected)))
console.log('Assignment roster API checks passed: auth, validation, scoped pagination, RPC arguments, safe errors.')
