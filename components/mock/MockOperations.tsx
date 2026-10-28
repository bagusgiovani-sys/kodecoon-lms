'use client'
import { DemoLink as Link } from './DemoLink'
import { useState } from 'react'
import { CalendarDays, CheckCircle2, Pencil, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { mockId, mockToday, type MockClass, type MockSession, type MockStudent } from '@/lib/mock/data'
import { applyMockSession } from '@/lib/mock/session'
import { useMock } from './MockProvider'
import { ReportPrintButton } from './ReportPrintButton'
import { createLearningData } from '@/lib/mock/learning'
import { Action, Back, dateLabel, Empty, Field, Heading, inputStyle, LinkAction, Modal, Panel, Pill, StudentLink } from './MockUI'

export function ClassPage({ cls }: { cls: MockClass }) {
  const { data } = useMock()
  const students = data.students.filter(s => s.classIds.includes(cls.id))
  return <><Back href="/dashboard" text="Your programs" /><Heading eyebrow="Classroom hub" title={cls.name} description={`${cls.ageBracket} · ${cls.teacher} · ${cls.modules.length} learning modules`} action={<LinkAction href={`/classes/${cls.id}/sessions/new`}><CheckCircle2 className="size-4" />Log session</LinkAction>} /><div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]"><Panel title="Class roster" subtitle={`${students.length} learners in this program`} action={<LinkAction secondary href={`/classes/${cls.id}/students/new`}><Plus className="size-4" />Add student</LinkAction>}><div className="divide-y">{students.map(student => <div key={student.id} className="py-4"><StudentLink id={student.id} name={student.name} /><div className="ml-13 mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>{student.parentName}</span><Pill tone={student.credits <= 2 ? 'warning' : 'good'}>{student.credits} credits left</Pill></div></div>)}</div>{!students.length && <Empty title="Your classroom is ready" description="Add your first student to start their learning record." />}</Panel><div className="space-y-6"><Panel title="Course workspace"><p className="mb-4 text-sm text-muted-foreground">{(data.learning ?? createLearningData()).courses.find(course => course.id === data.learning?.classCourses[cls.id])?.title ?? 'Choose a reusable course for this class.'}</p><LinkAction secondary href={data.learning?.classCourses[cls.id] ? `/courses/${data.learning.classCourses[cls.id]}` : '/courses'}>Open course library</LinkAction></Panel><Panel title="Learning modules" action={<Link href={`/admin/classes/${cls.id}/lessons`} className="text-xs text-primary">Manage →</Link>}><ol className="grid gap-3">{cls.modules.map((module, index) => <li key={module} className="flex gap-3 text-sm"><span className="text-primary">{String(index + 1).padStart(2, '0')}</span>{module}</li>)}</ol></Panel><Panel title="Class sessions"><div className="grid gap-3">{data.sessions.filter(s => s.classId === cls.id).sort((a, b) => b.date.localeCompare(a.date)).map(session => <Link key={session.id} href={`/classes/${cls.id}/sessions/new?sessionId=${session.id}`} className="rounded-xl border p-3 hover:border-primary/30"><div className="flex items-center justify-between gap-2"><p className="text-sm">{dateLabel(session.date)}</p><Pill tone={session.completed ? 'good' : 'default'}>{session.completed ? 'Logged' : 'Scheduled'}</Pill></div><p className="mt-2 text-xs text-muted-foreground">{session.time || 'Time not set'} · {session.completed ? 'Review / edit session' : 'Ready to log'}</p></Link>)}</div></Panel></div></div></>
}

