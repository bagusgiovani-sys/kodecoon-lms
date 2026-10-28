'use client'
import { DemoLink as Link } from './DemoLink'
import { useState } from 'react'
import { ArrowRight, Building2, CalendarDays, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { weekdays } from '@/lib/mock/nexus'
import { useMock } from './MockProvider'
import { Action, Back, Empty, Field, Heading, inputStyle, LinkAction, Modal, Panel, Pill } from './MockUI'

const minutes = (time: string) => Number(time.split(':')[0]) * 60 + Number(time.split(':')[1])
export function CenterDirectory() {
  const { data, identity, update } = useMock()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  return <><Heading eyebrow="KodeNexus · Academy workspace" title={`Welcome, ${identity?.name ?? 'team'}.`} description="Choose a center workspace. Dashboard, schedule and students will follow your selection."
    action={<div className="flex flex-wrap gap-2"><Action secondary onClick={() => setAdding(true)}><Building2 className="size-4" />Add center</Action><LinkAction href="/classes/new"><Plus className="size-4" />New class</LinkAction></div>} />
    <div className="mb-8 grid gap-4 sm:grid-cols-3">{[
      ['Centers', data.centers?.length ?? 0], ['Active students', data.students.length], ['Class groups', data.classes.length],
    ].map(([label, value]) => <Panel key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold text-primary">{value}</p></Panel>)}</div>
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.centers?.map(center => {
      const classes = data.classes.filter(c => c.centerId === center.id)
      const students = data.students.filter(s => s.classIds.some(id => classes.some(c => c.id === id)))
      return <Link key={center.id} href={`/staff/${encodeURIComponent(center.id)}/dashboard`} className="mock-panel group rounded-2xl border bg-card p-6 transition hover:border-primary/60 hover:bg-primary/5">
        <div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 /></span><Pill>{classes.length ? 'Active center' : 'Ready to set up'}</Pill></div>
        <h2 className="mt-6 text-3xl font-semibold group-hover:text-primary">{center.name}</h2><p className="mt-2 text-sm text-muted-foreground">{classes.length} class groups · {students.length} students</p>
        <div className="mt-7 flex items-center justify-between border-t pt-4 text-sm font-medium text-primary">Open center dashboard<ArrowRight className="size-4" /></div>
      </Link>
    })}</div>
    <Panel title="Ready for your demonstration" className="mt-7"><p className="text-sm leading-7 text-muted-foreground">Create a class, add a student, choose their module, and record attendance. Payments and receipts are in staff Finance. Parent preview shows only children linked to the selected guardian email.</p><div className="mt-5 flex flex-wrap gap-3"><LinkAction href="/students/new">Add student</LinkAction><LinkAction secondary href="/finance">Open Finance</LinkAction><LinkAction secondary href="/student/login">Choose a parent preview</LinkAction></div></Panel>
    <Modal open={adding} close={() => setAdding(false)} title="Add a center" description="Give the center its own timetable and class codes."><form className="grid gap-4" onSubmit={e => {
      e.preventDefault(); const f = new FormData(e.currentTarget), id = String(f.get('code')).trim().toUpperCase()
      if (!/^[A-Z0-9-]{2,12}$/.test(id)) { setError('Use 2–12 letters, numbers or hyphens for the center code.'); return }
      if (data.centers?.some(c => c.id === id)) { setError('That center code already exists.'); return }
      if (update(d => ({ ...d, centers: [...(d.centers ?? []), { id, name: String(f.get('name')).trim() }] }))) { toast.success('Center added'); setAdding(false) }
    }}><Field title="Center code"><input name="code" required maxLength={12} placeholder="STB" className={inputStyle} /></Field><Field title="Center name"><input name="name" required maxLength={80} placeholder="STB" className={inputStyle} /></Field>{error && <p role="alert" className="text-destructive">{error}</p>}<Action type="submit">Save center</Action></form></Modal>
  </>
}

export function CenterTimetable({ centerId }: { centerId: string }) {
  const { data } = useMock()
  const [day, setDay] = useState(new Date().getDay())
  const center = data.centers?.find(c => c.id === centerId)
  if (!center) return <Empty title="Center not found" description="Choose a center from the academy workspace." />
  const classes = data.classes.filter(c => c.centerId === centerId)
  const first = Math.floor(Math.min(8 * 60, ...classes.map(c => minutes(c.startTime ?? '08:00'))) / 60)
  const last = Math.ceil(Math.max(19 * 60, ...classes.map(c => minutes(c.endTime ?? '19:00'))) / 60)
  const hours = Array.from({ length: last - first }, (_, i) => first + i)
  return <><Back href="/staff" text="All centers" /><Heading eyebrow="Weekly timetable" title={`${center.name} classroom schedule`} description="Monday to Sunday. Select an occupied time block to open its class code and student roster."
    action={<LinkAction href={`/classes/new?centerId=${encodeURIComponent(centerId)}`}><Plus className="size-4" />New class</LinkAction>} />
    <div className="mb-6 flex flex-wrap gap-3"><Pill>{classes.length} class groups</Pill><Pill>{data.students.filter(s => s.classIds.some(id => classes.some(c => c.id === id))).length} students</Pill><LinkAction secondary href="/students/new"><Users className="size-4" />Add student</LinkAction></div>
    {!classes.length ? <Empty title="Your timetable is ready" description="Create the first class in this center. You can add learners straight away." /> : <>
      <div className="lg:hidden"><div className="mb-4 flex gap-2 overflow-x-auto pb-2">{[1,2,3,4,5,6,0].map(d => <Action secondary={day !== d} key={d} onClick={() => setDay(d)}>{weekdays[d].slice(0,3)}</Action>)}</div>
        <div className="grid gap-3">{classes.filter(c => c.weekday === day).sort((a,b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')).map(cls => <Link key={cls.id} href={`/classes/${cls.id}`} className="rounded-2xl border border-primary/30 bg-primary/10 p-5"><p className="text-xs font-medium text-primary">{cls.startTime}–{cls.endTime}</p><h2 className="mt-2 text-lg font-semibold">{cls.code}</h2><p className="mt-1 text-sm">{cls.name}</p><p className="mt-3 text-xs text-muted-foreground">{cls.teacher} · {data.students.filter(s => s.classIds.includes(cls.id)).map(s => s.name).join(', ') || 'No students yet'}</p></Link>)}
          {!classes.some(c => c.weekday === day) && <Empty title={`No classes on ${weekdays[day]}`} description="Choose another day or create a class." />}</div></div>
      <Panel className="hidden lg:block"><div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]"><div /><>{[1,2,3,4,5,6,0].map(d => <div key={d} className="border-b pb-4 text-center text-xs font-semibold">{weekdays[d]}</div>)}</>
        <div className="relative" style={{ height: hours.length * 48 }}>{hours.map((h,i) => <span key={h} className="absolute text-[10px] text-muted-foreground" style={{ top: i * 48 }}>{String(h).padStart(2,'0')}:00</span>)}</div>
        {[1,2,3,4,5,6,0].map(d => <div key={d} className="relative border-l" style={{ height: hours.length * 48 }}>{hours.map((h,i) => <div key={h} className="absolute w-full border-t border-border/40" style={{ top: i * 48 }} />)}
          {classes.filter(cls => cls.weekday === d).map(cls => {
            const height = (minutes(cls.endTime!) - minutes(cls.startTime!)) * .8
            return <Link key={cls.id} href={`/classes/${cls.id}`} aria-label={`Open ${cls.code}`} className="absolute inset-x-1 overflow-hidden rounded-lg border border-primary/40 bg-primary/15 px-2 py-2 text-[10px] transition hover:bg-primary/25" style={{ top: (minutes(cls.startTime!) - first*60) * .8, height: Math.max(height,22) }}>
              <p className="font-semibold text-primary">{cls.code}</p>{height > 40 && <p className="mt-1">{cls.startTime}–{cls.endTime}</p>}{height > 70 && <p className="mt-2 text-muted-foreground">{data.students.filter(s => s.classIds.includes(cls.id)).map(s => s.name.split(' ')[0]).join(', ') || 'Add students'}</p>}
            </Link>
          })}</div>)}
      </div></Panel>
    </>}
    <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-4" />Timetable times use each center’s classroom schedule. Students in a class can study different modules.</p>
  </>
}
