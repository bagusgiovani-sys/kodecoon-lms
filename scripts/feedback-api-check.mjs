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
const extra = { '@/lib/validators/feedback': load('../lib/validators/feedback.ts'), '@/lib/utils/feedbackErrors': load('../lib/utils/feedbackErrors.ts') }
const drafts=load('../app/api/students/[id]/feedback/route.ts',extra)
const edit=load('../app/api/feedback/[id]/route.ts',extra)
const publications=load('../app/api/feedback/[id]/publications/route.ts',extra)
const withdraw=load('../app/api/feedback-publications/[id]/withdraw/route.ts',extra)
const family=load('../app/api/student/[id]/feedback/route.ts',extra)
const context={params:Promise.resolve({id})}
const request=data=>new Request('https://kodehub.example/api/feedback',{method:'POST',body:JSON.stringify(data)})
const get=query=>new Request(`https://kodehub.example/api/feedback${query}`)
const content={title:'Motors',lessonId:null,strengths:'Built a rover',nextSteps:'Add sensors',rating:'Growing'}
const transition={requestId:lessonId,expectedRevision:1}
const mutations=[[drafts.POST,{...transition,id:lessonId,classId:id,expectedRevision:0,content},'create'],
  [edit.PATCH,{...transition,content},'edit'],[publications.POST,transition,'publish'],[withdraw.POST,transition,'withdraw']]
for (const status of [401,403]) {
  failure={ok:false,response:NextResponse.json({error:'Denied'},{status})}
  for (const [handler,body] of mutations) assert.equal((await handler(request(body),context)).status,status)
  for (const handler of [drafts.GET,publications.GET,family.GET]) assert.equal((await handler(get(''),context)).status,status)
}
assert.equal(calls.length,0);assert.equal(filters.length,0);failure=null
for (const [handler,body,action] of mutations) {
  for (const invalid of [{...body,expectedRevision:-1},{...body,requestId:'bad'},{...body,actorId:id}])
    assert.equal((await handler(request(invalid),context)).status,422)
  assert.equal((await handler(new Request('https://kodehub.example',{method:'POST',body:'{'}),context)).status,422)
  assert.equal((await handler(request(body),{params:Promise.resolve({id:'bad'})})).status,422)
  assert.equal((await handler(request(body),context)).status,200)
  const call=calls.at(-1)
  assert.equal(call.name,'manage_feedback');assert.equal(call.args.p_action,action)
  assert.equal(call.args.p_id,action==='create'?lessonId:id)
  assert.equal(call.args.p_student,action==='create'?id:null)
  assert.equal(call.args.p_class,action==='create'?id:null)
  assert.equal(call.args.p_request,lessonId)
  assert.equal(call.args.p_expected_revision,action==='create'?0:1)
  assert.deepEqual(JSON.parse(JSON.stringify(call.args.p_content)),['create','edit'].includes(action)?content:null)
  for (const [code,status] of [['42501',404],['P0002',409],['23505',409],['23514',422],['23503',422],['22023',422],['XX000',500]]) {
    rpcError={code,message:'secret details'}
    const response=await handler(request(body),context)
    assert.equal(response.status,status);assert.equal((await response.text()).includes('secret details'),false)
  }
  rpcError=null
}
for (const invalid of [{...content,strengths:'  '},{...content,lessonId:'bad'},{...content,rating:'Excellent'},
  {...content,nextSteps:'x'.repeat(10001)},{...content,title:''}])
  assert.equal((await edit.PATCH(request({...transition,content:invalid}),context)).status,422)
for (const [handler,table,column,key] of [[drafts.GET,'student_feedback','student_id','feedback'],
  [publications.GET,'published_feedback','feedback_id','publications'],[family.GET,'published_feedback','student_id','feedback']]) {
  for (const query of ['?limit=0','?limit=101','?after=bad','?unexpected=1']) assert.equal((await handler(get(query),context)).status,422)
  queryError={message:'secret details'}
  assert.equal((await handler(get(''),context)).status,500);queryError=null
  rows=[]; assert.deepEqual(await (await handler(get(''),context)).json(),{[key]:[],nextCursor:null})
  rows=[{id},{id:lessonId}];filters=[]
  const page=await (await handler(get(`?limit=1&after=${lessonId}`),context)).json()
  assert.equal(page[key].length,1);assert.equal(page.nextCursor,id)
  for (const expected of [['from',table],['eq',column,id],['gt','id',lessonId],['limit',2]])
    assert.ok(filters.some(f=>JSON.stringify(f)===JSON.stringify(expected)))
  if (handler===family.GET) {
    assert.ok(filters.some(f=>f[0]==='is'&&f[1]==='withdrawn_at'&&f[2]===null))
    assert.equal(filters.find(f=>f[0]==='select')[1],'id,class_id,draft_revision,title,strengths,next_steps,rating,published_at')
  }
}
console.log('Feedback API checks passed: auth, validation, scoped family reads, pagination, RPC mapping, safe errors.')
