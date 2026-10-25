'use client'
import { attendanceOptions } from '@/lib/attendance'
import type { AttendanceStatus } from '@/lib/attendance'

export function AttendanceOptions({ value, onChange, disabled, label }: {
  value: string; onChange: (status: AttendanceStatus) => void; disabled?: boolean; label: string
}) {
  return <fieldset disabled={disabled} className="min-w-0"><legend className="sr-only">{label}</legend>
    <div className="flex flex-wrap gap-2">{attendanceOptions.map(option => <button key={option.value} type="button"
      aria-pressed={value === option.value} onClick={() => onChange(option.value)}
      className={`min-h-11 rounded-lg border px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${value === option.value ? 'border-primary bg-primary/15 font-semibold text-primary' : 'bg-background text-muted-foreground'}`}>
      {option.label}</button>)}</div>
  </fieldset>
}
