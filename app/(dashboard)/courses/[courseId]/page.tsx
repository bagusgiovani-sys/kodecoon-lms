import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireStaffPage } from '@/lib/utils/pageAuth'
import { CourseWorkspace } from '@/components/courses/CourseWorkspace'

export default async function CoursePage({params}:{params:Promise<{courseId:string}>}) {
  const {supabase,userId,role}=await requireStaffPage();if(process.env.LEARNING_UI_ENABLED!=='true')redirect('/dashboard');const {courseId}=await params
  const [{data:course},{data:lessons},{data:classes}]=await Promise.all([
    supabase.from('courses').select('*').eq('id',courseId).maybeSingle(),
    supabase.from('course_lessons').select('*').eq('course_id',courseId).order('sequence').limit(101),
    supabase.from('classes').select('id,name').order('name').limit(101),
  ])
  if(!course)notFound()
  const classIds=(classes??[]).map(item=>item.id)
  const {data:links}=classIds.length?await supabase.from('class_course_assignments').select('class_id,course_id').in('class_id',classIds).is('ended_at',null):{data:[]}
  return <div className="space-y-5"><Button variant="ghost" render={<Link href="/courses"/>} className="min-h-11"><ChevronLeft/>Course library</Button><CourseWorkspace actorId={userId} role={role} course={course} lessons={lessons??[]} classes={classes??[]} links={links??[]}/></div>
}
