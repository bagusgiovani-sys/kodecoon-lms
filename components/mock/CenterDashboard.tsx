'use client'
import { DemoLink as Link } from './DemoLink'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useAcademyData } from './MockProvider'
import { scopeCenterData } from '@/lib/mock/center'
import { Heading, LinkAction, Panel, Pill, Empty, Field, inputStyle } from './MockUI'
import { mockToday } from '@/lib/mock/data'
import { weekdays } from '@/lib/mock/nexus'

export function CenterDashboard({ centerId }: { centerId: string }) {
  const academy = useAcademyData()
  const [previewCenter, setPreviewCenter] = useState(centerId)
  const data = scopeCenterData(academy, previewCenter)
  const reduced = useReducedMotion()
  const center = data.centers?.find(c => c.id === previewCenter)
  if (!center) return <Empty title="Center not found" description="Choose a center above." />
  const low = data.students.filter(s => s.credits <= 2).sort((a,b) => a.credits-b.credits)
  const today = mockToday(), todayClasses = data.classes.filter(c => c.weekday === new Date(`${today}T12:00:00`).getDay())
  const documented = new Set(data.videos.filter(v => v.date === today).map(v => `${v.classId}:${v.studentId}`))
  const expected = todayClasses.flatMap(c => data.students.filter(s => s.classIds.includes(c.id)).map(s => ({ student: s, cls: c })))
  const missing = expected.filter(({student,cls}) => !documented.has(`${cls.id}:${student.id}`))
  const counts = [1,2,3,4,5,6,0].map(day => ({ day, count: data.classes.filter(c => c.weekday === day).length }))
  const max = Math.max(1, ...counts.map(c => c.count))
  return <><div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-4"><div className="w-full sm:w-56"><Field title="Dashboard center"><select value={previewCenter} onChange={e => setPreviewCenter(e.target.value)} className={inputStyle}>{academy.centers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div><p className="max-w-xl text-xs leading-6 text-muted-foreground">Changes only this dashboard. Other tabs stay in {centerId}. Returning to Dashboard starts with {centerId} again.</p></div>
    <Heading eyebrow={`${center.name} · Operations dashboard`} title={`${center.name} at a glance`} description="Day-to-day student, class, credit and documentation follow-up. Finance stays in its separate app; academy-wide analysis belongs in Analytics." action={<LinkAction href={`/staff/${encodeURIComponent(centerId)}/schedule`}>Open {centerId} schedule</LinkAction>} />
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{[['Enrolled students',data.students.length],['Class groups',data.classes.length],['Low credit · 2 or fewer',low.length],['Classes today',todayClasses.length]].map(([label,value]) => <Panel key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold text-primary">{value}</p></Panel>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><Panel title="Weekly class activity" subtitle="Number of scheduled class groups, Monday–Sunday"><div className="flex h-52 items-end gap-2" role="img" aria-label={counts.map(c => `${weekdays[c.day]}: ${c.count} classes`).join(', ')}>{counts.map(({day,count}) => <div key={day} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2 text-center"><span className="text-xs text-primary">{count}</span><motion.div className="min-h-1 rounded-t-lg bg-primary/65" initial={reduced ? false : { height: 0 }} animate={{ height: `${count/max*72}%` }} transition={{ duration: .4 }} /><span className="text-[10px] text-muted-foreground">{weekdays[day].slice(0,3)}</span></div>)}</div></Panel>
    <Panel title="Credits need attention" subtitle="Students with two or fewer lesson credits">{low.length ? <div className="divide-y">{low.map(s => <div key={s.id} className="flex min-h-14 items-center justify-between gap-3 py-3 text-sm">{previewCenter === centerId ? <Link href={`/students/${s.id}`} className="text-primary">{s.name}</Link> : <span>{s.name}</span>}<Pill tone="warning">{s.credits} credits</Pill></div>)}</div> : <Empty title="Balances look healthy" description="No learners in this center have two or fewer credits." />}{previewCenter !== centerId && <p className="mt-4 text-xs text-muted-foreground">To open {center.name} learner records, choose {center.name} in the main Center workspace selector.</p>}</Panel>
    <Panel className="lg:col-span-2" title="Today’s documentation" subtitle="Scheduled learners without documentation yet; this is not an overdue warning.">{missing.length ? <div className="divide-y">{missing.map(({student,cls}) => <div key={`${cls.id}:${student.id}`} className="flex min-h-14 items-center justify-between gap-3 py-3 text-sm"><span>{student.name}<small className="mt-1 block text-muted-foreground">{cls.code} · {cls.startTime}</small></span>{previewCenter === centerId ? <Link href={`/students/${student.id}?tab=videos`} className="text-primary">Add documentation</Link> : <Pill>Not documented yet</Pill>}</div>)}</div> : <Empty title={expected.length ? 'Documentation is up to date' : 'No classes scheduled today'} description="After-class feedback and videos will appear on each learner’s profile." />}</Panel></div>
  </>
}
