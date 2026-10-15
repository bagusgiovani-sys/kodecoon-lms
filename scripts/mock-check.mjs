import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const output = await mkdtemp(join(tmpdir(), 'kodehub-mock-check-'))
const dataPath = join(output, 'data.cjs')
for (const name of ['data', 'session']) {
  const source = await readFile(new URL(`../lib/mock/${name}.ts`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  await writeFile(join(output, `${name}.cjs`), compiled.replace('require("./data")', `require(${JSON.stringify(dataPath)})`))
}
const require = createRequire(import.meta.url)
const { createMockData } = require(dataPath)
const { applyMockSession } = require(join(output, 'session.cjs'))
const starting = createMockData()
const session = {
  ...starting.sessions[0], completed: true,
  attendance: { 'student-1': 'present', 'student-2': 'absent', 'student-3': 'present' },
  module: 'Sensors & signals', videoUrl: 'https://example.com/video.mp4',
}
const saved = applyMockSession(starting, session)
assert.equal(saved.students[0].credits, 7)
assert.equal(saved.students[1].credits, 5)
assert.ok(saved.students[0].completedModules.includes('robotics:Sensors & signals'))
assert.equal(saved.videos.filter(v => v.id.startsWith('session-video-')).length, 2)
const retried = applyMockSession(saved, session)
assert.equal(retried.students[0].credits, 7)
assert.equal(retried.students[0].creditHistory.length, saved.students[0].creditHistory.length)
assert.equal(retried.videos.length, saved.videos.length)
const rescheduled = applyMockSession(retried, { ...session, date: '2026-10-20' })
assert.equal(rescheduled.students[0].credits, 7)
assert.equal(rescheduled.students[0].creditHistory.find(entry => entry.id.startsWith(`session-${session.id}-`)).date, '2026-10-20')
const corrected = applyMockSession(retried, { ...session, attendance: { ...session.attendance, 'student-1': 'absent' } })
assert.equal(corrected.students[0].credits, 8)
assert.equal(corrected.videos.filter(v => v.id.startsWith('session-video-')).length, 1)
const cleared = applyMockSession(saved, { ...session, videoUrl: '' })
assert.equal(cleared.videos.filter(v => v.id.startsWith('session-video-')).length, 0)
const lowBalance = createMockData()
lowBalance.students[0].credits = 0
assert.throws(() => applyMockSession(lowBalance, session), /top-up/)
assert.equal(lowBalance.sessions[0].completed, false)
assert.equal(lowBalance.students[2].credits, 2)
assert.equal(starting.students[0].credits, 8)
console.log('PASS: deduction, absence, module completion, retry without double charge, video deduplication, rescheduling dates, correction refund, video removal, insufficient-credit atomicity')
