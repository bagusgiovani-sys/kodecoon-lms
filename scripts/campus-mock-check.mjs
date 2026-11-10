import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const output = await mkdtemp(join(tmpdir(), 'kodehub-campus-check-'))
for (const name of ['data', 'nexus', 'campusSeed', 'center', 'session']) {
  const source = await readFile(new URL(`../lib/mock/${name}.ts`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  await writeFile(join(output, `${name}.cjs`), code.replace(/require\("\.\/(\w+)"\)/g, (_, dependency) => `require(${JSON.stringify(join(output, `${dependency}.cjs`))})`))
}
const require = createRequire(import.meta.url)
const { createMockData } = require(join(output, 'data.cjs'))
const { seedCampusData } = require(join(output, 'campusSeed.cjs'))
const { scopeCenterData } = require(join(output, 'center.cjs'))
const { applyMockSession } = require(join(output, 'session.cjs'))
const original = createMockData()
original.students[0].name = 'Existing local edit'
const snapshot = JSON.stringify(original)
const data = seedCampusData(original)
assert.equal(JSON.stringify(original), snapshot, 'migration must not mutate stored records')
assert.equal(data.students[0].name, 'Existing local edit')
assert.equal(data.students.length, 74)
for (const [center, count] of Object.entries({ STB: 30, PIK: 22, BSD: 22 })) {
  const scoped = scopeCenterData(data, center)
  assert.equal(scoped.students.length, count)
  assert.equal(scoped.classes.length, 3)
  for (const student of scoped.students) {
    assert(scoped.weeklySlots.some(slot => slot.members.some(member => member.studentId === student.id)))
    assert(scoped.learnerModules.some(module => module.studentId === student.id))
  }
}
assert.equal(new Set(data.students.map(student => student.id)).size, 74)
assert.deepEqual(seedCampusData(JSON.parse(JSON.stringify(data))), data, 'reload must not duplicate records')
const removed = { ...data, students: data.students.slice(1) }
assert.equal(seedCampusData(removed).students.length, 73, 'reload must preserve deletions')
const student = data.students.find(student => student.id.startsWith('sample-pik') && student.credits > 0)
const session = data.sessions.find(session => session.classId === student.classIds[0])
const saved = applyMockSession(data, { ...session, completed: true, attendance: { [student.id]: 'present' } })
assert.equal(saved.students.find(record => record.id === student.id).credits, student.credits - 1)
assert.equal(JSON.parse(JSON.stringify(saved)).students.find(record => record.id === student.id).credits, student.credits - 1)
console.log('PASS: 30 STB / 22 PIK / 22 BSD, schedules, individual progress, edit preservation, idempotent migration, deletion preservation, seeded attendance and credit deduction')
