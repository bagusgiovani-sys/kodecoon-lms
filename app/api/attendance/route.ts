import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/utils/apiAuth'
const schema = z.discriminatedUnion('action', [
 z.object({ action:z.literal('create_slot'), data:z.object({id:z.uuid(),classId:z.uuid(),weekday:z.number().int().min(0).max(6),time:z.iso.time({precision:-1}),date:z.iso.date()}) }),
 z.object({ action:z.literal('roster'), data:z.object({slotId:z.uuid(),studentId:z.uuid(),date:z.iso.date(),included:z.boolean()}) }),
 z.object({ action:z.literal('mark'), data:z.object({slotId:z.uuid().optional(),sessionId:z.uuid().optional(),studentId:z.uuid(),date:z.iso.date(),status:z.enum(['present','mia','excused','unmarked']),revision:z.number().int().nonnegative(),requestId:z.uuid()}).refine(d=>d.slotId||d.sessionId) }),
])
export async function GET(request:Request) {
 const auth=await requireStaff(); if(!auth.ok)return auth.response
 const date=z.iso.date().safeParse(new URL(request.url).searchParams.get('date'))
 if(!date.success)return NextResponse.json({error:'Choose a valid date'},{status:400})
 const {data,error}=await auth.ctx.supabase.rpc('daily_attendance_workspace',{p_date:date.data})
 if(error)return NextResponse.json({error:'Could not load attendance'},{status:500})
 return NextResponse.json(data,{headers:{'Cache-Control':'private, no-store'}})
}
export async function POST(request:Request) {
 const auth=await requireStaff(); if(!auth.ok)return auth.response
 const parsed=schema.safeParse(await request.json().catch(()=>null))
 if(!parsed.success)return NextResponse.json({error:'Invalid attendance change'},{status:400})
 const {data,error}=await auth.ctx.supabase.rpc('change_daily_attendance',{p_action:parsed.data.action,p_data:parsed.data.data})
 if(error)return NextResponse.json({error:error.code==='P0001'?'Insufficient credits. Ask an admin to top up.':error.code==='P0002'?'Session changed. Reload the roster before saving.':'Could not save. Check the selected date, roster, and permissions.'},{status:error.code==='P0002'?409:error.code==='P0001'?422:400})
 return NextResponse.json(data)
}
