'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/lib/supabase/browser'
import { fetchJson } from '@/lib/utils/fetchJson'
import { todayIsoDate } from '@/lib/utils/formatDate'

type Media={id:string;kind:string;description:string;date:string;url:string|null}
const input='min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-base'
export function StudentMediaPanel({studentId,actorId,staff=false}:{studentId:string;actorId:string;staff?:boolean}) {
 const [file,setFile]=useState<File|null>(null),[kind,setKind]=useState<'photo'|'video'>('photo'),[description,setDescription]=useState(''),[date,setDate]=useState(todayIsoDate()),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState<string|null>(null)
 const client=useQueryClient(),key=['student-media',actorId,studentId]
 const query=useQuery({queryKey:key,queryFn:()=>fetchJson<{media:Media[]}>(`/api/student-media?studentId=${studentId}`),refetchInterval:240000})
 async function finish(id:string) {
  await fetchJson('/api/student-media',{method:'POST',body:JSON.stringify({action:'finish',id})})
  setPending(null);setFile(null);setDescription('');await client.invalidateQueries({queryKey:key})
 }
 async function upload() {
  setBusy(true);setError('')
  try {
   if(pending){await finish(pending);return}
   if(!file)throw new Error('Choose a file first.')
   const allowed=kind==='photo'?['image/jpeg','image/png','image/webp']:['video/mp4','video/webm','video/quicktime']
   if(!allowed.includes(file.type)||file.size>(kind==='photo'?5:100)*1024*1024)throw new Error('Choose a supported file within the size limit.')
   const result=await fetchJson<{id:string;path:string;token:string}>('/api/student-media',{method:'POST',body:JSON.stringify({action:'start',studentId,kind,mime:file.type,size:file.size,description,date})})
   const uploaded=await createBrowserClient().storage.from('student-media').uploadToSignedUrl(result.path,result.token,file,{contentType:file.type})
   if(uploaded.error)throw new Error('Upload did not finish. Choose the file and try again.')
   setPending(result.id);await finish(result.id)
  }catch(e){setError(e instanceof Error?e.message:'Could not upload media.')}
  finally{setBusy(false)}
 }
 const photo=query.data?.media.find(m=>m.kind==='photo'),videos=query.data?.media.filter(m=>m.kind==='video')??[]
 return <section className="my-6 space-y-5 rounded-xl border bg-card p-4 sm:p-6" aria-label="Student photos and videos">
  <h2 className="text-lg font-semibold">Profile photo & learning videos</h2>
  {query.isPending&&<p role="status">Loading media...</p>}
  {query.error&&<p role="alert">Could not load media. <button className="text-primary underline" onClick={()=>void query.refetch()}>Retry</button></p>}
  {photo?.url&&<div className="flex flex-wrap items-center gap-4"><Image unoptimized src={photo.url} alt="Student profile photo" width={112} height={112} className="size-28 rounded-xl object-cover"/><p className="text-sm text-muted-foreground">{photo.description}</p></div>}
  {staff&&<form className="grid gap-4" onSubmit={e=>{e.preventDefault();void upload()}}><fieldset disabled={busy||!!pending} className="grid gap-4 sm:grid-cols-2">
   <label className="grid gap-2 text-sm">Media type<select className={input} value={kind} onChange={e=>{setKind(e.target.value as 'photo'|'video');setFile(null)}}><option value="photo">Profile photo</option><option value="video">Learning video</option></select></label>
   <label className="grid gap-2 text-sm">Recorded date<input required type="date" className={input} value={date} onChange={e=>setDate(e.target.value)}/></label>
   <label className="grid min-w-0 gap-2 text-sm sm:col-span-2">Choose {kind}<input key={kind} type="file" required={!pending} className={`${input} min-w-0`} accept={kind==='photo'?'image/jpeg,image/png,image/webp':'video/mp4,video/webm,video/quicktime'} onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
   <label className="grid gap-2 text-sm sm:col-span-2">Short description<textarea required={kind==='video'} maxLength={2000} rows={3} className={input} value={description} onChange={e=>setDescription(e.target.value)}/></label>
  </fieldset><p className="text-xs text-muted-foreground">Photos: JPEG, PNG, WebP up to 5 MB. Videos: MP4, WebM, MOV up to 100 MB. Uploaded media is shared with this student&apos;s family.</p>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy||(!file&&!pending)} type="submit" className="justify-self-start">{busy?'Uploading...':pending?'Retry finishing upload':'Upload and share'}</Button></form>}
  <div className="grid gap-4 md:grid-cols-2">{videos.map(video=><article key={video.id} className="min-w-0 rounded-xl border p-3">{video.url?<video controls preload="metadata" src={video.url} className="aspect-video w-full rounded-lg bg-background"/>:<p>Video unavailable. Reload to try again.</p>}<p className="mt-3 text-xs text-muted-foreground">{video.date}</p><p className="mt-2 whitespace-pre-wrap text-sm">{video.description}</p></article>)}</div>
  {query.data&&!photo&&!videos.length&&<p className="text-sm text-muted-foreground">No photos or videos shared yet.</p>}
 </section>
}
