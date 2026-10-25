'use client'
export function FeedbackStudentSelector({students,selected}:{students:Array<{id:string;name:string}>;selected:string}) {
 return <label className="mb-5 grid max-w-xl gap-2 text-sm font-medium">Student
  <select className="min-h-11 w-full rounded-lg border bg-background px-3 text-base" value={selected} onChange={event=>{window.location.assign(`/students/${event.target.value}/report`)}}>
   {students.map(student=><option key={student.id} value={student.id}>{student.name}</option>)}
  </select>
 </label>
}