export function ClassForm() {
  const { data, update } = useMock()
  return <><Back href="/dashboard" text="Your programs" /><Heading title="Start a new learning journey." description="Create a class and its first learning module." /><Panel className="max-w-xl"><form className="grid gap-5" onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim()
    const moduleTitle = String(fields.get('module')).trim()
    if (!name || !moduleTitle) { toast.error('Enter a class name and a module.'); return }
    const cls: MockClass = { id: mockId(), name, ageBracket: String(fields.get('ageBracket')), teacher: String(fields.get('teacher')), modules: [moduleTitle] }
    if (update(current => ({ ...current, classes: [...current.classes, cls] }))) window.location.assign(`/classes/${cls.id}`)
  }}><Field title="Class name"><input name="name" required placeholder="e.g. Python Pioneers" className={inputStyle} /></Field><Field title="Age bracket"><input name="ageBracket" required placeholder="e.g. 10–14 years" className={inputStyle} /></Field><Field title="Teacher"><select name="teacher" className={inputStyle}>{data.teachers.map(t => <option key={t.id}>{t.name}</option>)}</select></Field><Field title="First module"><input name="module" required placeholder="e.g. Hello, Python!" className={inputStyle} /></Field><Action type="submit">Create class</Action></form></Panel></>
}

export function StudentForm({ classId }: { classId: string }) {
  const { data, update } = useMock()
  return <><Back href={`/classes/${classId}`} text="Class roster" /><Heading title="Meet your next curious mind." description="Create a student record and their opening credit balance." /><Panel className="max-w-xl"><form className="grid gap-5" onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim()
    const parentName = String(fields.get('parentName')).trim()
    if (!name || !parentName) { toast.error('Student and parent names cannot be blank.'); return }
    const credits = Number(fields.get('credits'))
    const student: MockStudent = { id: mockId(), name, age: Number(fields.get('age')), parentName, parentEmail: String(fields.get('email')), credits, classIds: [String(fields.get('classId'))], completedModules: [], creditHistory: [{ id: mockId(), date: mockToday(), amount: credits, reason: 'Opening session package' }] }
    if (update(current => ({ ...current, students: [...current.students, student] }))) window.location.assign(`/students/${student.id}`)
  }}><Field title="Student name"><input name="name" required placeholder="Full name" className={inputStyle} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field title="Age"><input name="age" type="number" min="3" max="25" required defaultValue="9" className={inputStyle} /></Field><Field title="Starting credits"><input name="credits" type="number" min="0" max="100" step="1" defaultValue="8" required className={inputStyle} /></Field></div><Field title="Program"><select name="classId" defaultValue={classId} className={inputStyle}>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field title="Parent name"><input name="parentName" required placeholder="Parent or guardian name" className={inputStyle} /></Field><Field title="Parent email"><input name="email" type="email" required placeholder="parent@example.com" className={inputStyle} /></Field><p className="text-xs text-muted-foreground">This is a demo record. No invitation email will be sent.</p><Action type="submit">Add student</Action></form></Panel></>
}

