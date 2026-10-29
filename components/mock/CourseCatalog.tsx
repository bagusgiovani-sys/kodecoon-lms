'use client'
import { useContext, useState } from 'react'
import { ArrowUpRight, BookOpen, Layers3, Search } from 'lucide-react'
import { createLearningData } from '@/lib/mock/learning'
import { courseSubject, courseUsage } from '@/lib/mock/courseUsage'
import { CenterScope, useMock } from './MockProvider'
import { useDebouncedValue } from './NexusExperience'
import { Empty, Field, Heading, inputStyle, LinkAction, Panel, Pill } from './MockUI'

export function CourseCatalog({ library = false }: { library?: boolean }) {
  const { data } = useMock()
  const centerId = useContext(CenterScope)
  const learning = data.learning ?? createLearningData()
  const { counts, unlinked } = courseUsage(data, learning.courses)
  const [search, setSearch] = useState('')
  const query = useDebouncedValue(search).trim().toLowerCase()
  const [category, setCategory] = useState('All')
  const active = learning.courses.filter(c => (counts.get(c.id) ?? 0) > 0)
  const courses = (library ? learning.courses : active)
    .filter(c => (category === 'All' || courseSubject(c.category) === category) && `${c.title} ${c.description}`.toLowerCase().includes(query))
    .sort((a,b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.title.localeCompare(b.title))
  const center = data.centers?.find(c => c.id === centerId)?.name ?? 'Academy'
  return <><Heading eyebrow={library ? 'Academy-wide curriculum' : `${center} · Learning activity`}
    title={library ? 'Course library' : `${center} courses`}
    description={library ? 'Every available course, including courses with no learners in this center.' : 'Courses currently taken here, ordered by the number of active learners.'}
    action={<LinkAction secondary href={library ? '/courses' : '/courses/library'}><BookOpen className="size-4" />{library ? 'Back to center courses' : 'Open course library'}</LinkAction>} />
    <div className="mb-6 flex flex-wrap gap-3"><Pill>{active.length} courses taken in {center}</Pill><Pill>{learning.courses.length} available in the library</Pill></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_220px]"><Field title="Search courses"><div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input className={`${inputStyle} pl-10`} aria-label="Search courses" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a course…" /></div></Field><Field title="Subject"><select className={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>{['All','Robotics','Coding','Competition','Holiday Camp'].map(item => <option key={item}>{item}</option>)}</select></Field></div>
    {!!unlinked && !library && <Panel className="mb-6"><p className="text-sm text-muted-foreground">{unlinked} active learning records are not linked to a library course yet. Open a learner’s Learning Journey, choose Edit learning, and select a Library course to include them in these counts.</p></Panel>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map(course => <Panel key={course.id} className="student-card flex flex-col"><div className="mb-5 flex items-center justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Layers3 /></span><Pill tone="good">{courseSubject(course.category)}</Pill></div><h2 className="text-xl font-semibold">{course.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{course.description}</p><div className="my-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-3xl font-semibold text-primary" data-course-count={course.id}>{counts.get(course.id) ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">active learners in {center}</p></div><div className="mb-5 flex flex-wrap gap-2"><Pill>Ages {course.ages}</Pill><Pill>{course.level}</Pill><Pill>{course.lessons.length} lessons</Pill></div><LinkAction href={`/courses/${course.id}`}>Explore course<ArrowUpRight className="size-4" /></LinkAction></Panel>)}</div>
    {!courses.length && <Empty title={active.length || library ? 'No matching courses' : 'No courses linked yet'} description={active.length || library ? 'Try another search or subject.' : 'Browse the library, then link each learner’s current module to its course from their Learning Journey.'} />}
  </>
}
