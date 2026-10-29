'use client'
import { DemoLink as Link } from './DemoLink'
import { useEffect, useRef, useState } from 'react'
import { useDemoLocation } from './DemoLink'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { ArrowUpRight, BookOpen, CheckCircle2, Coins, MessageSquare, Pencil, Play, Plus, Video } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { mockId, mockToday, type MockFeedback, type MockStudent, type MockVideo } from '@/lib/mock/data'
import { readMockVideo, saveMockVideo } from '@/lib/mock/videoStorage'
import { useAcademyData, useMock } from './MockProvider'
import { DailyAttendance } from './DailyAttendance'
import { IndividualJourney } from './IndividualJourney'
import { StudentEditor } from './RecordEditors'
import { attendanceLabel } from '@/lib/attendance'
import { PageTransition } from './NexusExperience'
import { StudentReports, StudentCertificates } from './StudentDocuments'
import { Action, Back, dateLabel, Empty, Field, Heading, inputStyle, LinkAction, Modal, Panel, Pill } from './MockUI'

export function StudentRecord({ student, parent }: { student: MockStudent; parent: boolean }) {
  const { data } = useMock()
  const academy = useAcademyData()
  const location = useDemoLocation()
  const [tab, setTab] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'videos' ? 'videos' : 'overview')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow documentation deep links on client navigation
    setTab(new URL(location, 'http://demo.local').searchParams.get('tab') === 'videos' ? 'videos' : 'overview')
  }, [location])
  const [dialog, setDialog] = useState<'video' | 'feedback' | 'credits' | 'edit' | 'enrolment' | null>(null)
  const [editingFeedback, setEditingFeedback] = useState<MockFeedback | undefined>()
  const classes = data.classes.filter(c => student.classIds.includes(c.id))
  const moduleFilter = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('module')
  const videos = data.videos.filter(v => v.studentId === student.id && (!moduleFilter || v.module === moduleFilter)).sort((a, b) => b.date.localeCompare(a.date))
  const feedback = data.feedback.filter(f => f.studentId === student.id && (!parent || f.published)).sort((a, b) => b.date.localeCompare(a.date))
  const sessions = academy.sessions.filter(s => s.attendance[student.id])
  const attended = sessions.filter(s => s.attendance[student.id] === 'present').length
  const plans = (data.learnerModules ?? []).filter(p => p.studentId === student.id)
  const totalModules = plans.length
  const completed = plans.filter(p => p.status === 'completed').length
  const openFeedback = (item?: MockFeedback) => { setEditingFeedback(item); setDialog('feedback') }

  return <><Back href={parent ? '/student' : '/students'} text={parent ? 'My children' : 'All students'} />
    <div className="mock-panel mb-6 flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 sm:p-6"><ProfilePhoto student={student} /><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-medium text-primary">STUDENT LEARNING RECORD</p><h1 className="text-3xl font-semibold tracking-tight">{student.name}</h1><p className="mt-2 text-sm text-muted-foreground">Age {student.age} · {student.parentName}</p>{!parent && <div className="mt-3 flex flex-wrap gap-3"><Action secondary onClick={() => setDialog('edit')}><Pencil className="size-3" />Edit profile / photo</Action><Action secondary onClick={() => setDialog('enrolment')}>Edit enrolment</Action></div>}</div>{!parent && <div className="flex flex-wrap gap-2"><LinkAction secondary href={`/student/login?email=${encodeURIComponent(student.parentEmail)}`}>Parent view<ArrowUpRight className="size-4" /></LinkAction><Action disabled={!classes.length} onClick={() => setDialog('video')}><Plus className="size-4" />Add video</Action><LinkAction href={`/students/${student.id}/report`}>Student Feedback</LinkAction></div>}</div>
    <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      { label: 'Credits left', value: student.credits, note: 'Present / Absent use 1 credit', icon: Coins },
      { label: 'Module progress', value: `${completed}/${totalModules}`, note: 'Milestones completed', icon: BookOpen },
      { label: 'Sessions attended', value: attended, note: `${sessions.length} sessions recorded`, icon: CheckCircle2 },
      { label: 'Video documentation', value: videos.length, note: 'Moments worth keeping', icon: Video },
    ].map(({ label, value, note, icon: Icon }) => <Panel key={label} className="p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-4 shrink-0 text-primary" /></div><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{note}</p></Panel>)}</div>
    <div className="mb-6 flex gap-1 overflow-x-auto border-b print:hidden">{[
      ['overview', 'Learning Journey'], ['videos', 'Video documentation'], ['feedback', 'Feedback reports'], ['certificates', 'Certificates'], ['credits', 'Credits & attendance'],
    ].map(([id, label]) => <motion.button whileHover={{ backgroundColor: 'var(--secondary)' }} whileTap={{ scale: .96 }} key={id} onClick={() => setTab(id)} className={cn('relative min-h-12 shrink-0 px-4 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary', tab === id ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground')}>{label}{tab === id && <motion.span aria-hidden layoutId="student-tab-indicator" className="pointer-events-none absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />}</motion.button>)}</div>

    <PageTransition pageKey={tab}><div role="tabpanel">{tab === 'overview' && <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="space-y-6"><IndividualJourney student={student} parent={parent} />
    <Panel title="Latest video moment" action={!parent && <Action secondary onClick={() => setDialog('video')}><Plus className="size-4" />Add video</Action>}>{videos[0] ? <VideoCard video={videos[0]} /> : <Empty title="Their story is just beginning" description="Add a session video to document their next breakthrough." />}</Panel></div>
    <div className="space-y-6"><Panel title="Package balance" className="border-primary/20 bg-primary/5"><div className="flex items-baseline gap-2"><p className="text-5xl font-semibold tracking-tight text-primary">{student.credits}</p><span className="text-sm text-muted-foreground">credits remaining</span></div><p className="my-4 text-xs leading-6 text-muted-foreground">Present and Absent use one credit. Leave and unmarked do not use credits.</p>{student.credits <= 2 && <p className="mb-4 text-xs text-destructive">Your package is running low.</p>}{!parent && <Action secondary onClick={() => setDialog('credits')}><Plus className="size-4" />Top up credits</Action>}</Panel>
    <Panel title="Teacher’s latest feedback" action={<MessageSquare className="size-5 text-primary" />}>{feedback[0] ? <FeedbackCard feedback={feedback[0]} edit={!parent ? () => openFeedback(feedback[0]) : undefined} /> : <Empty title="Feedback coming soon" description="Teacher notes will appear here. Formal feedback is issued every 12 attended classes." />}{!parent && <Action secondary className="mt-4 w-full" onClick={() => openFeedback()}><Plus className="size-4" />Write teacher note</Action>}</Panel>
    <StudentReports student={student} parent={parent} /></div></div>}

    {tab === 'videos' && <><Heading title="Learning in motion." description={moduleFilter ? `Class documentation for ${moduleFilter}` : "Projects, experiments, and proud little moments from class."} action={!parent && <Action onClick={() => setDialog('video')}><Plus className="size-4" />Add video documentation</Action>} /><div className="grid gap-5 md:grid-cols-2">{videos.map(video => <Panel key={video.id}><VideoCard video={video} /></Panel>)}</div>{!videos.length && <Empty title="No videos yet" description="Upload a video or paste a Drive, YouTube, or video file link." />}</>}
    {tab === 'feedback' && <div className="space-y-6"><StudentReports student={student} parent={parent} /><Panel title="Additional teacher notes" action={!parent && <Action secondary onClick={() => openFeedback()}>Write teacher note</Action>}><div className="grid gap-5 md:grid-cols-2">{feedback.map(item => <FeedbackCard key={item.id} feedback={item} edit={!parent ? () => openFeedback(item) : undefined} />)}</div></Panel></div>}
    {tab === 'certificates' && <StudentCertificates student={student} parent={parent} />}
    {tab === 'credits' && <Panel title="Enrolment history" action={!parent && <Action secondary onClick={() => setDialog('enrolment')}>Edit enrolment</Action>}><div className="grid gap-3">{classes.map(cls => <p key={cls.id} className="text-sm">{cls.centerId} · {cls.code} · {cls.name}</p>)}{student.enrollmentHistory?.map((item,i) => <p key={i} className="text-xs text-muted-foreground">{dateLabel(item.date)} · {item.action} · {data.classes.find(c => c.id === item.classId)?.code}</p>)}</div></Panel>}
    {!parent && tab === 'credits' && <DailyAttendance studentId={student.id} />}
    {tab === 'credits' && <div className="grid gap-6 lg:grid-cols-2"><Panel title="Credit history" subtitle="A clear record of each top-up and attended session" action={!parent && <Action secondary onClick={() => setDialog('credits')}><Plus className="size-4" />Top up</Action>}><div className="divide-y">{[...student.creditHistory].reverse().map(entry => <div key={entry.id} className="flex items-start gap-4 py-4"><Coins className="mt-1 size-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm">{entry.reason}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(entry.date)}</p></div><span className={cn('text-sm font-semibold', entry.amount > 0 ? 'text-primary' : 'text-muted-foreground')}>{entry.amount > 0 ? '+' : ''}{entry.amount}</span></div>)}</div></Panel><Panel title="Attendance history" subtitle="Present, absent, and the notes that go with it">{sessions.length ? <div className="divide-y">{[...sessions].sort((a, b) => b.date.localeCompare(a.date)).map(session => <div key={session.id} className="py-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{data.classes.find(c => c.id === session.classId)?.name}</p><Pill tone={session.attendance[student.id] === 'present' ? 'good' : 'default'}>{attendanceLabel(session.attendance[student.id])}</Pill></div><p className="mt-1 text-xs text-muted-foreground">{dateLabel(session.date)} · {session.time}</p>{!parent && session.notes && <p className="mt-3 text-sm leading-6 text-muted-foreground">{session.notes}</p>}</div>)}</div> : <Empty title="No sessions recorded yet" description="Attendance appears here as your teacher logs sessions." />}</Panel></div>}

    </div></PageTransition>
    <Modal open={dialog === 'video'} close={() => setDialog(null)} title="Add video documentation" description="Keep a record of a project, a session, or a proud moment.">{dialog === 'video' && <VideoForm student={student} close={() => setDialog(null)} />}</Modal>
    <Modal open={dialog === 'feedback'} close={() => setDialog(null)} title={editingFeedback ? 'Edit teacher note' : 'Teacher note'} description="Celebrate the progress. Give a clear next step.">{dialog === 'feedback' && <FeedbackForm student={student} existing={editingFeedback} close={() => setDialog(null)} />}</Modal>
    <Modal open={dialog === 'credits'} close={() => setDialog(null)} title="Top up credits" description={`Add a new session package for ${student.name}.`}>{dialog === 'credits' && <CreditsForm student={student} close={() => setDialog(null)} />}</Modal>
    <Modal open={dialog === 'enrolment'} close={() => setDialog(null)} title="Student & enrolment" description="Manage this learner’s details and classes.">{dialog === 'enrolment' && <StudentEditor existing={student} close={() => setDialog(null)} />}</Modal>
    <Modal open={dialog === 'edit'} close={() => setDialog(null)} title="Edit student profile" description="Keep student and parent details up to date.">{dialog === 'edit' && <ProfileForm student={student} close={() => setDialog(null)} />}</Modal>
  </>
}

function VideoCard({ video }: { video: MockVideo }) {
  const card = useRef<HTMLElement>(null)
  const inView = useInView(card, { once: true, margin: '200px' })
  const [localUrl, setLocalUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!video.fileId || !inView) return
    let disposed = false
    let created = ''
    readMockVideo(video.fileId).then(blob => {
      if (disposed) return
      if (!blob) { setError('This uploaded video is no longer in this browser.'); return }
      created = URL.createObjectURL(blob)
      setLocalUrl(created)
    }).catch(() => { if (!disposed) setError('Could not load this local video.') })
    return () => { disposed = true; if (created) URL.revokeObjectURL(created) }
  }, [video.fileId, inView])
  const source = video.fileId ? localUrl : video.url
  const embed = getVideoEmbed(video.url)
  return <article ref={card}><div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-background">{!inView ? <div className="nexus-skeleton h-full w-full" role="status" aria-label="Loading video" /> : error ? <p className="p-5 text-center text-xs text-muted-foreground">{error}</p> : embed ? <iframe loading="lazy" src={embed} title={video.title} className="h-full w-full" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen /> : source ? <video controls preload="metadata" src={source} className="h-full w-full" onError={() => setError('Preview unavailable. Open the original video link below.')} /> : <Play className="size-8 text-primary" />}</div><div className="flex flex-wrap items-center gap-2"><Pill>{video.module || 'Session documentation'}</Pill><span className="text-xs text-muted-foreground">{dateLabel(video.date)}</span></div><h3 className="mt-3 text-base font-semibold">{video.title}</h3>{video.notes && <p className="mt-2 text-sm leading-6 text-muted-foreground">{video.notes}</p>}{video.url && <Link href={video.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary">Open original video<ArrowUpRight className="size-3" /></Link>}</article>
}

function getVideoEmbed(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    if (url.hostname === 'drive.google.com') {
      const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id')
      if (id && /^[\w-]+$/.test(id)) return `https://drive.google.com/file/d/${id}/preview`
    }
    if (['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') ?? url.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1]
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
    }
  } catch { /* Local uploads have no external URL. */ }
  return null
}

function VideoForm({ student, close }: { student: MockStudent; close: () => void }) {
  const { data, update } = useMock()
  const saveLock = useRef(false)
  const [classId, setClassId] = useState(student.classIds[0])
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const cls = data.classes.find(c => c.id === classId)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveLock.current) return
    setError('')
    const fields = new FormData(event.currentTarget)
    const url = String(fields.get('url') ?? '').trim()
    if (!file && !url) { setError('Choose a video file or paste a video link.'); return }
    if (url && !file) {
      try { if (new URL(url).protocol !== 'https:') throw new Error() } catch { setError('Use a valid HTTPS video link.'); return }
    }
    if (file && (!file.type.startsWith('video/') || file.size > 100 * 1024 * 1024)) { setError('Choose a video file under 100 MB.'); return }
    saveLock.current = true
    setSaving(true)
    const id = mockId()
    try {
      if (file) await saveMockVideo(id, file)
      const video: MockVideo = { id, studentId: student.id, classId, title: String(fields.get('title')).trim(), date: String(fields.get('date')), module: String(fields.get('module') ?? ''), notes: String(fields.get('notes') ?? '').trim(), url: file ? '' : url, ...(file ? { fileId: id } : {}) }
      if (update(current => ({ ...current, videos: [video, ...current.videos] }))) { toast.success('Video documentation saved'); close() }
    } catch { setError('Could not save the video. Try a smaller file or use a video link.') } finally { saveLock.current = false; setSaving(false) }
  }
  return <form onSubmit={submit} className="grid gap-4"><Field title="Video title"><input name="title" required maxLength={150} placeholder="e.g. Aiden’s first sensor-powered rover" className={inputStyle} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field title="Program"><select className={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{data.classes.filter(c => student.classIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field title="Session date"><input type="date" name="date" required defaultValue={mockToday()} className={inputStyle} /></Field></div><Field title="Module"><select name="module" key={classId} className={inputStyle}><option value="">General session documentation</option>{[...new Set([...(data.learnerModules ?? []).filter(p => p.studentId === student.id && p.classId === classId).map(p => p.title), ...(cls?.modules ?? [])])].map(m => <option key={m}>{m}</option>)}</select></Field><Field title="Video link"><input name="url" type="url" placeholder="https://drive.google.com/file/d/…" className={inputStyle} disabled={!!file} /></Field><Field title="Or upload a video"><input aria-label="Upload video file" type="file" accept="video/*" className={`${inputStyle} file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-foreground`} onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field><p className="-mt-2 text-xs text-muted-foreground">Demo uploads: saved only in this browser (IndexedDB), up to 100 MB. Nothing is uploaded to Google Drive or Supabase. To use Drive today, upload there and paste its link. Private parent playback still needs verification.</p><Field title="Teacher’s notes"><textarea name="notes" rows={3} className={inputStyle} placeholder="What did they build or discover?" /></Field>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<Action type="submit" disabled={saving}>{saving ? 'Saving video…' : 'Save video documentation'}</Action></form>
}

function FeedbackCard({ feedback, edit }: { feedback: MockFeedback; edit?: () => void }) {
  return <article><div className="flex items-center justify-between gap-2"><Pill tone="good">{feedback.rating}</Pill>{edit && <button onClick={edit} className="flex min-h-11 items-center gap-1 text-xs text-primary"><Pencil className="size-3" />Edit feedback</button>}</div><h3 className="mt-3 font-semibold">{feedback.module}</h3><p className="mt-1 text-xs text-muted-foreground">{feedback.teacher} · {dateLabel(feedback.date)} · {feedback.published ? 'Shared with parent' : 'Teacher draft'}</p><p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-primary">What went well</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{feedback.strengths}</p><p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next steps</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{feedback.nextSteps}</p></article>
}

function FeedbackForm({ student, existing, close }: { student: MockStudent; existing?: MockFeedback; close: () => void }) {
  const { data, update } = useMock()
  const [classId, setClassId] = useState(existing?.classId ?? student.classIds[0])
  return <form className="grid gap-4" onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const feedback: MockFeedback = { id: existing?.id ?? mockId(), studentId: student.id, classId, module: String(fields.get('module')), teacher: 'Gio', date: mockToday(), strengths: String(fields.get('strengths')).trim(), nextSteps: String(fields.get('nextSteps')).trim(), rating: String(fields.get('rating')), published: fields.get('published') === 'on' }
    if (!feedback.strengths || !feedback.nextSteps) { toast.error('Write what went well and a next step.'); return }
    if (update(current => ({ ...current, feedback: [feedback, ...current.feedback.filter(f => f.id !== feedback.id)] }))) { toast.success(feedback.published ? 'Feedback shared with parent' : 'Feedback draft saved'); close() }
  }}><Field title="Program"><select className={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{data.classes.filter(c => student.classIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field title="Module"><select name="module" key={classId} defaultValue={existing?.classId === classId ? existing.module : undefined} className={inputStyle}>{data.classes.find(c => c.id === classId)?.modules.map(m => <option key={m}>{m}</option>)}</select></Field><Field title="Confidence level"><select name="rating" defaultValue={existing?.rating ?? 'Growing'} className={inputStyle}><option>Getting started</option><option>Growing</option><option>Confident</option><option>Independent</option></select></Field><Field title="What went well"><textarea name="strengths" required rows={4} defaultValue={existing?.strengths} className={inputStyle} placeholder="Specific achievements, skills, and effort…" /></Field><Field title="Next steps"><textarea name="nextSteps" required rows={3} defaultValue={existing?.nextSteps} className={inputStyle} placeholder="What will you work on together next?" /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={existing?.published ?? true} className="size-4 accent-primary" />Share with parent</label><Action type="submit">Save teacher note</Action></form>
}

function CreditsForm({ student, close }: { student: MockStudent; close: () => void }) {
  const { update } = useMock()
  return <form className="grid gap-4" onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const amount = Number(fields.get('amount'))
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) return
    if (update(current => ({ ...current, students: current.students.map(s => s.id === student.id ? { ...s, credits: s.credits + amount, creditHistory: [...s.creditHistory, { id: mockId(), date: mockToday(), amount, reason: String(fields.get('reason')).trim() || 'Session package top-up' }] } : s) }))) { toast.success(`${amount} credits added`); close() }
  }}><Field title="Credits to add"><input name="amount" type="number" required min="1" max="100" step="1" defaultValue="8" className={inputStyle} /></Field><Field title="Package note"><input name="reason" placeholder="e.g. 8-session robotics package" className={inputStyle} /></Field><p className="text-xs text-muted-foreground">Current balance: {student.credits} credits. This demo records the package; it does not process a payment.</p><Action type="submit">Add credits</Action></form>
}