export function SchedulePage() {
  const { data } = useMock()
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<MockSession | undefined>()
  return <><Heading eyebrow="Make room for discovery" title="Your class schedule." description="Plan the next session, record attendance, and keep the classroom moving." action={<Action onClick={() => { setEditing(undefined); setDialog(true) }}><Plus className="size-4" />Schedule session</Action>} /><div className="grid gap-4">{[...data.sessions].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(session => <Panel key={session.id}><div className="flex flex-wrap items-center gap-4"><div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-6" /></div><div className="min-w-0 flex-1"><h2 className="font-semibold">{data.classes.find(c => c.id === session.classId)?.name}</h2><p className="mt-1 text-xs text-muted-foreground">{dateLabel(session.date)} · {session.time || 'Time TBD'} · {data.classes.find(c => c.id === session.classId)?.teacher}</p></div><Pill tone={session.completed ? 'good' : 'default'}>{session.completed ? 'Logged' : 'Scheduled'}</Pill><div className="flex flex-wrap gap-2"><Action secondary aria-label={`Reschedule ${data.classes.find(c => c.id === session.classId)?.name}`} onClick={() => { setEditing(session); setDialog(true) }}><Pencil className="size-4" />Reschedule</Action><LinkAction href={`/classes/${session.classId}/sessions/new?sessionId=${session.id}`}>{session.completed ? 'Review session' : 'Log attendance'}</LinkAction></div></div></Panel>)}</div>{!data.sessions.length && <Empty title="A fresh calendar" description="Schedule your first session to get started." />}<Modal open={dialog} close={() => setDialog(false)} title={editing ? 'Reschedule session' : 'Schedule a session'} description="Choose the class, date, and time.">{dialog && <ScheduleForm existing={editing} close={() => setDialog(false)} />}</Modal></>
}

function ScheduleForm({ existing, close }: { existing?: MockSession; close: () => void }) {
  const { data, update } = useMock()
  return <form className="grid gap-4" onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const session: MockSession = { ...(existing ?? { id: mockId(), notes: '', completed: false, attendance: {} }), classId: String(fields.get('classId')), date: String(fields.get('date')), time: String(fields.get('time')) }
    // Logged attendance is immutable during rescheduling. Date changes are
    // also reflected in that session's credit ledger and documentation.
    if (update(current => ({ ...current,
      sessions: [...current.sessions.filter(s => s.id !== session.id), session],
      students: current.students.map(s => ({ ...s, creditHistory: s.creditHistory.map(entry => entry.id.startsWith(`session-${session.id}-`) ? { ...entry, date: session.date } : entry) })),
      videos: current.videos.map(v => v.id.startsWith(`session-video-${session.id}-`) ? { ...v, date: session.date } : v),
    }))) { toast.success('Session scheduled'); close() }
  }}><Field title="Class"><select name="classId" defaultValue={existing?.classId} className={inputStyle} disabled={!!existing?.completed}>{data.classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select>{existing?.completed && <input type="hidden" name="classId" value={existing.classId} />}</Field><Field title="Date"><input name="date" type="date" required defaultValue={existing?.date ?? mockToday()} className={inputStyle} /></Field><Field title="Time"><input name="time" type="time" required defaultValue={existing?.time ?? '15:00'} className={inputStyle} /></Field><Action type="submit">Save schedule</Action></form>
}

export function SessionForm({ cls, sessionId }: { cls: MockClass; sessionId?: string }) {
  const { data, update } = useMock()
  const initial = data.sessions.find(s => s.id === sessionId && s.classId === cls.id)
  const [id] = useState(() => initial?.id ?? mockId())
  const [attendance, setAttendance] = useState<MockSession['attendance']>(initial?.attendance ?? {})
  const [error, setError] = useState('')
  const students = data.students.filter(s => s.classIds.includes(cls.id))
  return <><Back href={`/classes/${cls.id}`} text="Class roster" /><Heading eyebrow={initial?.completed ? 'Review & correct' : 'Every session counts'} title={initial?.completed ? 'Your session record.' : 'Let’s log this session.'} description={`${cls.name} · One attended session uses one credit. Saving edits applies only the attendance change.`} /><form onSubmit={event => {
    event.preventDefault()
    setError('')
    if (!students.length) { setError('Add students to the class before logging a session.'); return }
    if (students.some(s => !attendance[s.id])) { setError('Mark each student present or absent before saving.'); return }
    const fields = new FormData(event.currentTarget)
    const videoUrl = String(fields.get('videoUrl') ?? '').trim()
    if (videoUrl) { try { if (new URL(videoUrl).protocol !== 'https:') throw new Error() } catch { setError('Use a valid HTTPS video link.'); return } }
    const session: MockSession = { id, classId: cls.id, date: String(fields.get('date')), time: String(fields.get('time')), notes: String(fields.get('notes')).trim(), completed: true, attendance, module: String(fields.get('module') ?? ''), videoUrl }
    try {
      if (update(current => applyMockSession(current, session))) { toast.success('Session saved · credits and progress updated'); window.location.assign(`/classes/${cls.id}`) }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this session.') }
  }} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><Panel title="Who joined the discovery?" subtitle="Mark attendance for each learner"><div className="mb-4 flex gap-2"><Action secondary onClick={() => setAttendance(Object.fromEntries(students.map(s => [s.id, 'present'])))}>Mark all present</Action><Action secondary onClick={() => setAttendance(Object.fromEntries(students.map(s => [s.id, 'absent'])))}>Mark all absent</Action></div><div className="divide-y">{students.map(student => <div key={student.id} className="flex flex-wrap items-center gap-3 py-4"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{student.name}</p><p className="mt-1 text-xs text-muted-foreground">{student.credits} credits left</p></div><div className="flex gap-2">{(['present', 'absent'] as const).map(status => <button type="button" key={status} aria-label={`${student.name}: ${status}`} aria-pressed={attendance[student.id] === status} onClick={() => setAttendance(current => ({ ...current, [student.id]: status }))} className={cn('min-h-10 rounded-xl border px-4 text-xs capitalize', attendance[student.id] === status ? 'border-primary/30 bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary')}>{status}</button>)}</div></div>)}</div></Panel><Panel title="Session details"><div className="grid gap-4"><div className="grid grid-cols-2 gap-3"><Field title="Session date"><input name="date" type="date" required defaultValue={initial?.date ?? mockToday()} className={inputStyle} /></Field><Field title="Time"><input name="time" type="time" defaultValue={initial?.time ?? '15:00'} className={inputStyle} /></Field></div><Field title="Module completed (optional)"><select name="module" defaultValue={initial?.module ?? ''} className={inputStyle}><option value="">No module completed this session</option>{cls.modules.map(m => <option key={m}>{m}</option>)}</select></Field><p className="-mt-2 text-xs text-muted-foreground">Marks the selected module complete for students present.</p><Field title="Session video link (optional)"><input name="videoUrl" type="url" defaultValue={initial?.videoUrl} placeholder="https://drive.google.com/…" className={inputStyle} /></Field><Field title="Teacher notes"><textarea name="notes" rows={5} defaultValue={initial?.notes} className={inputStyle} placeholder="What did the class discover today?" /></Field>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Action type="submit"><CheckCircle2 className="size-4" />Save session</Action></div></Panel></form></>
}

export function TeacherPage() {
  const { data, update } = useMock()
  const [open, setOpen] = useState(false)
  return <><Heading eyebrow="The people behind the progress" title="Your teaching team." description="Manage demo teacher records and program assignments." action={<Action onClick={() => setOpen(true)}><Plus className="size-4" />Add teacher</Action>} /><div className="grid gap-4 sm:grid-cols-2">{data.teachers.map(teacher => <Panel key={teacher.id}><Users className="mb-4 size-6 text-primary" /><h2 className="text-lg font-semibold">{teacher.name}</h2><p className="mt-1 text-xs text-muted-foreground">{teacher.email}</p><div className="mt-5 flex flex-wrap gap-2">{data.classes.filter(c => c.teacher === teacher.name).map(c => <Pill key={c.id}>{c.name}</Pill>)}</div></Panel>)}</div><Modal open={open} close={() => setOpen(false)} title="Add a teacher" description="Create a demo teacher record. No email is sent."><form className="grid gap-4" onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim()
    const email = String(fields.get('email')).trim().toLowerCase()
    if (!name) { toast.error('Enter a teacher name.'); return }
    if (data.teachers.some(t => t.email === email)) { toast.error('A teacher with this email already exists.'); return }
    if (update(current => ({ ...current, teachers: [...current.teachers, { id: mockId(), name, email }] }))) { toast.success('Teacher added'); setOpen(false) }
  }}><Field title="Teacher name"><input name="name" required className={inputStyle} /></Field><Field title="Email"><input name="email" type="email" required className={inputStyle} /></Field><Action type="submit">Add teacher</Action></form></Modal><Panel title="Program assignments" className="mt-6"><div className="grid gap-4 sm:grid-cols-2">{data.classes.map(cls => <Field key={cls.id} title={cls.name}><select className={inputStyle} value={cls.teacher} onChange={event => { if (update(current => ({ ...current, classes: current.classes.map(c => c.id === cls.id ? { ...c, teacher: event.target.value } : c) }))) toast.success('Teacher assignment updated') }}>{data.teachers.map(t => <option key={t.id}>{t.name}</option>)}</select></Field>)}</div></Panel></>
}

