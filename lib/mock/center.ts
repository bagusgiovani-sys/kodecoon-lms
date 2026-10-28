import type { MockData } from './data'

// Presentation scope only. Production authorization remains server/RLS-owned.
export function scopeCenterData(data: MockData, centerId: string): MockData {
  const classes = data.classes.filter(c => c.centerId === centerId)
  const classIds = new Set(classes.map(c => c.id))
  const students = data.students.filter(s => s.classIds.some(id => classIds.has(id)))
  const studentIds = new Set(students.map(s => s.id))
  return { ...data, classes, students,
    sessions: data.sessions.filter(s => classIds.has(s.classId)),
    weeklySlots: data.weeklySlots?.filter(s => classIds.has(s.classId)),
    videos: data.videos.filter(v => classIds.has(v.classId)),
    feedback: data.feedback.filter(f => classIds.has(f.classId)),
    reports: data.reports.filter(r => studentIds.has(r.studentId)),
    learnerModules: data.learnerModules?.filter(m => classIds.has(m.classId)),
    payments: data.payments?.filter(p => studentIds.has(p.studentId)),
    teachers: data.teachers.filter(t => classes.some(c => c.teacher === t.name)),
  }
}
