'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { Experience, PageSkeleton, useDebouncedValue } from './NexusExperience'
import { NexusShell } from './NexusShell'
import { CenterDashboard } from './CenterDashboard'
import { demoNavigationEvent } from './DemoLink'
import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { visibleToGuardian } from '@/lib/mock/nexus'
import { CenterScope, MockProvider, useMock } from './MockProvider'
import { Empty, Heading, inputStyle, LinkAction, Panel } from './MockUI'
import { NexusLogin } from './NexusLogin'
import { CenterDirectory, CenterTimetable } from './NexusCenters'
import { NexusClass } from './NexusClass'
import { ClassEditor, StudentEditor } from './RecordEditors'
const DailyAttendance = dynamic(() => import('./DailyAttendance').then(m => m.DailyAttendance), { loading: PageSkeleton })
const StudentRecord = dynamic(() => import('./StudentRecord').then(m => m.StudentRecord), { loading: PageSkeleton })
import { StudentCard } from './StudentCard'
const LearningScreen = dynamic(() => import('./LearningPages').then(m => m.LearningScreen), { loading: PageSkeleton })
import { SessionForm, TeacherPage, LessonPage } from './MockOperations'
import { ClassGroups } from './ClassGroups'
const ReportPage = dynamic(() => import('./FeedbackReportPage').then(m => m.FeedbackReportPage), { loading: PageSkeleton })

export function MockApp({ path, sessionId }: { path: string; sessionId?: string }) {
  const router = useRouter()
  useEffect(() => {
    const navigate = (event: Event) => {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href
      if (!href?.startsWith('/') || href.startsWith('//')) return
      // The demo is one Pages Router page behind proxy aliases. Push that real
      // page shallowly while keeping the requested alias in the address bar.
      void router.push({ pathname: '/demo', query: { path: href } }, href, { shallow: true, scroll: true })
    }
    window.addEventListener(demoNavigationEvent, navigate)
    return () => window.removeEventListener(demoNavigationEvent, navigate)
  }, [router])
  const location = router.isReady ? router.asPath : path
  const url = new URL(location, 'http://demo.local')
  const activePath = url.pathname === '/demo' ? url.searchParams.get('path') ?? path : url.pathname
  return <MockProvider><Experience><DemoRoute path={activePath} search={url.search} sessionId={url.searchParams.get('sessionId') ?? sessionId} /></Experience></MockProvider>
}

function DemoRoute({ path, search, sessionId }: { path: string; search: string; sessionId?: string }) {
  const { data, identity } = useMock()
  const routeCenter = path.startsWith('/staff/') ? decodeURIComponent(path.split('/')[2]) : path.startsWith('/classes/') ? data.classes.find(c => c.id === path.split('/')[2])?.centerId : undefined
  const [savedCenter, setSavedCenter] = useState<string | null>(null)
  useEffect(() => {
    const selected = routeCenter ?? sessionStorage.getItem('kodenexus-center') ?? data.centers?.[0]?.id
    if (selected && data.centers?.some(c => c.id === selected)) {
      sessionStorage.setItem('kodenexus-center', selected)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize browser-owned workspace selection
      setSavedCenter(selected)
    }
  }, [routeCenter, path, data.centers])
  const centerId = identity?.role === 'parent' || ['/dashboard','/admin'].includes(path) ? null : routeCenter ?? savedCenter
  if (['/', '/login', '/student/login'].includes(path)) return <NexusLogin parent={path === '/student/login'} />
  if (!identity) return <NexusLogin parent={path === '/student' || path.startsWith('/student/')} />
  const parentPath = path === '/student' || path.startsWith('/student/')
  const childId = parentPath ? path.split('/')[2] : undefined
  const denied = identity.role === 'parent'
    ? !parentPath || (!!childId && !data.students.some(s => s.id === childId && visibleToGuardian(s, identity))) || path.endsWith('/report')
    : parentPath
  if (denied) return <NexusShell path={path} centerId={centerId}><Empty title="This account cannot open this page" description={identity.role === 'parent' ? 'Use My children to open a linked child. Staff records and finance are unavailable in a parent preview.' : 'Choose a parent account to preview its linked children.'} /><div className="mt-5"><LinkAction href={identity.role === 'parent' ? '/student' : '/staff'}>Return to my workspace</LinkAction></div></NexusShell>
  return <CenterScope.Provider value={path === '/staff' ? null : centerId}><NexusShell path={path} centerId={centerId}><MockScreen key={`${path}:${search}:${centerId}:${sessionId ?? ''}`} path={path} centerId={centerId} sessionId={sessionId} /></NexusShell></CenterScope.Provider>
}

