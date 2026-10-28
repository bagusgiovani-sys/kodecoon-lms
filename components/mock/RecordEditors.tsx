'use client'
import { useContext, useState } from 'react'
import { toast } from 'sonner'
import { mockId, mockToday, type MockClass, type MockStudent } from '@/lib/mock/data'
import { weekdays } from '@/lib/mock/nexus'
import { CenterScope, useAcademyData, useMock } from './MockProvider'
import { Action, Back, Field, Heading, inputStyle, Panel } from './MockUI'

export function ClassEditor({ existing, centerId }: { existing?: MockClass; centerId?: string }) {
  const { data, update } = useMock()
  const academy = useAcademyData()
  const [error, setError] = useState('')
  return <><Back href={existing ? `/classes/${existing.id}` : '/staff'} text={existing ? 'Class details' : 'Centers'} />
    <Heading title={existing ? 'Edit class details' : 'Create a class'} description="Give this time slot a class code. Each learner can follow their own module." />
    <Panel className="max-w-2xl"><form className="grid gap-5" onSubmit={event => {
      event.preventDefault(); setError('')
      const f = new FormData(event.currentTarget)
      const code = String(f.get('code')).trim().toUpperCase(), selectedCenter = String(f.get('centerId'))
      const startTime = String(f.get('startTime')), endTime = String(f.get('endTime'))
      if (endTime <= startTime) { setError('End time must be after start time.'); return }
      if (academy.classes.some(c => c.id !== existing?.id && c.centerId === selectedCenter && c.code?.toUpperCase() === code)) { setError('This class code is already used in the selected center.'); return }
      const cls: MockClass = { ...existing, id: existing?.id ?? mockId(), name: String(f.get('name')).trim(), code,
        centerId: selectedCenter, ageBracket: String(f.get('ageBracket')).trim(), teacher: String(f.get('teacher')),
        weekday: Number(f.get('weekday')), startTime, endTime, modules: existing?.modules ?? ['First module'] }
      const today = mockToday()
      const changed = !existing || cls.weekday !== existing.weekday || cls.startTime !== existing.startTime
      if (update(current => ({ ...current, classes: [...current.classes.filter(c => c.id !== cls.id), cls],
        weeklySlots: !changed ? current.weeklySlots : [
          ...(current.weeklySlots ?? []).map(slot => slot.classId === cls.id && !slot.end ? { ...slot, end: today } : slot),
          { id: mockId(), classId: cls.id, weekday: cls.weekday!, time: cls.startTime!, start: today,
            members: current.students.filter(s => s.classIds.includes(cls.id)).map(s => ({ studentId: s.id, start: today })) },
        ],
      }))) { toast.success(existing ? 'Class updated' : 'Class created'); window.location.assign(`/classes/${cls.id}`) }
    }}>
      <div className="grid gap-4 sm:grid-cols-2"><Field title="Center"><select name="centerId" defaultValue={existing?.centerId ?? centerId} required className={inputStyle}>{data.centers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field title="Class code"><input name="code" required maxLength={40} defaultValue={existing?.code} placeholder="RCJ-SUN-1300" className={inputStyle} /></Field></div>
      <Field title="Class name"><input name="name" required maxLength={100} defaultValue={existing?.name} placeholder="Sunday robotics group" className={inputStyle} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field title="Age group"><input name="ageBracket" required maxLength={50} defaultValue={existing?.ageBracket} placeholder="8–12 years" className={inputStyle} /></Field>
        <Field title="Teacher"><select name="teacher" defaultValue={existing?.teacher} className={inputStyle}>{academy.teachers.map(t => <option key={t.id}>{t.name}</option>)}</select></Field></div>
      <div className="grid gap-4 sm:grid-cols-3"><Field title="Day"><select name="weekday" defaultValue={existing?.weekday ?? 0} className={inputStyle}>{weekdays.map((day, i) => <option key={day} value={i}>{day}</option>)}</select></Field>
        <Field title="Start time"><input name="startTime" type="time" required defaultValue={existing?.startTime ?? '13:00'} className={inputStyle} /></Field>
        <Field title="End time"><input name="endTime" type="time" required defaultValue={existing?.endTime ?? '15:00'} className={inputStyle} /></Field></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Action type="submit">{existing ? 'Save class changes' : 'Create class'}</Action>
    </form></Panel></>
}

export function StudentEditor({ existing, classId, close }: { existing?: MockStudent; classId?: string; close?: () => void }) {
  const { data, update } = useMock()
  const centerId = useContext(CenterScope)
  const [classIds, setClassIds] = useState(existing?.classIds ?? (classId ? [classId] : []))
  const [error, setError] = useState('')
  return <><Heading title={existing ? 'Edit student & enrolment' : 'Add a student'} description="Save a learner and guardian, choose classes, then set their individual module." />
    <form className="grid gap-5" onSubmit={event => {
      event.preventDefault(); setError('')
      const f = new FormData(event.currentTarget), date = mockToday()
      const opening = existing ? 0 : Number(f.get('credits'))
      if (!existing && centerId && !classIds.length) { setError('Choose a class in this center before saving. You can create a class from Schedule.'); return }
      if (!Number.isInteger(opening) || opening < 0 || opening > 500) { setError('Opening credits must be a whole number from 0 to 500.'); return }
      const id = existing?.id ?? mockId()
      const changes = data.classes.filter(c => classIds.includes(c.id) !== !!existing?.classIds.includes(c.id)).map(c => ({ classId: c.id, date, action: classIds.includes(c.id) ? 'Enrolled' as const : 'Unenrolled' as const }))
      const student: MockStudent = { ...(existing ?? { id, credits: opening, completedModules: [], creditHistory: opening ? [{ id: mockId(), date, amount: opening, reason: 'Opening credit balance' }] : [] }),
        name: String(f.get('name')).trim(), age: Number(f.get('age')), parentName: String(f.get('parentName')).trim(),
        parentEmail: String(f.get('email')).trim().toLowerCase(), classIds,
        enrollmentHistory: [...(existing?.enrollmentHistory ?? []), ...changes],
      }
      if (!student.name || !student.parentName) { setError('Enter the student and guardian names.'); return }
      if (update(current => ({ ...current, students: [...current.students.filter(s => s.id !== id), student],
        weeklySlots: current.weeklySlots?.map(slot => {
          const active = slot.members.some(m => m.studentId === id && !m.end)
          if (classIds.includes(slot.classId) && !active && !slot.end) return { ...slot, members: [...slot.members, { studentId: id, start: date }] }
          if (!classIds.includes(slot.classId) && active) return { ...slot, members: slot.members.map(m => m.studentId === id && !m.end ? { ...m, end: date } : m) }
          return slot
        }),
      }))) { toast.success(existing ? 'Student and enrolment updated' : 'Student added'); if (close) close(); else window.location.assign(`/students/${id}`) }
    }}>
      <Field title="Student name"><input name="name" required maxLength={100} defaultValue={existing?.name} className={inputStyle} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field title="Age"><input name="age" type="number" min="3" max="25" required defaultValue={existing?.age ?? 9} className={inputStyle} /></Field>
        {!existing && <Field title="Opening lesson credits"><input name="credits" type="number" min="0" max="500" step="1" required defaultValue={0} className={inputStyle} /></Field>}</div>
      <Field title="Parent / guardian name"><input name="parentName" required maxLength={100} defaultValue={existing?.parentName} className={inputStyle} /></Field>
      <Field title="Parent email"><input name="email" type="email" required maxLength={200} defaultValue={existing?.parentEmail} className={inputStyle} /></Field>
      <fieldset className="grid gap-2 rounded-xl border p-4"><legend className="px-1 text-sm font-medium">Enrolled classes</legend>
        {data.classes.map(cls => <label key={cls.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={classIds.includes(cls.id)} onChange={e => setClassIds(ids => e.target.checked ? [...ids, cls.id] : ids.filter(id => id !== cls.id))} />
          <span>{cls.code} · {cls.name}<span className="ml-2 text-xs text-muted-foreground">{cls.centerId}</span></span></label>)}
        {!data.classes.length && <p className="text-sm text-muted-foreground">Save this student now and create a class to enrol them later.</p>}</fieldset>
      <p className="text-xs text-muted-foreground">The parent preview uses this email to show linked children. Demo accounts do not send invitation emails.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Action type="submit">{existing ? 'Save student & enrolment' : 'Add student'}</Action>
    </form></>
}
