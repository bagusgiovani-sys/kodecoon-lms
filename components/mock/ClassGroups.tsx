'use client'
import { useMock } from './MockProvider'
import { Empty, Heading, LinkAction, Panel, Pill } from './MockUI'
import { DemoLink } from './DemoLink'

export function ClassGroups() {
  const { data } = useMock()
  return <><Heading title="Class Groups" description="Your center’s class codes, schedules and enrolled learners." action={<LinkAction href="/classes/new">Add class group</LinkAction>} />
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.classes.map(cls => {
      const students = data.students.filter(s => s.classIds.includes(cls.id))
      return <Panel key={cls.id} title={cls.code ?? cls.name} subtitle={`${cls.name} · ${cls.teacher}`}>
        <Pill>{students.length} students</Pill><p className="my-3 text-sm text-muted-foreground">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][cls.weekday ?? 0]} · {cls.startTime}–{cls.endTime}</p>
        <div className="mb-5 divide-y">{students.map(student => <DemoLink className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm hover:text-primary" key={student.id} href={`/students/${student.id}`}><span>{student.name}</span><span className="text-xs text-muted-foreground">{student.credits} credits</span></DemoLink>)}{!students.length && <p className="py-4 text-sm text-muted-foreground">No students enrolled yet.</p>}</div>
        <LinkAction secondary href={`/classes/${cls.id}`}>Open class group</LinkAction>
      </Panel>
    })}</div>{!data.classes.length && <Empty title="No class groups yet" description="Add your first class group for this center." />}</>
}
