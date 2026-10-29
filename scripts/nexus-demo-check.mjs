import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

// Exercise the actual browser-demo ledger and legacy upgrade helpers in isolation.
const output = await mkdtemp(join(tmpdir(), 'kodenexus-demo-check-'))
const dataPath = join(output, 'data.cjs')
for (const name of ['data','nexus','center','learning','courseUsage','studentDocuments']) {
  const source = await readFile(new URL(`../lib/mock/${name}.ts`, import.meta.url),'utf8')
  const code = ts.transpileModule(source,{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText
  await writeFile(join(output,`${name}.cjs`),code.replace('require("./data")',`require(${JSON.stringify(dataPath)})`))
}
const require=createRequire(import.meta.url)
const { createMockData, mockToday }=require(dataPath)
const { upgradeNexusData, applyDemoPayment, visibleToGuardian }=require(join(output,'nexus.cjs'))
const legacy=createMockData(), original=JSON.stringify(legacy)
const data=upgradeNexusData(legacy)
const { feedbackAttendance }=require(join(output,'studentDocuments.cjs'))
const attendanceFixture={...data,sessions:Array.from({length:24},(_,i)=>({id:`attended-${i}`,date:'2026-10-01',time:'10:00',attendance:{'student-1':'present'}}))}
attendanceFixture.sessions.push({...attendanceFixture.sessions[0]})
attendanceFixture.sessions.push({id:'absent',date:'2026-10-01',time:'11:00',attendance:{'student-1':'absent'}})
assert.equal(feedbackAttendance(attendanceFixture,'student-1').length,24,'unique present classes only; no completed module requirement')
assert.equal(feedbackAttendance(attendanceFixture,'student-2').length,0,'individual attendance only')
for(const count of [0,11,12,23,24]) assert.equal(Math.floor(feedbackAttendance({...data,sessions:attendanceFixture.sessions.slice(0,count)},'student-1').length/12),Math.floor(count/12))
const { scopeCenterData }=require(join(output,'center.cjs'))
const { createLearningData }=require(join(output,'learning.cjs'))
const { courseUsage, courseSubject }=require(join(output,'courseUsage.cjs'))
assert.equal(createLearningData().courses.length,37,'load the complete Kodecoon module list')
assert.equal(createLearningData().courses.filter(course=>course.category==='Robotics').length,5)
assert.equal(createLearningData().courses.filter(course=>course.category==='Coding').length,20)
assert.equal(createLearningData().courses.filter(course=>course.category==='Holiday Camp').length,12)
const courseFixture={...data,learning:createLearningData(),learnerModules:[
  {id:'a',studentId:'student-1',classId:'robotics',courseId:'sc-101',status:'active'},
  {id:'b',studentId:'student-1',classId:'robotics',courseId:'sc-101',status:'active'},
  {id:'c',studentId:'student-2',classId:'robotics',courseId:'sc-101',status:'active'},
  {id:'d',studentId:'student-3',classId:'robotics',courseId:'rce',status:'completed'},
  {id:'e',studentId:'student-4',classId:'coding',courseId:'rce',status:'active'},
]}
courseFixture.learning.classCourses.robotics='rce'
const usage=courseUsage(scopeCenterData(courseFixture,'STB'),courseFixture.learning.courses)
assert.equal(usage.counts.get('sc-101'),2,'count unique learners, not module rows')
assert.equal(usage.counts.get('rce'),0,'exclude completed courses, other centers and overridden class defaults')
assert.equal(courseUsage(scopeCenterData(courseFixture,'PIK'),courseFixture.learning.courses).counts.get('rce'),1)
assert.equal(courseSubject('Engineering'),'Competition')
const snapshot=JSON.stringify(data)
const stb=scopeCenterData(data,'STB'), pik=scopeCenterData(data,'PIK')
assert.equal(stb.students.length,3)
assert.equal(pik.students.length,2)
assert(stb.classes.every(c=>c.centerId==='STB'))
assert(pik.weeklySlots.every(s=>pik.classes.some(c=>c.id===s.classId)))
assert(!pik.videos.some(v=>v.studentId==='student-1'))
assert.equal(JSON.stringify(data),snapshot,'center filtering mutated canonical records')
const paid={...data,payments:[{id:'scope-test',studentId:'student-1',amountIdr:1234}]}
assert.equal(scopeCenterData(paid,'STB').payments.length,1)
assert.equal(scopeCenterData(paid,'PIK').payments.length,0)
assert.equal(JSON.stringify(legacy),original,'upgrade mutated saved data')
assert.equal(data.students.length,legacy.students.length)
assert.equal(data.classes.length,legacy.classes.length)
assert.deepEqual(data.students.map(s=>s.credits),legacy.students.map(s=>s.credits))
assert.deepEqual(data.students.map(s=>s.completedModules),legacy.students.map(s=>s.completedModules))
assert.equal(data.centers.length,3)
assert.equal(data.weeklySlots.length,3)
assert(data.learnerModules.some(p=>p.status==='active'))
assert.deepEqual(upgradeNexusData(data),data,'upgrade must not duplicate modules or slots')
const student=data.students[0]
const payment={id:'operation-1',studentId:student.id,date:mockToday(),amountIdr:1200000,credits:8,method:'Bank transfer',reference:'Demo package'}
const saved=applyDemoPayment(data,payment)
assert.equal(saved.students[0].credits,student.credits+8)
assert.equal(saved.payments.length,1)
assert.equal(saved.students[0].creditHistory.at(-1).reason,'Session package credits')
assert(!JSON.stringify(saved.students[0].creditHistory).includes('1200000'),'parent ledger exposes money')
assert.equal(applyDemoPayment(saved,payment),saved,'exact retry duplicated the grant')
assert.throws(()=>applyDemoPayment(saved,{...payment,credits:9}),/different details/)
for(const change of [{amountIdr:-1},{amountIdr:1.5},{credits:-1},{credits:1.5},{credits:501},{studentId:'missing'},{reference:' '},{method:'unsupported'},{date:'not-a-date'}]){
  const before=JSON.stringify(data)
  assert.throws(()=>applyDemoPayment(data,{...payment,...change}))
  assert.equal(JSON.stringify(data),before,'invalid payment changed records')
}
const noUnits=applyDemoPayment(data,{...payment,id:'payment-only',credits:0})
assert.equal(noUnits.students[0].credits,student.credits)
assert.equal(noUnits.students[0].creditHistory.length,student.creditHistory.length)
assert(visibleToGuardian(student,{role:'parent',email:student.parentEmail.toUpperCase(),name:'Guardian'}))
assert(!visibleToGuardian(student,{role:'parent',email:'another@example.com',name:'Other'}))
assert(!visibleToGuardian(student,{role:'teacher',email:student.parentEmail,name:'Staff'}))
assert(!visibleToGuardian(student,null))
console.log('PASS: center isolation/non-mutation, legacy preservation, repeat-safe upgrade, payment/grant atomicity, retries/conflicts, validation rollback and guardian scope')
