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
      lt(...args) { filters.push(['lt', ...args]); return this }, order(...args) { filters.push(['order', ...args]); return this },
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
  const mocks = { 'next/server': { NextResponse }, zod: { z }, '@/lib/utils/apiAuth': { requireStaff: auth, requireParent: auth, requireRole: auth }, ...extra }
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { exports, URL, console, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`)
    return mocks[name]
  } })
  return exports
}
const validators = load('../lib/validators/submissions.ts')
const extra = { '@/lib/validators/submissions': validators, '@/lib/utils/submissionErrors': load('../lib/utils/submissionErrors.ts') }
const submissions = load('../app/api/assignments/[id]/students/[studentId]/submissions/route.ts',extra)
const reviews = load('../app/api/submissions/[id]/reviews/route.ts',extra)
const context = {params:Promise.resolve({id,studentId:lessonId})}
const request = data => new Request('https://kodehub.example/api/submissions',{method:'POST',body:JSON.stringify(data)})
const get = query => new Request(`https://kodehub.example/api/submissions${query}`)
const submission = {requestId:lessonId,projectUrl:'https://example.org/project',reflection:'I learned about motors'}
const review = {requestId:lessonId,expectedVersion:1,expectedReviewId:null,outcome:'approved',feedback:'Well done'}
for (const status of [401,403]) {
  failure = {ok:false,response:NextResponse.json({error:'Denied'},{status})}
  for (const [handler,body] of [[submissions.POST,submission],[reviews.POST,review]]) assert.equal((await handler(request(body),context)).status,status)
  for (const handler of [submissions.GET,reviews.GET]) assert.equal((await handler(get(''),context)).status,status)
}
assert.equal(calls.length,0);assert.equal(filters.length,0);failure=null
for (const url of ['https://example.org\n','http://example.org','https://user:password@example.org','https://example.org:65536','https://example.org:0','javascript:alert(1)','https://example.org/with space','https://example.org/\\bad','https://example.org\n.evil']) {
  assert.equal((await submissions.POST(request({...submission,projectUrl:url}),context)).status,422)
}
assert.equal(validators.createSubmission.safeParse({...submission,projectUrl:'https://example.org:443/path?q=1#part'}).success,true)
for (const [handler,body,rpc] of [[submissions.POST,submission,'submit_assignment'],[reviews.POST,review,'review_submission']]) {
  for (const invalid of [{...body,requestId:'bad'},{...body,submittedBy:id}]) assert.equal((await handler(request(invalid),context)).status,422)
  assert.equal((await handler(new Request('https://kodehub.example',{method:'POST',body:'{'}),context)).status,422)
  assert.equal((await handler(request(body),{params:Promise.resolve({id:'bad',studentId:lessonId})})).status,422)
  assert.equal((await handler(request(body),context)).status,200)
  assert.equal(calls.at(-1).name,rpc)
  assert.equal(calls.at(-1).args.p_request,lessonId)
  if (rpc==='submit_assignment') {
    assert.equal(calls.at(-1).args.p_assignment,id);assert.equal(calls.at(-1).args.p_student,lessonId)
  } else { assert.equal(calls.at(-1).args.p_expected_review,null);assert.equal(calls.at(-1).args.p_expected_version,1) }
  for (const [code,status] of [['42501',404],['P0002',409],['23505',409],['23514',422],['22023',422],['XX000',500]]) {
    rpcError={code,message:'secret details'}
    const response=await handler(request(body),context)
    assert.equal(response.status,status);assert.equal((await response.text()).includes('secret details'),false)
  }
  rpcError=null
}
assert.equal((await submissions.POST(request({...submission,reflection:'   '}),context)).status,422)
for (const invalid of [{...review,expectedVersion:0},{...review,expectedReviewId:undefined},{...review,outcome:'rejected'},{...review,feedback:''}]) assert.equal((await reviews.POST(request(invalid),context)).status,422)
for (const handler of [submissions.GET,reviews.GET]) {
  for (const query of ['?limit=0','?limit=101','?before=bad','?before=0','?unexpected=1']) assert.equal((await handler(get(query),context)).status,422)
  queryError={message:'secret details'}
  assert.equal((await handler(get(''),context)).status,500)
  queryError=null
}
single=null
assert.deepEqual(await (await submissions.GET(get(''),context)).json(),{submissions:[],latestVersion:null,nextCursor:null})
single={id,next_version:5};rows=[{id,version:4,sequence:4},{id:lessonId,version:3,sequence:3}];filters=[]
const page=await (await submissions.GET(get('?limit=1&before=5'),context)).json()
assert.equal(page.submissions.length,1);assert.equal(page.latestVersion,4);assert.equal(page.nextCursor,4)
for (const [column,value] of [['assignment_id',id],['student_id',lessonId],['thread_id',id]]) assert.ok(filters.some(f=>f[0]==='eq'&&f[1]===column&&f[2]===value))
assert.ok(filters.some(f=>f[0]==='lt'&&f[1]==='version'&&f[2]===5))
filters=[]
const history=await (await reviews.GET(get('?limit=1&before=5'),context)).json()
assert.equal(history.reviews.length,1);assert.equal(history.nextCursor,4)
assert.ok(filters.some(f=>f[0]==='eq'&&f[1]==='submission_id'&&f[2]===id))
assert.ok(filters.some(f=>f[0]==='lt'&&f[1]==='sequence'&&f[2]===5))
console.log('Submission API checks passed: authorization, validation, scoped pagination, RPC arguments, safe errors.')
