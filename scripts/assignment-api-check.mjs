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
const list = load('../app/api/classes/[id]/assignments/route.ts',extra)
const edit = load('../app/api/assignments/[id]/route.ts',extra)
const publish = load('../app/api/assignments/[id]/publish/route.ts',extra)
const archive = load('../app/api/assignments/[id]/archive/route.ts',extra)
const family = load('../app/api/student/[id]/assignments/route.ts',extra)
const context = {params:Promise.resolve({id,studentId:lessonId})}
const request = data => new Request('https://kodehub.example/api/assignments',{method:'POST',body:JSON.stringify(data)})
const get = query => new Request(`https://kodehub.example/api/assignments${query}`)
const content = {title:'Assignment',brief:'Instructions',dueAt:null,courseLessonId:null}
const createBody = {id,expectedRevision:0,requestId:lessonId,content}
const editBody = {expectedRevision:1,requestId:lessonId,content}
const transition = {expectedRevision:1,requestId:lessonId}
const writes = [[list.POST,createBody,'create'],[edit.PATCH,editBody,'edit'],[publish.POST,transition,'publish'],[archive.POST,transition,'archive']]
for (const status of [401,403]) {
  failure = {ok:false,response:NextResponse.json({error:'Denied'},{status})}
  for (const [handler,body] of writes) assert.equal((await handler(request(body),context)).status,status)
  for (const handler of [list.GET,family.GET]) assert.equal((await handler(get(''),context)).status,status)
}
assert.equal(calls.length,0);assert.equal(filters.length,0);failure=null
for (const [handler,body,action] of writes) {
  assert.equal((await handler(request({...body,requestId:'bad'}),context)).status,422)
  assert.equal((await handler(request({...body,actorId:id}),context)).status,422)
  assert.equal((await handler(new Request('https://kodehub.example',{method:'POST',body:'{'}),context)).status,422)
  assert.equal((await handler(request(body),{params:Promise.resolve({id:'bad'})})).status,422)
  assert.equal((await handler(request(body),context)).status,200)
  assert.equal(calls.at(-1).name,'manage_assignment')
  assert.equal(calls.at(-1).args.p_action,action)
  assert.equal(calls.at(-1).args.p_class,action==='create'?id:null)
  for (const [code,status] of [['42501',404],['P0002',409],['23505',409],['23503',422],['22007',422],['XX000',500]]) {
    rpcError={code,message:'secret details'}
    const response=await handler(request(body),context)
    assert.equal(response.status,status);assert.equal((await response.text()).includes('secret details'),false)
  }
  rpcError=null
}
for (const handler of [list.GET,family.GET]) {
  for (const query of ['?limit=0','?limit=101','?after=bad','?unexpected=1']) assert.equal((await handler(get(query),context)).status,422)
  queryError={message:'secret details'}
  assert.equal((await handler(get(''),context)).status,500)
  queryError=null
}
rows=[{id,assignment_id:id},{id:lessonId,assignment_id:lessonId}];filters=[]
const page=await (await list.GET(get('?limit=1'),context)).json()
assert.equal(page.assignments.length,1);assert.equal(page.nextCursor,id)
assert.ok(filters.some(f=>f[0]==='eq'&&f[1]==='class_id'&&f[2]===id))
filters=[]
await family.GET(get('?limit=1'),context)
assert.ok(filters.some(f=>f[0]==='eq'&&f[1]==='student_id'&&f[2]===id))
assert.ok(filters.some(f=>f[0]==='in'&&f[1]==='id'&&f[2].length===1&&f[2][0]===id))
assert.ok(filters.some(f=>f[0]==='select'&&f[1].includes('lesson_title_snapshot')&&!f[1].includes('created_by')))
rows=[]
assert.deepEqual(await (await family.GET(get(''),context)).json(),{assignments:[],nextCursor:null})
console.log('Assignment API adapter checks passed (auth, validation, RPC mapping, safe errors, pagination, child filters).')
