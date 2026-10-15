'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- Full-page demo navigation
   preserves rewritten URLs and rehydrates browser-persisted records. */
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, Bot, CalendarDays, CheckCircle2, Coins, GraduationCap, LayoutDashboard, LogOut, Plus, Search, Users, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MockProvider, useMock } from './MockProvider'
import { Avatar, Empty, Heading, inputStyle, LinkAction, Panel, Pill, StudentLink } from './MockUI'
import { StudentRecord } from './StudentRecord'
import { StudentCard } from './StudentCard'
import { LearningScreen } from './LearningPages'
import { ClassPage, ClassForm, StudentForm, SchedulePage, SessionForm, TeacherPage, LessonPage, ReportPage } from './MockOperations'

export function MockApp({ path, sessionId }: { path: string; sessionId?: string }) {
  if (path === '/' || path === '/login' || path === '/student/login') return <MockLogin parent={path === '/student/login'} />
  return <MockProvider><MockShell path={path}><MockScreen key={`${path}:${sessionId ?? ''}`} path={path} sessionId={sessionId} /></MockShell></MockProvider>
}

function MockLogin({ parent }: { parent: boolean }) {
  const parentName = parent ? 'Dewi Pratama' : 'Gio'
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_-140%,transparent_65%)]" />
    <div className="relative grid w-full max-w-5xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      <div className="flex flex-col justify-center"><a href="/" className="mb-12 inline-flex items-center gap-2 text-xl font-semibold tracking-tight"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Bot className="size-6" /></span>KodeHub<span className="ml-2 text-xs text-muted-foreground">BY KODECOON</span></a>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Small steps. Big discoveries.</p><h1 className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">Every lesson.<br />Every little breakthrough.<br /><span className="text-primary">All in one place.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">A connected classroom for curious minds. Keep learning progress, session videos, and teacher feedback together.</p>
        <div className="mt-9 flex flex-wrap gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Video className="size-4 text-primary" />Session moments</span><span className="flex items-center gap-2"><Coins className="size-4 text-primary" />Credit tracking</span><span className="flex items-center gap-2"><BookOpen className="size-4 text-primary" />Learning journeys</span></div>
      </div>
      <Panel className="self-center p-8 sm:p-10"><Pill tone="good">Interactive demo</Pill><h2 className="mt-6 text-2xl font-semibold tracking-tight">{parent ? 'A window into their world.' : 'Welcome back, teacher.'}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{parent ? 'See the progress, projects, and moments that make learning special.' : 'Your students, their progress, and your next class are ready for you.'}</p>
        <div className="my-8 flex items-center gap-3 rounded-xl border bg-background/50 p-4"><Avatar name={parentName} /><div><p className="text-sm font-medium">{parentName}</p><p className="mt-1 text-xs text-muted-foreground">{parent ? 'Parent · Aiden & Sofia' : 'Teacher & administrator'}</p></div><CheckCircle2 className="ml-auto size-4 text-primary" /></div>
        <a href={parent ? '/student' : '/dashboard'} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/85">Log in<ArrowRight className="size-4" /></a><p className="mt-4 text-center text-xs text-muted-foreground">One click. No email or password needed.</p><div className="mt-8 border-t pt-5 text-center text-xs text-muted-foreground">{parent ? 'Running a class?' : 'Here for your child?'} <a href={parent ? '/login' : '/student/login'} className="ml-1 font-medium text-primary">{parent ? 'Teacher login' : 'Parent preview'}<ArrowUpRight className="ml-1 inline size-3" /></a></div>
      </Panel>
    </div>
  </main>
}

