'use client'
import { DemoLink as Link } from './DemoLink'
import { useState } from 'react'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import { toast } from 'sonner'
import { createLearningData, type LearningData, type LearningCourse, type LearningLesson } from '@/lib/mock/learning'
import { CourseCatalog } from './CourseCatalog'
import { courseSubject } from '@/lib/mock/courseUsage'
import { useMock } from './MockProvider'
import { Action, Back, Empty, Field, Heading, inputStyle, Modal, Panel, Pill } from './MockUI'

function useLearning() {
  const { data, update } = useMock()
  const learning = data.learning ?? createLearningData()
  function save(change: (current: LearningData) => LearningData) {
    return update(current => ({ ...current, learning: change(current.learning ?? createLearningData()) }))
  }
  return { data, learning, save }
}

export function LearningScreen({ path }: { path: string }) {
  const { learning } = useLearning()
  const parts = path.split('/').filter(Boolean)
  if (path === '/courses') return <CourseCatalog />
  if (path === '/courses/library') return <CourseCatalog library />
  const course = learning.courses.find(item => item.id === parts[1])
  if (parts[0] === 'courses' && course) {
    if (parts.length === 2) return <CourseDetail course={course} />
    const lesson = course.lessons.find(item => item.id === parts[3])
    if (parts[2] === 'lessons' && parts.length === 4 && lesson) return <LessonWorkspace course={course} lesson={lesson} />
  }
  return <><Back href="/courses" text="Course library" /><Empty title="Learning page not found" description="Choose a course or lesson from the library." /></>
}

function CourseDetail({ course }: { course: LearningCourse }) {
  const { data, learning, save } = useLearning()
  const [classId, setClassId] = useState('')
  const assigned = data.classes.filter(cls => learning.classCourses[cls.id] === course.id)
  return <><Back href="/courses" text="Course library" /><Heading eyebrow={courseSubject(course.category)} title={course.title} description={course.description} /><div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"><Panel title="Your lesson pathway" subtitle={course.lessons.length ? `${course.lessons.length} guided classroom projects` : 'Lesson files will be linked here'}>{course.lessons.length ? <div className="grid gap-4">{course.lessons.map((lesson, index) => <Link key={lesson.id} href={`/courses/${course.id}/lessons/${lesson.id}`} className="flex min-w-0 items-start gap-4 rounded-xl border p-4 hover:border-primary/50"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{index + 1}</span><div className="min-w-0 flex-1"><h3 className="font-semibold">{lesson.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.objective}</p><p className="mt-3 flex items-center gap-2 text-xs text-primary"><Clock3 className="size-3" />{lesson.minutes} minutes</p></div><ArrowUpRight className="size-4 shrink-0 text-primary" /></Link>)}</div> : <p className="text-sm leading-6 text-muted-foreground">The module title is ready. Lesson details and Google Drive PDF or PowerPoint links will be added once provided.</p>}</Panel><div className="space-y-6"><Panel title="Ready for this journey?"><div className="mb-4 flex flex-wrap gap-2"><Pill>Ages {course.ages}</Pill><Pill>{course.level}</Pill></div><p className="text-sm leading-6 text-muted-foreground">{course.prerequisite}</p></Panel><Panel title="Assign to a class" subtitle="Connect this lesson collection to your teaching group."><form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (!data.classes.some(cls => cls.id === classId)) return; if (save(current => ({ ...current, classCourses: { ...current.classCourses, [classId]: course.id } }))) toast.success('Course assigned to class') }}><Field title="Class"><select required value={classId} onChange={event => setClassId(event.target.value)} className={inputStyle}><option value="">Choose a class</option>{data.classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}</select></Field>{classId && learning.classCourses[classId] && learning.classCourses[classId] !== course.id && <p className="text-sm text-muted-foreground">This replaces the class’s linked course. Existing attendance and individual module progress are kept.</p>}<Action type="submit" disabled={!classId}>Assign course</Action></form><div className="mt-5 grid gap-2">{assigned.map(cls => <Pill key={cls.id} tone="good">{cls.name}</Pill>)}</div>{!data.classes.length && <p className="mt-4 text-sm text-muted-foreground">Create a class from the overview first.</p>}</Panel></div></div></>
}

function LessonWorkspace({ course, lesson }: { course: LearningCourse; lesson: LearningLesson }) {
  const { save } = useLearning()
  const [editing, setEditing] = useState(false)
  return <><Back href={`/courses/${course.id}`} text={course.title} /><Heading eyebrow="Lesson workspace" title={lesson.title} description={lesson.objective} action={<Action secondary onClick={() => setEditing(true)}>Edit lesson</Action>} /><div className="mb-6 flex flex-wrap gap-3"><Pill tone="good">{courseSubject(course.category)}</Pill><Pill>{lesson.minutes} minutes</Pill><Pill>Teacher guided</Pill></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"><Panel title="Build it. Test it. Explain it."><ol className="grid gap-5">{lesson.steps.split('\n').filter(Boolean).map((step, index) => <li key={index} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">{index + 1}</span><p className="pt-1 text-sm leading-7">{step}</p></li>)}</ol></Panel><div className="space-y-6"><Panel title="Prepare your workspace"><p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{lesson.materials}</p></Panel><Panel title="Evidence of learning"><p className="mb-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">{lesson.evidence}</p><p className="text-xs text-muted-foreground">Record feedback and photos or videos after class from the student’s Documentation page.</p></Panel></div></div>
    <Modal open={editing} close={() => setEditing(false)} title="Edit lesson" description="Updates apply to every class using this course.">{editing && <form className="grid gap-4" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const changes = { objective: String(form.get('objective')).trim(), materials: String(form.get('materials')).trim(), steps: String(form.get('steps')).trim(), evidence: String(form.get('evidence')).trim() }; if (Object.values(changes).some(value => !value)) return; if (save(current => ({ ...current, courses: current.courses.map(item => item.id === course.id ? { ...item, lessons: item.lessons.map(row => row.id === lesson.id ? { ...row, ...changes } : row) } : item) }))) { setEditing(false); toast.success('Lesson saved') } }}>{([['objective', 'Learning objective'], ['materials', 'Materials'], ['steps', 'Activity steps (one per line)'], ['evidence', 'Evidence of learning']] as const).map(([name, title]) => <Field key={name} title={title}><textarea required name={name} defaultValue={lesson[name]} rows={name === 'steps' ? 6 : 3} className={inputStyle} /></Field>)}<Action type="submit">Save lesson</Action></form>}</Modal>
    </>
}
