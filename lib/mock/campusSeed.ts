import { createMockData, mockToday, type MockData } from './data'
import { upgradeNexusData } from './nexus'

const SEED_VERSION = 1
const targets = { STB: 30, PIK: 22, BSD: 22 }
const firstNames = ['Aditya', 'Amelia', 'Arjuna', 'Aurelia', 'Bima', 'Celine', 'Darren', 'Elena', 'Felix', 'Gabriella', 'Hugo', 'Isabella', 'Jason', 'Kiara', 'Leon', 'Michelle', 'Nathan', 'Olivia', 'Rafael', 'Stella', 'Timothy', 'Valerie', 'William', 'Yasmin', 'Zachary', 'Nadia', 'Kevin', 'Clara', 'Daniel', 'Anya']
const familyNames = ['Prasetyo', 'Wijaya', 'Santoso', 'Hartono', 'Tan', 'Gunawan', 'Halim', 'Kusuma', 'Setiawan', 'Saputra', 'Wibowo']

// Add the larger demo once, retaining user-created records and edits. The marker
// prevents deleted sample records from being resurrected on subsequent visits.
export function seedCampusData(saved: MockData): MockData {
  if ((saved.campusSeedVersion ?? 0) >= SEED_VERSION) return saved
  const data = upgradeNexusData(saved)
  const templates = createMockData().classes
  const classes = [...data.classes]
  const students = [...data.students]
  const sessions = [...data.sessions]
  const weeklySlots = [...(data.weeklySlots ?? [])]
  const date = mockToday()
  for (const [centerId, target] of Object.entries(targets)) {
    for (const [index, template] of templates.entries()) {
      if (classes.some(cls => cls.centerId === centerId && cls.name === template.name)) continue
      const id = `sample-${centerId.toLowerCase()}-${template.id}`
      classes.push({ ...template, id, centerId, code: `${centerId}-${['ROBO', 'CODE', 'BUILD'][index]}-SAT`, weekday: 6, startTime: ['09:00', '11:00', '14:00'][index], endTime: ['11:00', '13:00', '16:00'][index] })
      sessions.push({ id: `session-${id}`, classId: id, date, time: ['09:00', '11:00', '14:00'][index], notes: '', completed: false, attendance: {} })
    }
    const campusClasses = classes.filter(cls => cls.centerId === centerId)
    const count = students.filter(student => student.classIds.some(id => campusClasses.some(cls => cls.id === id))).length
    for (let index = count; index < target; index++) {
      const id = `sample-${centerId.toLowerCase()}-student-${index + 1}`
      if (students.some(student => student.id === id)) continue
      const cls = campusClasses[index % campusClasses.length]
      const first = firstNames[index % firstNames.length]
      const family = familyNames[(index + Object.keys(targets).indexOf(centerId) * 3) % familyNames.length]
      const credits = [0, 2, 5, 8, 12, 16][index % 6]
      students.push({ id, name: `${first} ${family}`, age: cls.name === 'Junior Builders' ? 6 + index % 3 : 9 + index % 4,
        parentName: `${index % 2 ? 'Dewi' : 'Budi'} ${family}`, parentEmail: `${centerId.toLowerCase()}.parent${index + 1}@example.com`,
        classIds: [cls.id], credits, creditHistory: [{ id: `opening-${id}`, date, amount: credits, reason: 'Mock opening package balance' }],
        completedModules: cls.modules.slice(0, index % 3).map(title => `${cls.id}:${title}`),
        enrollmentHistory: [{ classId: cls.id, date, action: 'Enrolled' }],
      })
    }
    for (const cls of campusClasses) {
      const members = students.filter(student => student.classIds.includes(cls.id)).map(student => ({ studentId: student.id, start: date }))
      const slot = weeklySlots.find(slot => slot.classId === cls.id && !slot.end)
      if (slot) {
        const existing = new Set(slot.members.map(member => member.studentId))
        weeklySlots[weeklySlots.indexOf(slot)] = { ...slot, members: [...slot.members, ...members.filter(member => !existing.has(member.studentId))] }
      } else weeklySlots.push({ id: `sample-slot-${cls.id}`, classId: cls.id, weekday: cls.weekday!, time: cls.startTime!, start: date, members })
    }
  }
  // Generate individual progress only for newly seeded learners.
  const newStudents = students.filter(student => !data.students.some(existing => existing.id === student.id))
  const generated = upgradeNexusData({ ...data, classes, students: newStudents, learnerModules: undefined })
  return { ...data, campusSeedVersion: SEED_VERSION, classes, students, sessions, weeklySlots,
    learnerModules: [...(data.learnerModules ?? []), ...(generated.learnerModules ?? [])] }
}
