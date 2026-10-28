import { mockId, type MockData, type MockSession } from './data'

// A session and its balances are committed as one localStorage write. Editing
// or retrying an existing session applies only the change in attendance.
export function applyMockSession(data: MockData, session: MockSession): MockData {
  const previous = data.sessions.find(s => s.id === session.id)
  const cls = data.classes.find(c => c.id === session.classId)
  if (!cls) throw new Error('Class not found')
  const students = data.students.map(student => {
    if (!student.classIds.includes(session.classId) && !previous?.attendance[student.id] && !session.roster?.includes(student.id)) return student
    const wasCharged = previous?.attendance[student.id] === 'present' || previous?.attendance[student.id] === 'mia'
    const isPresent = session.attendance[student.id] === 'present'
    const isCharged = isPresent || session.attendance[student.id] === 'mia'
    const amount = Number(wasCharged) - Number(isCharged)
    if (student.credits + amount < 0) throw new Error(`${student.name} needs a credit top-up before attendance can be saved.`)
    const moduleKey = session.module ? `${cls.id}:${session.module}` : ''
    const creditHistory = student.creditHistory.map(entry => entry.id.startsWith(`session-${session.id}-`) ? { ...entry, date: session.date } : entry)
    return {
      ...student,
      credits: student.credits + amount,
      creditHistory: amount ? [...creditHistory, {
        id: `session-${session.id}-${mockId()}`, date: session.date, amount,
        reason: amount < 0 ? `${isPresent ? 'Present' : 'Absent'} · ${cls.name}` : `Attendance correction · ${cls.name}`,
      }] : creditHistory,
      completedModules: isPresent && moduleKey && !student.completedModules.includes(moduleKey)
        ? [...student.completedModules, moduleKey] : student.completedModules,
    }
  })
  let videos = data.videos
  if (session.videoUrl) {
    const newVideos = students.filter(s => s.classIds.includes(cls.id) && session.attendance[s.id] === 'present').map(student => ({
      id: `session-video-${session.id}-${student.id}`, studentId: student.id, classId: cls.id,
      title: `${cls.name} · session documentation`, date: session.date,
      module: session.module ?? '', notes: session.notes, url: session.videoUrl!,
    }))
    videos = [...videos.filter(v => !v.id.startsWith(`session-video-${session.id}-`)), ...newVideos]
  } else if (previous?.videoUrl) {
    videos = videos.filter(v => !v.id.startsWith(`session-video-${session.id}-`))
  }
  return { ...data, students, videos, sessions: [...data.sessions.filter(s => s.id !== session.id), session] }
}
