import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { Button } from '@/components/ui/button'
import { CourseLibrary } from '@/components/courses/CourseLibrary'

export default async function CoursesPage({searchParams}:{searchParams:Promise<{new?:string;archived?:string}>}) {
  const { supabase } = await requireStaffPage()
  if (process.env.LEARNING_UI_ENABLED !== 'true') redirect('/dashboard')
  const params=await searchParams;const archived=params.archived==='true'
  const [{ data: courses }, { data: classes }] = await Promise.all([
    (archived?supabase.from('courses').select('*').not('archived_at','is',null):supabase.from('courses').select('*').is('archived_at',null)).order('title').limit(101),
    supabase.from('classes').select('id,name').order('name').limit(101),
  ])
  const courseIds=(courses??[]).map(item=>item.id)
  const {data:lessonRows}=courseIds.length?await supabase.from('course_lessons').select('course_id').in('course_id',courseIds).is('archived_at',null):{data:[]}
  const lessonCounts=new Map<string,number>()
  for(const lesson of lessonRows??[])lessonCounts.set(lesson.course_id,(lessonCounts.get(lesson.course_id)??0)+1)
  const classIds = (classes ?? []).map(item => item.id)
  const { data: links } = classIds.length ? await supabase.from('class_course_assignments')
    .select('class_id,course_id').in('class_id', classIds).is('ended_at', null) : { data: [] }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Learn · Build · Share</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{archived?'Archived courses':'Course library'}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Reusable lesson plans for the projects you teach. Class journey progress remains independent.</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" render={<Link href={archived?'/courses':'/courses?archived=true'} />} className="min-h-11">{archived?'Active courses':'Archived courses'}</Button>{!archived&&<Button render={<Link href="?new=course" />} className="min-h-11"><Plus />Create course</Button>}</div></header>
    <CourseLibrary initial={courses ?? []} classes={classes ?? []} links={links ?? []} lessonCounts={Object.fromEntries(lessonCounts)} initiallyCreating={params.new==='course'} />
  </div>
}