function MockShell({ path, children }: { path: string; children: React.ReactNode }) {
  const { data } = useMock()
  const parent = path === '/student' || path.startsWith('/student/')
  const parentName = parent ? data.students.find(s => s.id === path.split('/')[2])?.parentName ?? 'Dewi Pratama' : 'Gio'
  const tabs = parent ? [{ href: '/student', label: 'My children', icon: Users }] : [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/assignments', label: 'Assignments', icon: CheckCircle2 },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
  ]
  return <div className="mock-workspace min-h-screen">
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur print:hidden"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-8"><a href={parent ? '/student' : '/dashboard'} className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="size-5" /></span>KodeHub</a><span className="hidden text-xs text-muted-foreground md:inline">Indonesia Academy</span><div className="ml-auto flex items-center gap-3"><Pill tone="good">{parent ? 'Parent preview' : 'Demo workspace'}</Pill><Avatar name={parentName} /><a href={parent ? '/student/login' : '/login'} aria-label="Log out" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary"><LogOut className="size-4" /></a></div></div><nav aria-label="Main navigation" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-8">{tabs.map(({ href, label, icon: Icon }) => <a key={href} href={href} aria-current={path === href || path.startsWith(`${href}/`) ? 'page' : undefined} className={cn('flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm', path === href || path.startsWith(`${href}/`) ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}><Icon className="size-4" />{label}</a>)}<a href={parent ? '/dashboard' : '/student'} className="ml-auto flex shrink-0 items-center gap-1 px-3 text-xs text-muted-foreground hover:text-primary">{parent ? 'Teacher workspace' : 'Parent preview'}<ArrowUpRight className="size-3" /></a></nav></header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">{children}</main><footer className="mx-auto max-w-7xl px-4 pb-6 text-xs text-muted-foreground sm:px-8 print:hidden">Demo data · Changes are saved in this browser.</footer>
  </div>
}

function MockScreen({ path, sessionId }: { path: string; sessionId?: string }) {
  const { data } = useMock()
  if (path === '/dashboard' || path === '/admin') return <Dashboard />
  if (path === '/courses' || path.startsWith('/courses/') || path === '/assignments' || path.startsWith('/assignments/')) return <LearningScreen path={path} />
  if (path === '/students') return <Students />
  if (path === '/schedule' || path === '/admin/schedule') return <SchedulePage />
  if (path === '/admin/teachers') return <TeacherPage />
  if (path === '/classes/new') return <ClassForm />
  if (path === '/student') return <Students parent />
  const parts = path.split('/').filter(Boolean)
  if ((parts[0] === 'students' || parts[0] === 'student') && parts[1]) {
    const parent = parts[0] === 'student'
    const student = data.students.find(s => s.id === parts[1])
    if (!student) return <Empty title="Student not found" description="Choose a student from your overview." />
    if (parts[2] === 'report') return <ReportPage student={student} />
    return <StudentRecord key={student.id} student={student} parent={parent} />
  }
  if (parts[0] === 'classes' && parts[1]) {
    const cls = data.classes.find(c => c.id === parts[1])
    if (!cls) return <Empty title="Class not found" description="Choose a class from the overview." />
    if (parts[2] === 'students' && parts[3] === 'new') return <StudentForm classId={cls.id} />
    if (parts[2] === 'sessions') return <SessionForm cls={cls} sessionId={sessionId} />
    return <ClassPage cls={cls} />
  }
  if (parts[0] === 'admin' && parts[1] === 'classes' && parts[2]) {
    const cls = data.classes.find(c => c.id === parts[2])
    if (cls) return <LessonPage cls={cls} />
  }
  return <Empty title="Page not found" description="Use the navigation to return to your classroom." />
}

function Dashboard() {
  const { data } = useMock()
  const pending = data.sessions.filter(session => !session.completed)
  const metrics = [
    { label: 'Active students', value: data.students.length, icon: Users, note: 'Curious minds, growing daily' },
    { label: 'Learning programs', value: data.classes.length, icon: BookOpen, note: 'Build · Code · Discover' },
    { label: 'Sessions to log', value: pending.length, icon: CalendarDays, note: 'Keep every moment recorded' },
    { label: 'Video moments', value: data.videos.length, icon: Video, note: 'Learning you can look back on' },
  ]
  return <><Heading eyebrow="Your classroom at a glance" title="Good to see you, Gio." description="Little breakthroughs deserve a great record. Here’s what’s happening in your classroom." action={<LinkAction href="/classes/new"><Plus className="size-4" />New class</LinkAction>} />
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon, note }) => <Panel key={label} className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div><p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">{note}</p></Panel>)}</div>
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div><Panel title="Your programs" subtitle="A home for every learning journey" action={<a href="/schedule" className="text-xs text-primary">View schedule →</a>}><div className="grid gap-3">{data.classes.map((cls, index) => <a href={`/classes/${cls.id}`} key={cls.id} className="group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">{index === 1 ? <BookOpen className="size-6" /> : <Bot className="size-6" />}</div><div className="min-w-0 flex-1"><h3 className="truncate font-medium group-hover:text-primary">{cls.name}</h3><p className="mt-1 text-xs text-muted-foreground">{data.students.filter(s => s.classIds.includes(cls.id)).length} students · {cls.modules.length} modules · {cls.ageBracket}</p></div><ArrowUpRight className="size-4 text-muted-foreground" /></a>)}</div></Panel>
      <Panel title="Your students" subtitle="Progress starts with knowing each learner" className="mt-6" action={<a href="/students" className="text-xs text-primary">All students →</a>}><div className="grid gap-4 sm:grid-cols-2">{data.students.slice(0, 4).map(student => <div key={student.id} className="rounded-xl border p-3"><StudentLink id={student.id} name={student.name} /><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{data.classes.find(c => c.id === student.classIds[0])?.name}</span><Pill tone={student.credits <= 2 ? 'warning' : 'good'}>{student.credits} credits</Pill></div></div>)}</div></Panel></div>
      <div><Panel title="Up next" subtitle="Scheduled classroom sessions"><div className="grid gap-4">{pending.length === 0 ? <Empty title="All caught up" description="Schedule your next classroom session." /> : pending.slice(0, 4).map(session => <div key={session.id} className="rounded-xl border p-4"><div className="mb-2 flex justify-between"><Pill>{session.time || 'Time TBD'}</Pill><span className="text-xs text-muted-foreground">{session.date}</span></div><h3 className="text-sm font-medium">{data.classes.find(c => c.id === session.classId)?.name}</h3><a href={`/classes/${session.classId}/sessions/new?sessionId=${session.id}`} className="mt-4 flex items-center gap-2 text-xs font-medium text-primary">Log this session<ArrowRight className="size-3" /></a></div>)}</div></Panel><Panel className="mt-6 border-primary/20 bg-primary/5"><Coins className="mb-3 size-6 text-primary" /><h2 className="font-medium">A little credit check</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.students.filter(s => s.credits <= 2).length} student(s) have 2 or fewer credits. Top up their package from the student record.</p><a href="/students" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">Review students<ArrowRight className="size-3" /></a></Panel></div></div>
  </>
}

function Students({ parent = false }: { parent?: boolean }) {
  const { data } = useMock()
  const [search, setSearch] = useState('')
  const students = data.students.filter(s => (!parent || ['student-1', 'student-2'].includes(s.id)) && `${s.name} ${s.parentName}`.toLowerCase().includes(search.toLowerCase()))
  return <><Heading eyebrow={parent ? 'Family learning hub' : 'Know every learner'} title={parent ? 'Their next big discovery.' : 'Your students.'} description={parent ? 'Aiden and Sofia’s projects, progress, and teacher feedback, all together.' : 'From their first robot to their next breakthrough. Open a student to manage their learning record.'} action={!parent && data.classes.length > 0 && <LinkAction href={`/classes/${data.classes[0]?.id}/students/new`}><Plus className="size-4" />Add student</LinkAction>} /><div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input aria-label="Search students" placeholder="Search students or parents…" className={cn(inputStyle, 'pl-10')} value={search} onChange={e => setSearch(e.target.value)} /></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{students.map(student => <StudentCard key={student.id} student={student} classes={data.classes} parent={parent} />)}</div>{students.length === 0 && <Empty title="No students found" description="Try another name." />}</>
}
