'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AttendanceOptions } from '@/components/session/AttendanceOptions'
import { attendanceLabel } from '@/lib/attendance'
import { todayIsoDate } from '@/lib/utils/formatDate'
import { fetchJson } from '@/lib/utils/fetchJson'
import { Button } from '@/components/ui/button'
type Member={studentId:string;start:string;end:string|null}
type Slot={id:string;classId:string;weekday:number;time:string;start:string;members:Member[]}
type Session={id?:string;slotId?:string;classId:string;date:string;time:string;revision:number;attendance:Record<string,string>}
type Workspace={centers:{id:string;name:string}[];classes:{id:string;name:string;centerId:string}[];students:{id:string;name:string;credits:number|null}[];enrollments:{classId:string;studentId:string}[];slots:Slot[];sessions:Session[]}
const input='min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-primary'
const active=(m:Member,date:string)=>m.start<=date&&(!m.end||m.end>date)
export function DailyAttendancePanel({actorId,studentId}:{actorId:string;studentId?:string}) {
 const [date,setDate]=useState(todayIsoDate()),[center,setCenter]=useState(''),[manage,setManage]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const client=useQueryClient()
 const query=useQuery({queryKey:['daily-attendance',actorId,date],queryFn:()=>fetchJson<Workspace>(`/api/attendance?date=${date}`)})
 async function change(action:string,data:Record<string,string|number|boolean>) {
  if(busy)return
  setBusy(true);setError('')
  const storageKey=`kodehub-attendance-pending:${actorId}`,signature=JSON.stringify({action,data})
  try {
   if(action==='mark') {
    const saved=sessionStorage.getItem(storageKey),prior=saved?JSON.parse(saved):null
    const pending=prior?.signature===signature?prior:{signature,id:crypto.randomUUID()}
    sessionStorage.setItem(storageKey,JSON.stringify(pending));data={...data,requestId:pending.id}
   }
   await fetchJson('/api/attendance',{method:'POST',body:JSON.stringify({action,data})})
   sessionStorage.removeItem(storageKey)
   await client.invalidateQueries()
  } catch(e) {setError(e instanceof Error?e.message:'Could not save. Retry the same change or reload.')}
  finally {setBusy(false)}
 }
 const data=query.data,selectedCenter=center||data?.centers[0]?.id
 const classes=data?.classes.filter(c=>c.centerId===selectedCenter)??[],slots=data?.slots.filter(s=>classes.some(c=>c.id===s.classId))??[]
 const weekday=new Date(`${date}T12:00:00Z`).getUTCDay()
 const sessions:Session[]=[...(data?.sessions??[]).map(s=>({...s})).filter(s=>classes.some(c=>c.id===s.classId))]
 for(const slot of slots) {
  if(slot.weekday!==weekday||slot.start>date||sessions.some(s=>s.slotId===slot.id))continue
  const matching=sessions.filter(s=>!s.slotId&&s.classId===slot.classId&&s.time?.slice(0,5)===slot.time.slice(0,5))
  if(matching.length===1)matching[0].slotId=slot.id
  else if(!matching.length)sessions.push({slotId:slot.id,classId:slot.classId,date,time:slot.time,revision:0,attendance:{}})
 }
 const rosterFor=(s:Session)=>{
  const slot=slots.find(x=>x.id===s.slotId)
  const ids=slot?slot.members.filter(m=>active(m,date)).map(m=>m.studentId):data?.enrollments.filter(e=>e.classId===s.classId).map(e=>e.studentId)??[]
  return data?.students.filter(student=>(ids.includes(student.id)||student.id in s.attendance)&&(!studentId||student.id===studentId))??[]
 }
 const visible=sessions.filter(s=>!studentId||rosterFor(s).length)
 return <section className="my-6 space-y-5" aria-label="Daily attendance">
  <div className="flex flex-wrap items-end gap-4"><label className="grid gap-2 text-sm">Attendance date<input className={input} type="date" value={date} disabled={busy} onChange={e=>{if(e.target.value){setDate(e.target.value);setError('')}}}/></label>
  {!studentId&&<Button variant="outline" onClick={()=>setManage(!manage)}>Manage weekly schedule</Button>}<Button variant="outline" disabled={busy} onClick={()=>void query.refetch()}>Reload roster</Button></div>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Centers">{data?.centers.map(c=><Button key={c.id} disabled={busy} variant={selectedCenter===c.id?'default':'outline'} aria-pressed={selectedCenter===c.id} onClick={()=>setCenter(c.id)}>{c.name}</Button>)}</div>
  <p className="text-sm text-muted-foreground">Attend / MIA: 1 credit. Izin / unmarked: no credit. Changes are shared with the student profile.</p>
  {(error||query.error)&&<p role="alert" className="text-destructive">{error||'Could not load attendance. Use Reload roster to retry.'}</p>}{query.isPending&&<p role="status">Loading roster…</p>}
  {manage&&data&&<section className="space-y-5 rounded-xl border bg-card p-4"><h2 className="font-semibold">Weekly slots and student enrollment</h2><p className="text-sm text-muted-foreground">Changes start on the date selected above. Removing a student from a slot preserves their class enrollment and past attendance.</p>
  <form className="grid gap-3 sm:grid-cols-3" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void change('create_slot',{id:crypto.randomUUID(),classId:String(f.get('classId')),weekday,time:String(f.get('time')),date})}}>
   <label className="grid gap-2">Class<select required name="classId" className={input}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="grid gap-2">Weekly time<input required type="time" name="time" defaultValue="15:00" className={input}/></label><Button type="submit" disabled={busy||!classes.length} className="self-end">Add slot for selected weekday</Button></form>
   {slots.map(slot=><div key={slot.id} className="rounded-lg border p-4"><h3 className="font-semibold">{classes.find(c=>c.id===slot.classId)?.name} · {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.weekday]} {slot.time.slice(0,5)}</h3><p className="text-xs text-muted-foreground">Starts {slot.start}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{data.students.map(student=>{
    const included=slot.members.some(m=>m.studentId===student.id&&active(m,date))
    return <label key={student.id} className="flex min-h-11 items-center gap-3"><input type="checkbox" disabled={busy||date<slot.start} checked={included} onChange={()=>void change('roster',{slotId:slot.id,studentId:student.id,date,included:!included})}/>{student.name}</label>
   })}</div></div>)}</section>}
   {visible.sort((a,b)=>(a.time??'').localeCompare(b.time??'')).map(session=><section key={session.id??session.slotId} className="rounded-xl border bg-card p-4 sm:p-6"><h2 className="mb-2 text-lg font-semibold">{session.time?.slice(0,5)||'Time not set'} · {classes.find(c=>c.id===session.classId)?.name}</h2>
    {!rosterFor(session).length&&<p className="text-muted-foreground">No students scheduled. Add learners in Manage weekly schedule.</p>}
    <div className="divide-y">{rosterFor(session).map(student=><div key={student.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><Link href={`/students/${student.id}`} className="font-semibold text-primary hover:underline">{student.name}</Link><p className="text-sm text-muted-foreground">{classes.find(c=>c.id===session.classId)?.name} · {student.credits === null ? 'Credits restricted' : `${student.credits} credits`}</p><p className="text-xs text-muted-foreground">{attendanceLabel(session.attendance[student.id]??'unmarked')}</p></div><AttendanceOptions disabled={busy} label={`Attendance for ${student.name}`} value={session.attendance[student.id]??'unmarked'} onChange={status=>void change('mark',{...(session.slotId?{slotId:session.slotId}:{sessionId:session.id!}),studentId:student.id,date,status,revision:session.revision})}/></div>)}</div></section>)}
   {data&&!visible.length&&<p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No sessions for this date. Choose another date or add a weekly slot.</p>}
 </section>
}
