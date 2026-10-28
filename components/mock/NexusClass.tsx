'use client'
import { DemoLink as Link } from './DemoLink'
import { useState } from 'react'
import { ClipboardList, Pencil, Plus, Video } from 'lucide-react'
import { toast } from 'sonner'
import { mockId, mockToday, type MockClass, type MockSession } from '@/lib/mock/data'
import { applyMockSession } from '@/lib/mock/session'
import type { AttendanceStatus } from '@/lib/attendance'
import { AttendanceOptions } from '@/components/session/AttendanceOptions'
import { weekdays } from '@/lib/mock/nexus'
import { dailyMockSessions } from './DailyAttendance'
import { useAcademyData, useMock } from './MockProvider'
import { Action, Back, Empty, Heading, inputStyle, LinkAction, Modal, Panel, Pill } from './MockUI'

function nextDate(day: number) {
  const date = new Date(`${mockToday()}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + (day - date.getUTCDay() + 7) % 7)
  return date.toISOString().slice(0,10)
}
export function NexusClass({ cls }: { cls: MockClass }) {
  const { data, update } = useMock()
  const academy = useAcademyData()
  const [date, setDate] = useState(nextDate(cls.weekday ?? 0))
  const [adding, setAdding] = useState(false)
  const [chosen, setChosen] = useState('')
  const students = data.students.filter(s => s.classIds.includes(cls.id))
  const existing = dailyMockSessions(data,date).find(s => s.classId === cls.id)
  function mark(studentId: string, status: AttendanceStatus) {
    if (update(current => {
      const saved = dailyMockSessions(current,date).find(s => s.classId === cls.id)
      const session: MockSession = saved ?? { id: mockId(), classId: cls.id, date, time: cls.startTime ?? '13:00', notes: '', completed: false, attendance: {}, roster: current.students.filter(s => s.classIds.includes(cls.id)).map(s => s.id) }
      return applyMockSession(current,{ ...session, completed: true, attendance: { ...session.attendance, [studentId]: status } })
    })) toast.success('Attendance and credits saved')
  }
  return <><Back href={`/staff/${cls.centerId}/schedule`} text={`${cls.centerId} timetable`} />
    <Heading eyebrow={`${cls.centerId} · ${weekdays[cls.weekday ?? 0]} ${cls.startTime}–${cls.endTime}`} title={cls.code ?? cls.name} description={`${cls.name} · ${cls.teacher} · ${cls.ageBracket}`}
      action={<div className="flex flex-wrap gap-2"><LinkAction secondary href={`/classes/${cls.id}/edit`}><Pencil className="size-4" />Edit class</LinkAction><Action onClick={() => setAdding(true)}><Plus className="size-4" />Enrol student</Action></div>} />
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><label className="grid gap-2 text-sm font-medium">Class session date<input type="date" value={date} required onChange={e => { if (e.target.value) setDate(e.target.value) }} className={inputStyle} /></label><Pill>{students.length} learners · Individual modules</Pill></div>
    <Panel title="Student roster" subtitle="Open a student row for their profile, or use Documentation to record the class.">
      <div className="divide-y">{students.map(student => {
        const plan = data.learnerModules?.find(p => p.studentId === student.id && p.classId === cls.id && p.status === 'active')
        return <article key={student.id} className="flex flex-wrap items-center gap-4 py-5"><Link href={`/students/${student.id}`} className="min-w-[160px] flex-1 rounded-xl py-2 focus-visible:outline-2 focus-visible:outline-primary"><h2 className="text-lg font-semibold text-primary">{student.name}</h2><p className="mt-1 text-sm">{plan?.title ?? 'No individual module assigned'}</p><p className="mt-1 text-xs text-muted-foreground">{plan?.lesson ?? 'Assign a module from the student profile'} · {student.credits} credits left</p></Link>
          <div className="flex flex-wrap items-center gap-3"><AttendanceOptions label={`Attendance for ${student.name}`} value={existing?.attendance[student.id] ?? 'unmarked'} onChange={status => mark(student.id,status)} /><LinkAction secondary href={`/students/${student.id}?tab=videos`}><Video className="size-4" />Documentation</LinkAction></div>
        </article>
      })}</div>
      {!students.length && <Empty title="Add your first learner" description="Enrol an existing student or create a new student record." />}
    </Panel>
    <div className="mt-5 flex flex-wrap gap-3"><LinkAction href={`/classes/${cls.id}/students/new`}>Create a new student</LinkAction><LinkAction secondary href={`/classes/${cls.id}/sessions/new`}><ClipboardList className="size-4" />Full session log</LinkAction></div>
    <Modal open={adding} close={() => setAdding(false)} title="Enrol a student" description="Choose an existing learner, or create a new student."><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Existing student<select className={inputStyle} value={chosen} onChange={e => setChosen(e.target.value)}><option value="">Choose a student</option>{academy.students.filter(s => !s.classIds.includes(cls.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><Action disabled={!chosen} onClick={() => {
      const date = mockToday()
      if (update(d => ({ ...d, students: d.students.map(s => s.id === chosen ? { ...s, classIds: [...new Set([...s.classIds,cls.id])], enrollmentHistory: [...(s.enrollmentHistory ?? []), { classId: cls.id, date, action: 'Enrolled' }] } : s),
        weeklySlots: d.weeklySlots?.map(slot => slot.classId === cls.id && !slot.end && !slot.members.some(m => m.studentId === chosen && !m.end) ? { ...slot, members: [...slot.members,{ studentId: chosen, start: date }] } : slot),
      }))) { toast.success('Student enrolled'); setAdding(false); setChosen('') }
    }}>Enrol in this class</Action><LinkAction secondary href={`/classes/${cls.id}/students/new`}>Create a new student instead</LinkAction></div></Modal>
  </>
}
