export type AttendanceStatus = 'present' | 'mia' | 'excused' | 'unmarked'
export const attendanceOptions = [
  { value: 'present', label: 'Present', credit: 1 },
  { value: 'excused', label: 'Leave', credit: 0 },
  { value: 'mia', label: 'Absent', credit: 1 },
  { value: 'unmarked', label: 'Unmarked', credit: 0 },
] as const
export function attendanceLabel(status: string) {
  return attendanceOptions.find(item => item.value === status)?.label ?? (status === 'absent' ? 'Absent (legacy)' : status)
}
export function attendanceCharge(status: string | undefined) {
  return status === 'present' || status === 'mia' ? 1 : 0
}
