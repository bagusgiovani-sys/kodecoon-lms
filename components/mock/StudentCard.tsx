'use client'
import { ArrowUpRight, BookOpen, Coins } from 'lucide-react'
import type { MockClass, MockStudent } from '@/lib/mock/data'
import { Avatar, Panel, Pill } from './MockUI'

export function StudentCard({ student, classes, parent = false }: {
  student: MockStudent
  classes: MockClass[]
  parent?: boolean
}) {
  const enrolled = classes.filter(cls => student.classIds.includes(cls.id))
  const total = enrolled.reduce((sum, cls) => sum + cls.modules.length, 0)
  const completed = enrolled.reduce((sum, cls) => sum + cls.modules.filter(module => student.completedModules.includes(`${cls.id}:${module}`)).length, 0)
  const progress = total ? Math.round(completed / total * 100) : 0
  const href = `/${parent ? 'student' : 'students'}/${student.id}`

  return <Panel className="student-card flex h-full flex-col">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <Avatar name={student.name} large />
      <Pill tone={student.credits <= 2 ? 'warning' : 'good'}>{student.credits <= 2 ? 'Low credits' : 'Learning in progress'}</Pill>
    </div>
    <h2 className="text-xl font-semibold tracking-tight"><a href={href} className="hover:text-primary">{student.name}</a></h2>
    <p className="mt-1 text-sm text-muted-foreground">Age {student.age} · {student.parentName}</p>
    <div className="my-5 grid flex-1 gap-3">
      <div className="rounded-xl border bg-background/45 p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><BookOpen className="size-4 text-primary" />Enrolled classes</p>
        <ul className="grid gap-2 text-sm font-medium">{enrolled.map(cls => <li key={cls.id}>{cls.name}</li>)}</ul>
        {!enrolled.length && <p className="text-sm text-muted-foreground">No classes yet</p>}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span className="flex items-center gap-2 text-sm text-muted-foreground"><Coins className="size-4 text-primary" />Credits left</span>
        <span className="text-3xl font-semibold tabular-nums text-primary">{student.credits}</span>
      </div>
    </div>
    <div className="mb-5">
      <div className="mb-2 flex justify-between gap-2 text-xs text-muted-foreground"><span>Module progress</span><span>{completed}/{total}</span></div>
      <div role="progressbar" aria-label={`${student.name} module progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
    </div>
    <a href={href} aria-label={`View ${student.name}'s learning record`} className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">View learning record<ArrowUpRight className="size-4 shrink-0" /></a>
  </Panel>
}
