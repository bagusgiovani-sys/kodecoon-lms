import { requireStaffPage } from '@/lib/utils/pageAuth'
import { DailyAttendancePanel } from '@/components/attendance/DailyAttendancePanel'
export default async function AttendancePage() {
 const {userId}=await requireStaffPage()
 return <><h1 className="text-3xl font-semibold">Daily Attendance</h1><p className="mt-2 text-muted-foreground">Scheduled learners by date, center, and class time.</p><DailyAttendancePanel actorId={userId}/></>
}
