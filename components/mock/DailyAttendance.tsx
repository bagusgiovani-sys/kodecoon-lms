'use client'
import { DemoLink as Link } from './DemoLink'
import { useContext, useState } from 'react'
import { toast } from 'sonner'
import { mockId, mockToday, type MockData, type MockSession } from '@/lib/mock/data'
import { applyMockSession } from '@/lib/mock/session'
import { attendanceLabel, type AttendanceStatus } from '@/lib/attendance'
import { AttendanceOptions } from '@/components/session/AttendanceOptions'
import { CenterScope, useMock } from './MockProvider'
import { Action, Empty, Field, Heading, inputStyle, Panel } from './MockUI'

export function dailyMockSessions(data: MockData, date: string): MockSession[] {
  const sessions = data.sessions.filter(s => s.date === date)
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  for (const slot of data.weeklySlots ?? []) {
    if (slot.weekday !== weekday || slot.start > date || (slot.end && slot.end <= date)) continue
    const id = sessions.find(s => s.classId === slot.classId && s.time.slice(0,5) === slot.time.slice(0,5))?.id ?? `weekly-${slot.id}-${date}`
    if (!sessions.some(s => s.id === id)) sessions.push({ id, classId: slot.classId, date, time: slot.time,
      notes: '', completed: false, attendance: {}, roster: slot.members.filter(m => m.start <= date && (!m.end || m.end > date)).map(m => m.studentId) })
    else {
      const i = sessions.findIndex(s => s.id === id)
      sessions[i] = { ...sessions[i], roster: [...new Set([...slot.members.filter(m => m.start <= date && (!m.end || m.end > date)).map(m => m.studentId), ...Object.keys(sessions[i].attendance)])] }
    }
  }
  return sessions.sort((a, b) => a.time.localeCompare(b.time))
}

export function DailyAttendance({ studentId }: { studentId?: string }) {
  const { data, update } = useMock()
  const activeCenter = useContext(CenterScope)
  const [date, setDate] = useState(mockToday())
  const centers = data.centers ?? [{ id: 'default', name: 'Indonesia Academy' }]
  const [selectedCenter, setCenter] = useState(centers[0].id)
  const center = activeCenter ?? selectedCenter
  const [manage, setManage] = useState(false)
  const [error, setError] = useState('')
  const classes = data.classes.filter(c => (c.centerId ?? centers[0].id) === center)
  const sessions = dailyMockSessions(data, date).filter(s => classes.some(c => c.id === s.classId))
  function save(session: MockSession, id: string, status: AttendanceStatus) {
    setError('')
    try {
      if (update(current => applyMockSession(current, { ...session, attendance: { ...session.attendance, [id]: status } }))) toast.success('Attendance saved')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save attendance') }
  }
  return <section className="my-6 space-y-5">
    {!studentId && <Heading title="Daily Attendance" description="Your scheduled learners, organized by date, center, and class time." />}
    <div className="flex flex-wrap items-end gap-4"><Field title="Attendance date"><input type="date" required value={date} className={inputStyle} onChange={e => { if (e.target.value) { setDate(e.target.value); setError('') } }} /></Field>
      {!studentId && <Action secondary onClick={() => setManage(!manage)}>{manage ? 'Close schedule editor' : 'Manage weekly schedule'}</Action>}</div>
    {!activeCenter && <div role="group" aria-label="Centers" className="flex flex-wrap gap-2">{centers.map(c => <Action key={c.id} secondary={center !== c.id} aria-pressed={center === c.id} onClick={() => { setCenter(c.id); setError('') }}>{c.name}</Action>)}</div>}
    <p className="text-sm text-muted-foreground">Present and Absent use 1 credit. Leave and unmarked use none. Changes here and on the student profile share one record.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {manage && <Panel title="Weekly class slots" subtitle="Roster changes start on the selected date; previous records are retained.">
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={e => {
        e.preventDefault(); const f = new FormData(e.currentTarget)
        const classId = String(f.get('classId'))
        if (!classId) return
        update(current => ({ ...current, weeklySlots: [...(current.weeklySlots ?? []), { id: mockId(), classId, weekday: new Date(`${date}T12:00:00Z`).getUTCDay(), time: String(f.get('time')), start: date, members: current.students.filter(s => s.classIds.includes(classId)).map(s => ({ studentId: s.id, start: date })) }] }))
      }}><Field title="Class"><select name="classId" className={inputStyle} required>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field title="Weekly start time"><input required type="time" name="time" className={inputStyle} defaultValue="15:00" /></Field><Action type="submit">Add weekly slot for this weekday</Action></form>
      {(data.weeklySlots ?? []).filter(slot => classes.some(c => c.id === slot.classId)).map(slot => <div key={slot.id} className="mt-5 rounded-xl border p-4">
        <h3 className="font-semibold">{classes.find(c => c.id === slot.classId)?.name} · {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.weekday]} {slot.time}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{data.students.map(student => {
          const active = slot.members.some(m => m.studentId === student.id && m.start <= date && (!m.end || m.end > date))
          return <label key={student.id} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={active} onChange={() => {
            update(current => ({ ...current, students: current.students.map(s => s.id === student.id && !s.classIds.includes(slot.classId) ? { ...s, classIds: [...s.classIds, slot.classId] } : s), weeklySlots: (current.weeklySlots ?? []).map(item => item.id !== slot.id ? item : { ...item, members: active ? item.members.flatMap(m => m.studentId === student.id && m.start <= date && (!m.end || m.end > date) ? m.start === date ? [] : [{ ...m, end: date }] : [m]) : [...item.members, { studentId: student.id, start: date }] }) }))
          }} />{student.name}</label>
        })}</div>
      </div>)}
    </Panel>}
    {sessions.map(session => {
      const roster = data.students.filter(s => (session.roster ? session.roster.includes(s.id) : s.classIds.includes(session.classId) || !!session.attendance[s.id]) && (!studentId || s.id === studentId))
      if (studentId && !roster.length) return null
      return <Panel key={session.id} title={`${session.time || 'Time not set'} · ${data.classes.find(c => c.id === session.classId)?.name}`}>
        {!roster.length && <p className="text-sm text-muted-foreground">No students scheduled. Add learners in Manage weekly schedule.</p>}
        <div className="divide-y">{roster.map(student => <div key={student.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="min-w-0"><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={`/students/${student.id}`}>{student.name}</Link><p className="mt-1 text-sm text-muted-foreground">{data.classes.find(c => c.id === session.classId)?.name} · {student.credits} credits</p><p className="text-xs text-muted-foreground">{attendanceLabel(session.attendance[student.id] ?? 'unmarked')}</p></div>
          <AttendanceOptions label={`Attendance for ${student.name}`} value={session.attendance[student.id] ?? 'unmarked'} onChange={status => save(session, student.id, status)} />
        </div>)}</div>
      </Panel>
    })}
    {!sessions.some(s => !studentId || (s.roster ?? data.students.filter(x => x.classIds.includes(s.classId)).map(x => x.id)).includes(studentId)) && <Empty title="No sessions on this date" description="Choose another date or add a weekly class slot." />}
  </section>
}
