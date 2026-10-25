import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext, requireStaff } from '@/lib/utils/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'

const mediaTypes = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'video/mp4':'mp4', 'video/webm':'webm', 'video/quicktime':'mov' } as const
const startSchema = z.object({action:z.literal('start'), studentId:z.uuid(), kind:z.enum(['photo','video']), mime:z.enum(Object.keys(mediaTypes) as [keyof typeof mediaTypes,...(keyof typeof mediaTypes)[]]), size:z.number().int().positive(), description:z.string().trim().max(2000), date:z.iso.date()})
const schema=z.union([startSchema,z.object({action:z.literal('finish'),id:z.uuid()})])
const failure=(error:string,status=400)=>NextResponse.json({error},{status})
export async function GET(request:Request) {
 const auth=await getAuthContext();if(!auth.ok)return auth.response
 const id=z.uuid().safeParse(new URL(request.url).searchParams.get('studentId'));if(!id.success)return failure('Choose a student.')
 const {data,error}=await auth.ctx.supabase.from('student_media').select('*').eq('student_id',id.data).eq('ready',true).order('created_at',{ascending:false}).limit(100)
 if(error)return failure('Could not load media.',500)
 const media=await Promise.all((data??[]).map(async item=>{
  const signed=await auth.ctx.supabase.storage.from('student-media').createSignedUrl(item.storage_path,300)
  return {id:item.id,kind:item.kind,description:item.description,date:item.recorded_date,url:signed.data?.signedUrl??null}
 }))
 return NextResponse.json({media},{headers:{'Cache-Control':'private, no-store'}})
}
export async function POST(request:Request) {
 const auth=await requireStaff();if(!auth.ok)return auth.response
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return failure('Check the file, date, and description.')
 const body=parsed.data
 if(body.action==='start') {
  if((body.kind==='photo')!==body.mime.startsWith('image/')||body.size>(body.kind==='photo'?5:100)*1024*1024)return failure('Photos must be under 5 MB; videos under 100 MB. Choose a supported file type.')
  const id=crypto.randomUUID(),path=`${body.studentId}/${id}.${mediaTypes[body.mime]}`
  const {error}=await auth.ctx.supabase.from('student_media').insert({id,student_id:body.studentId,kind:body.kind,storage_path:path,description:body.description,recorded_date:body.date,created_by:auth.ctx.userId})
  if(error)return failure('You cannot upload media for this student.',403)
  const admin=createAdminClient()
  const signed=await admin.storage.from('student-media').createSignedUploadUrl(path,{upsert:false})
  if(signed.error)return failure('Could not prepare upload. Check student-media storage setup.',503)
  return NextResponse.json({id,path,token:signed.data.token})
 }
 const {data:item,error}=await auth.ctx.supabase.from('student_media').select('*').eq('id',body.id).eq('created_by',auth.ctx.userId).maybeSingle()
 if(error||!item)return failure('Upload not found.',404)
 if(item.ready)return NextResponse.json({id:item.id})
 const admin=createAdminClient(),bucket=admin.storage.from('student-media')
 const info=await bucket.info(item.storage_path)
 const mime=info.data?.contentType as keyof typeof mediaTypes|undefined
 const size=info.data?.size
 if(info.error||!mime||!mediaTypes[mime]||!size||size>(item.kind==='photo'?5:100)*1024*1024||!item.storage_path.endsWith(`.${mediaTypes[mime]}`)||(item.kind==='photo')!==mime.startsWith('image/'))return failure('Upload is missing or has an unsupported type or size. Choose the file again.')
 const saved=await admin.from('student_media').update({ready:true}).eq('id',item.id).eq('created_by',auth.ctx.userId)
 if(saved.error)return failure('Could not finish upload. Retry finishing it.',500)
 return NextResponse.json({id:item.id})
}
