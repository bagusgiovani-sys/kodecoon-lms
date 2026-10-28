import { mockToday, type MockData } from './data'

export interface DemoIdentity { role: 'teacher' | 'center_manager' | 'parent'; email: string; name: string }
export const DEMO_IDENTITY_KEY = 'kodenexus-demo-identity'
export interface LearnerModule {
  courseId?: string
  id: string; studentId: string; classId: string; title: string; lesson: string
  completed: number; total: number; status: 'active' | 'completed'; started: string
}
export interface MockPayment {
  id: string; studentId: string; date: string; amountIdr: number; credits: number
  method: 'Bank transfer' | 'Cash' | 'QRIS'; reference: string
  receiptFileId?: string; receiptName?: string
}
export const DEMO_CENTERS = [
  { id: 'STB', name: 'STB' }, { id: 'PIK', name: 'PIK' }, { id: 'BSD', name: 'BSD' },
]
export const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function upgradeNexusData(data: MockData): MockData {
  const centers = [...(data.centers ?? [])]
  for (const center of DEMO_CENTERS) if (!centers.some(c => c.id === center.id)) centers.push(center)
  const classes = data.classes.map((cls, i) => ({ ...cls,
    centerId: cls.centerId ?? DEMO_CENTERS[i % 3].id,
    code: cls.code ?? (i < 3 ? ['RCJ-SUN-1300', 'CODE-SAT-1500', 'BUILD-SUN-1000'][i] : `CLASS-${i + 1}`),
    weekday: cls.weekday ?? (i === 1 ? 6 : 0),
    startTime: cls.startTime ?? ['13:00', '15:00', '10:00'][i % 3],
    endTime: cls.endTime ?? ['15:00', '17:00', '12:00'][i % 3],
  }))
  const learnerModules = data.learnerModules ?? data.students.flatMap(student => student.classIds.flatMap(classId => {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return []
    const done = cls.modules.filter(m => student.completedModules.includes(`${classId}:${m}`))
    return [
      ...done.map((title, i) => ({ id: `legacy-${student.id}-${classId}-${i}`, studentId: student.id, classId,
        title, lesson: 'Module complete', completed: 6, total: 6, status: 'completed' as const, started: '' })),
      { id: `active-${student.id}-${classId}`, studentId: student.id, classId,
        title: cls.modules.find(m => !done.includes(m)) ?? cls.modules[0] ?? 'First module',
        lesson: 'Lesson 1', completed: 0, total: 6, status: 'active' as const, started: '' },
    ]
  }))
  const weeklySlots = data.weeklySlots ?? classes.map(cls => ({
    id: `nexus-slot-${cls.id}`, classId: cls.id, weekday: cls.weekday, time: cls.startTime,
    start: mockToday(), members: data.students.filter(s => s.classIds.includes(cls.id)).map(s => ({ studentId: s.id, start: mockToday() })),
  }))
  return { ...data, centers, classes, learnerModules, weeklySlots, payments: data.payments ?? [] }
}
export function applyDemoPayment(data: MockData, payment: MockPayment): MockData {
  const previous = data.payments?.find(p => p.id === payment.id)
  if (previous) {
    if (JSON.stringify(previous) !== JSON.stringify(payment)) throw new Error('This payment request was already used with different details.')
    return data
  }
  if (!data.students.some(s => s.id === payment.studentId)) throw new Error('Choose an existing student.')
  if (!Number.isSafeInteger(payment.amountIdr) || payment.amountIdr <= 0) throw new Error('Enter a positive whole IDR amount.')
  if (!Number.isInteger(payment.credits) || payment.credits < 0 || payment.credits > 500) throw new Error('Credits must be a whole number from 0 to 500.')
  if (!payment.reference.trim()) throw new Error('Add a payment reference or description.')
  if (!['Bank transfer', 'Cash', 'QRIS'].includes(payment.method)) throw new Error('Choose a supported payment method.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payment.date) || !Number.isFinite(Date.parse(payment.date))) throw new Error('Choose a valid payment date.')
  if (!Number.isSafeInteger(data.students.find(s => s.id === payment.studentId)!.credits + payment.credits)) throw new Error('The credit balance is too large.')
  return { ...data, payments: [...(data.payments ?? []), payment], students: data.students.map(student => student.id !== payment.studentId ? student : {
    ...student, credits: student.credits + payment.credits,
    creditHistory: payment.credits ? [...student.creditHistory, { id: `payment-${payment.id}`, date: payment.date,
      amount: payment.credits, reason: 'Session package credits' }] : student.creditHistory,
  }) }
}
export function visibleToGuardian(student: { parentEmail: string }, identity: DemoIdentity | null) {
  return identity?.role === 'parent' && student.parentEmail.trim().toLowerCase() === identity.email.trim().toLowerCase()
}
