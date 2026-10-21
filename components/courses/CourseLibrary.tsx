'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/utils/fetchJson'
import type { Tables } from '@/types/database.types'

type Course = Tables<'courses'>
type ClassItem = { id: string; name: string }
type LinkItem = { class_id: string; course_id: string }

export function CourseLibrary({ initial, classes, links, initiallyCreating=false }: { initial:Course[]; classes:ClassItem[]; links:LinkItem[]; initiallyCreating?:boolean }) {
  const { locale }=useLanguage();const id=locale==='id';const router=useRouter()
  const [search,setSearch]=useState('');const [create,setCreate]=useState(initiallyCreating);const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  const assigned=new Map(links.map(link=>{const cls=classes.find(item=>item.id===link.class_id);return cls?[link.course_id,cls.name] as const:null}).filter((item):item is readonly [string,string]=>item!==null))
  const visible=useMemo(()=>initial.filter(item=>`${item.title} ${item.category} ${item.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())),[initial,search])
  async function createCourse(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError('');setBusy(true);const fields=new FormData(event.currentTarget)
    const body={id:crypto.randomUUID(),requestId:crypto.randomUUID(),expectedRevision:0,content:{title:String(fields.get('title')).trim(),lesson_count:Number(fields.get('lesson_count')),category:String(fields.get('category')).trim(),age_range:String(fields.get('ages')).trim(),level:String(fields.get('level')).trim(),description:String(fields.get('description')).trim(),prerequisites:String(fields.get('prerequisites')).trim(),archived:false}}
    try{const result=await fetchJson<{id:string}>('/api/courses',{method:'POST',body:JSON.stringify(body)});router.push(`/courses/${result.id}`);router.refresh()}catch(e){setError(e instanceof Error?e.message:'Unable to create course.')}finally{setBusy(false)}}
  return <div className="space-y-5">
    <label className="grid max-w-xl gap-2 text-sm font-medium">{id?'Cari kursus':'Search courses'}<Input className="min-h-11 text-base md:text-base" value={search} onChange={event=>setSearch(event.target.value)} placeholder={id?'Nama, kategori, atau deskripsi':'Title, category, or description'} /></label>
    {create&&<form onSubmit={createCourse} className="grid min-w-0 gap-4 rounded-2xl border border-primary/30 bg-card p-4 sm:p-6"><div><h2 className="text-lg font-semibold">{id?'Kursus baru':'New course'}</h2><p className="mt-1 text-sm text-muted-foreground">{id?'Pelajaran dapat ditambahkan setelah kursus dibuat.':'Add reusable lessons after creating the course.'}</p></div>
      <Field label={id?'Judul':'Course title'} name="title" required maxLength={200}/><Field label={id?'Jumlah pelajaran':'Number of lessons'} name="lesson_count" type="number" min={0} max={10000} defaultValue="24" required/><div className="grid gap-4 sm:grid-cols-2"><Field label={id?'Kategori':'Category'} name="category" maxLength={100}/><Field label={id?'Kelompok usia':'Age range'} name="ages" maxLength={100}/><Field label={id?'Tingkat':'Level'} name="level" maxLength={100}/></div>
      <TextField label={id?'Deskripsi':'Description'} name="description"/><TextField label={id?'Prasyarat':'Prerequisites'} name="prerequisites"/>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-3"><Button className="min-h-11" disabled={busy}>{busy?(id?'Menyimpan…':'Saving…'):(id?'Buat kursus':'Create course')}</Button><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={()=>setCreate(false)}>{id?'Batal':'Cancel'}</Button></div></form>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map(course=><Link key={course.id} href={`/courses/${course.id}`} className="group flex min-w-0 flex-col rounded-2xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_12%,transparent)] focus-visible:outline-2 focus-visible:outline-ring"><div className="flex flex-wrap gap-2">{course.category&&<Pill>{course.category}</Pill>}{course.level&&<Pill>{course.level}</Pill>}{course.archived_at&&<Pill>{id?'Diarsipkan':'Archived'}</Pill>}</div><h2 className="mt-4 break-words text-lg font-semibold group-hover:text-primary">{course.title}</h2><p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{course.description|| (id?'Belum ada deskripsi.':'No description yet.')}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground"><span>{course.age_range|| (id?'Semua usia':'All ages')} · {course.lesson_count} {id?'pelajaran':'lessons'}</span><span>{assigned.get(course.id)?`${id?'Ditautkan ke':'Linked to'} ${assigned.get(course.id)}`:(id?'Belum ditautkan':'Not linked')}</span></div></Link>)}</div>
    {!visible.length&&!create&&<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{search?(id?'Tidak ada kursus yang cocok.':'No courses match your search.'):(id?'Belum ada kursus.':'No courses yet.')}</div>}
    {initial.length>=101&&<p className="text-xs text-muted-foreground">{id?'Menampilkan 100 kursus pertama. Gunakan pencarian untuk mempersempit daftar.':'Showing the first 100 courses. Use search to narrow the list.'}</p>}
  </div>
}

export function Field({label,name,required=false,maxLength,min,max:maximum,type='text',defaultValue}: {label:string;name:string;required?:boolean;maxLength?:number;min?:number;max?:number;type?:string;defaultValue?:string}) {return <label className="grid min-w-0 gap-2 text-sm font-medium">{label}<Input name={name} type={type} required={required} maxLength={maxLength} min={min} max={maximum} defaultValue={defaultValue} className="min-h-11 text-base md:text-base"/></label>}
export function TextField({label,name,required=false,rows=3,defaultValue}: {label:string;name:string;required?:boolean;rows?:number;defaultValue?:string}) {return <label className="grid min-w-0 gap-2 text-sm font-medium">{label}<Textarea name={name} required={required} rows={rows} defaultValue={defaultValue} className="text-base md:text-base"/></label>}
export function Pill({children}:{children:React.ReactNode}) {return <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">{children}</span>}