export function LessonPage({ cls }: { cls: MockClass }) {
  const { update } = useMock()
  return <><Back href={`/classes/${cls.id}`} text="Class roster" /><Heading title="Build their learning path." description={`${cls.name} · Define the milestones your students will work toward.`} /><Panel className="max-w-3xl" title="Learning modules"><ol className="grid gap-3">{cls.modules.map((module, index) => <li key={module} className="flex items-center gap-4 rounded-xl border p-4"><span className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, '0')}</span><span className="flex-1 text-sm">{module}</span><Pill>Module</Pill></li>)}</ol><form className="mt-6 grid gap-3 sm:flex sm:items-end" onSubmit={event => {
    event.preventDefault()
    const form = event.currentTarget
    const moduleTitle = String(new FormData(form).get('module')).trim()
    if (!moduleTitle) return
    if (cls.modules.includes(moduleTitle)) { toast.error('This module already exists.'); return }
    if (update(current => ({ ...current, classes: current.classes.map(c => c.id === cls.id ? { ...c, modules: [...c.modules, moduleTitle] } : c) }))) { form.reset(); toast.success('Module added') }
  }}><div className="flex-1"><Field title="New module"><input name="module" required placeholder="e.g. Obstacle course challenge" className={inputStyle} /></Field></div><Action type="submit"><Plus className="size-4" />Add module</Action></form></Panel></>
}