function ProfilePhoto({student}:{student:MockStudent}) {
 const [url,setUrl]=useState('')
 useEffect(()=>{
  if(!student.photo)return
  let disposed=false,source=''
  readMockVideo(student.photo).then(blob=>{if(blob&&!disposed){source=URL.createObjectURL(blob);setUrl(source)}}).catch(()=>{})
  return ()=>{disposed=true;if(source)URL.revokeObjectURL(source)}
 },[student.photo])
 return url?<Image unoptimized src={url} alt={`${student.name}'s profile photo`} width={240} height={240} className="size-36 rounded-2xl object-cover sm:size-52"/>:<div className="flex size-36 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-4xl font-semibold text-primary sm:size-52">{student.name.split(' ').map(p => p[0]).slice(0,2).join('')}</div>
}

function ProfileForm({ student, close }: { student: MockStudent; close: () => void }) {
 const {update}=useMock()
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 return <form className="grid gap-4" onSubmit={async event=>{
  event.preventDefault();const fields=new FormData(event.currentTarget)
  const name=String(fields.get('name')).trim(),parentName=String(fields.get('parentName')).trim()
  if(!name||!parentName){setError('Student and parent names cannot be blank.');return}
  setBusy(true);setError('')
  try {
   let photo=student.photo
   if(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Choose a JPEG, PNG, or WebP photo under 5 MB.')
    photo=mockId();await saveMockVideo(photo,file)
   }
   if(update(current=>({...current,students:current.students.map(s=>s.id===student.id?{...s,name,parentName,age:Number(fields.get('age')),parentEmail:String(fields.get('email')).trim(),photo}:s)}))){toast.success('Profile updated');close()}
  }catch(e){setError(e instanceof Error?e.message:'Could not save profile.')}
  finally{setBusy(false)}
 }}><Field title="Profile photo"><input type="file" accept="image/jpeg,image/png,image/webp" className={inputStyle} onChange={e=>setFile(e.target.files?.[0]??null)}/></Field><p className="text-xs text-muted-foreground">Up to 5 MB. The demo photo stays in this browser.</p><Field title="Student name"><input name="name" defaultValue={student.name} required className={inputStyle}/></Field><Field title="Age"><input name="age" type="number" min="3" max="25" required defaultValue={student.age} className={inputStyle}/></Field><Field title="Parent name"><input name="parentName" required defaultValue={student.parentName} className={inputStyle}/></Field><Field title="Parent email"><input name="email" type="email" required defaultValue={student.parentEmail} className={inputStyle}/></Field>{error&&<p role="alert" className="text-destructive">{error}</p>}<Action type="submit" disabled={busy}>{busy?'Saving...':'Save profile'}</Action></form>
}
