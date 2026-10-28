'use client'
import { DemoLink as Link } from './DemoLink'
import { useState } from 'react'
import { BookOpen, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { mockId, mockToday, type MockStudent } from '@/lib/mock/data'
import type { LearnerModule } from '@/lib/mock/nexus'
import { createLearningData } from '@/lib/mock/learning'
import { useMock } from './MockProvider'
import { Action, Empty, Field, inputStyle, Modal, Panel, Pill } from './MockUI'

export function IndividualJourney({ student, parent }: { student: MockStudent; parent: boolean }) {
  const { data } = useMock()
  const [editing, setEditing] = useState<LearnerModule | null>(null)
  const [open, setOpen] = useState(false)
  const plans = (data.learnerModules ?? []).filter(p => p.studentId === student.id)
  return <Panel title="Learning Journey" subtitle="Individual modules and lessons, independent of classmates." action={!parent && <Action secondary disabled={!student.classIds.length} onClick={() => { setEditing(null); setOpen(true) }}><Plus className="size-4" />Assign module</Action>}>
    {!student.classIds.length && !parent && <p className="mb-4 text-sm text-muted-foreground">Edit this student’s enrolment to choose a class before assigning a module.</p>}
    <div className="grid gap-4">{plans.map(plan => <article key={plan.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Pill tone={plan.status === 'completed' ? 'good' : 'default'}>{plan.status === 'completed' ? 'Completed module' : 'Current module'}</Pill><h3 className="mt-3 text-lg font-semibold">{plan.title}</h3><p className="mt-1 text-sm text-muted-foreground">{data.classes.find(c => c.id === plan.classId)?.code} · {plan.lesson}</p></div>{!parent && <Action secondary aria-label={`Edit ${plan.title}`} onClick={() => { setEditing(plan); setOpen(true) }}><Pencil className="size-4" />Edit learning</Action>}</div>
      <div className="mt-5 flex justify-between text-xs text-muted-foreground"><span>Lessons completed</span><span>{plan.completed}/{plan.total}</span></div><div role="progressbar" aria-label={`${plan.title} lesson progress`} aria-valuemin={0} aria-valuemax={plan.total} aria-valuenow={plan.completed} className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${plan.total ? plan.completed/plan.total*100 : 0}%` }} /></div>
      <Link href={`/${parent ? 'student' : 'students'}/${student.id}?tab=videos&module=${encodeURIComponent(plan.title)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" />View class documentation</Link>
    </article>)}</div>
    {!plans.length && <Empty title="Their learning journey starts here" description={parent ? 'The teacher will assign an individual module.' : 'Assign a module and current lesson for this learner.'} />}
    <Modal open={open} close={() => setOpen(false)} title={editing ? 'Edit individual learning' : 'Assign an individual module'} description={`Learning details for ${student.name}. Changes do not affect classmates.`}>{open && <ModuleForm student={student} existing={editing} close={() => setOpen(false)} />}</Modal>
  </Panel>
}

function ModuleForm({ student, existing, close }: { student: MockStudent; existing: LearnerModule | null; close: () => void }) {
  const { data, update } = useMock()
  const [error, setError] = useState('')
  return <form className="grid gap-4" onSubmit={event => {
    event.preventDefault(); const f = new FormData(event.currentTarget)
    const completed = Number(f.get('completed')), total = Number(f.get('total'))
    if (!Number.isInteger(completed) || !Number.isInteger(total) || completed > total || completed < 0 || total < 1) { setError('Completed lessons must be between 0 and the total.'); return }
    const plan: LearnerModule = { id: existing?.id ?? mockId(), studentId: student.id, classId: String(f.get('classId')), courseId: String(f.get('courseId')) || undefined, title: String(f.get('title')).trim(), lesson: String(f.get('lesson')).trim(), completed, total,
      status: completed === total ? 'completed' : 'active', started: existing?.started || mockToday() }
    if (update(d => ({ ...d, learnerModules: [...(d.learnerModules ?? []).filter(p => p.id !== plan.id), plan] }))) { toast.success('Individual learning saved'); close() }
  }}>
    <Field title="Class"><select name="classId" defaultValue={existing?.classId} className={inputStyle}>{data.classes.filter(c => student.classIds.includes(c.id) || c.id === existing?.classId).map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></Field>
    <Field title="Library course (for center counts)"><select name="courseId" defaultValue={existing?.courseId ?? ''} className={inputStyle}><option value="">Custom module / not linked yet</option>{(data.learning ?? createLearningData()).courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
    <Field title="Module name"><input name="title" required maxLength={150} defaultValue={existing?.title} placeholder="Robotics: Sensors" className={inputStyle} /></Field>
    <Field title="Current lesson / next step"><input name="lesson" required maxLength={150} defaultValue={existing?.lesson ?? 'Lesson 1'} className={inputStyle} /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field title="Lessons completed"><input name="completed" type="number" min="0" max="10000" required defaultValue={existing?.completed ?? 0} className={inputStyle} /></Field><Field title="Total lessons"><input name="total" type="number" min="1" max="10000" required defaultValue={existing?.total ?? 6} className={inputStyle} /></Field></div>
    <p className="text-xs text-muted-foreground">A module is marked completed when all its lessons are complete.</p>{error && <p role="alert" className="text-destructive">{error}</p>}<Action type="submit">Save individual learning</Action>
  </form>
}