function MockScreen({ path, sessionId, centerId }: { path: string; sessionId?: string; centerId: string | null }) {
  const { data } = useMock()
  if (path === '/dashboard' || path === '/admin' || path === '/staff') return <CenterDirectory />
  if (path.startsWith('/staff/') && path.endsWith('/dashboard')) return <CenterDashboard centerId={decodeURIComponent(path.split('/')[2])} />
  if (path.startsWith('/staff/') && path.endsWith('/schedule')) return <CenterTimetable centerId={decodeURIComponent(path.split('/')[2])} />
  if (path.startsWith('/assignments')) return <Empty title="Assignments have been removed" description="Record after-class feedback and videos from each student’s documentation page." />
  if (path === '/finance') return <Empty title="Finance is managed separately" description="Payment records, receipts, reimbursements and business expenses belong in the separate Finance app, not Kode Nexus." />
  if (path === '/classes') return <ClassGroups />
  if (path === '/students/new') return <Panel className="max-w-2xl"><StudentEditor /></Panel>
  if (path === '/courses' || path.startsWith('/courses/')) return <LearningScreen path={path} />
  if (path === '/attendance') return <DailyAttendance />
  if (path === '/students') return <Students />
  if (path === '/schedule' || path === '/admin/schedule') return centerId ? <CenterTimetable centerId={centerId} /> : <CenterDirectory />
  if (path === '/admin/teachers') return <TeacherPage />
  if (path === '/classes/new') return <ClassEditor centerId={(typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('centerId')) ?? centerId ?? undefined} />
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
    if (parts[2] === 'students' && parts[3] === 'new') return <Panel className="max-w-2xl"><StudentEditor classId={cls.id} /></Panel>
    if (parts[2] === 'edit') return <ClassEditor existing={cls} />
    if (parts[2] === 'sessions') return <SessionForm cls={cls} sessionId={sessionId} />
    return <NexusClass cls={cls} />
  }
  if (parts[0] === 'admin' && parts[1] === 'classes' && parts[2]) {
    const cls = data.classes.find(c => c.id === parts[2])
    if (cls) return <LessonPage cls={cls} />
  }
  return <Empty title="Page not found" description="Use the navigation to return to your classroom." />
}

function Students({ parent = false }: { parent?: boolean }) {
  const { data, identity } = useMock()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const students = data.students.filter(s => (!parent || visibleToGuardian(s, identity)) && `${s.name} ${s.parentName}`.toLowerCase().includes(debouncedSearch.toLowerCase()))
  return <><Heading eyebrow={parent ? 'Family learning hub' : 'Know every learner'} title={parent ? 'Their next big discovery.' : 'Your students.'} description={parent ? 'Your linked children’s progress, documentation and teacher feedback.' : 'From their first robot to their next breakthrough. Open a student to manage their learning record.'} action={!parent && <LinkAction href="/students/new"><Plus className="size-4" />Add student</LinkAction>} /><div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input aria-label="Search students" placeholder="Search students or parents…" className={cn(inputStyle, 'pl-10')} value={search} onChange={e => setSearch(e.target.value)} /></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{students.map(student => <StudentCard key={student.id} student={student} classes={data.classes} learnerModules={data.learnerModules} parent={parent} />)}</div>{students.length === 0 && <Empty title="No students found" description="Try another name." />}</>
}