export function ReportPage({ student }: { student: MockStudent }) {
  const { data, update } = useMock()
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const publishedFeedback = data.feedback.filter(f => f.studentId === student.id && f.published)
  function draft() {
    const programs = data.classes.filter(c => student.classIds.includes(c.id)).map(c => c.name).join(', ')
    const modules = (data.learnerModules ?? []).filter(p => p.studentId === student.id)
    const attended = data.sessions.filter(s => s.attendance[student.id] === 'present').length
    setText(`${student.name} is learning in ${programs || 'their individual learning program'}. Their record shows ${modules.filter(p => p.status === 'completed').length} completed modules and ${attended} attended sessions.\n\n${modules.map(p => `${p.title}: ${p.completed} of ${p.total} lessons completed. ${p.lesson}.`).join('\n')}\n\n${publishedFeedback.length ? publishedFeedback.map(f => `${f.module}: ${f.strengths}\nNext steps: ${f.nextSteps}`).join('\n\n') : 'Add your observations about their achievements, confidence, and next steps here.'}`)
    setSaved(false)
  }
  return <><Back href={`/students/${student.id}`} text="Student record" /><Heading eyebrow="A thoughtful reflection" title={`${student.name}’s progress report.`} description="Draft from the demo learning record, review your wording, then publish it to the parent view." /><Panel className="max-w-3xl"><div className="mb-5 flex flex-wrap gap-3 print:hidden"><Action secondary onClick={draft}>Create demo draft</Action><Pill>Local draft · no AI service needed</Pill></div><div className="print:hidden"><Field title="Report text"><textarea rows={14} value={text} onChange={e => { setText(e.target.value); setSaved(false) }} className={inputStyle} placeholder="Write a progress report, or start with a draft from their learning record." /></Field></div><div className="hidden whitespace-pre-wrap text-sm leading-7 print:block">{text}</div><div className="mt-5 flex flex-wrap gap-3 print:hidden"><Action disabled={!text.trim() || saved} onClick={() => {
    if (update(current => ({ ...current, reports: [{ id: mockId(), studentId: student.id, date: mockToday(), text: text.trim() }, ...current.reports] }))) { toast.success('Report published to parent view'); setSaved(true) }
  }}>{saved ? 'Published ✓' : 'Publish report'}</Action><ReportPrintButton studentName={student.name} date={mockToday()} text={text} /></div></Panel></>
}
