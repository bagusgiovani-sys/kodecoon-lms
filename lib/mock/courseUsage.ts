import type { MockData } from './data'
import type { LearningCourse } from './learning'

export const courseSubject = (category: string) => category === 'Engineering' ? 'Competition' : category

// Unique currently enrolled learners, not module-row counts or class counts.
// Explicit individual course links override legacy class-wide course mappings.
export function courseUsage(data: MockData, courses: LearningCourse[]) {
  const counts = new Map(courses.map(c => [c.id, new Set<string>()]))
  let unlinked = 0
  for (const student of data.students) {
    for (const cls of data.classes.filter(c => student.classIds.includes(c.id))) {
      const plans = (data.learnerModules ?? []).filter(m => m.studentId === student.id && m.classId === cls.id)
      const active = plans.filter(m => m.status === 'active')
      const individual = active.filter(m => m.courseId)
      const legacy = plans.length === 0 || active.length > 0 ? data.learning?.classCourses[cls.id] : undefined
      const ids = individual.length ? individual.map(m => m.courseId!) : legacy ? [legacy] : []
      for (const id of new Set(ids)) counts.get(id)?.add(student.id)
      unlinked += active.filter(m => !m.courseId && !data.learning?.classCourses[cls.id]).length
    }
  }
  return { counts: new Map([...counts].map(([id, students]) => [id, students.size])), unlinked }
}
