import type { MockData } from './data'

/** Attendance is individual and academy-wide; charged absences do not count. */
export function feedbackAttendance(data: MockData, studentId: string) {
  return [...new Map(data.sessions.map(session => [session.id, session])).values()]
    .filter(session => session.attendance[studentId] === 'present')
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.id.localeCompare(b.id))
}
export const gradeDescriptions = {
  S: 'Competition-ready mastery', 'A+': 'Excellent achievement', A: 'Strong achievement',
  'A-': 'Good progress', 'B+': 'Developing with confidence', B: 'Building foundational skills',
  'B-': 'Growing with guided support',
}
export const reportSkills = ['Coding', 'Building / designing', 'Creativity', 'Problem solving', 'Communication']

export async function validatePdf(file: File) {
  if (file.size > 10 * 1024 * 1024 || new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== '%PDF-') {
    throw new Error('Choose a valid PDF under 10 MB.')
  }
}
