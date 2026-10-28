import type { LearningData } from './learning'
import type { LearnerModule, MockPayment } from './nexus'
export interface MockClass {
  centerId?: string
  code?: string; weekday?: number; startTime?: string; endTime?: string
  id: string; name: string; ageBracket: string; teacher: string; modules: string[]
}
export interface CreditEntry { id: string; date: string; amount: number; reason: string }
export interface MockStudent {
  photo?: string
  id: string; name: string; age: number; parentName: string; parentEmail: string
  classIds: string[]; credits: number; creditHistory: CreditEntry[]; completedModules: string[]
  enrollmentHistory?: Array<{ classId: string; date: string; action: 'Enrolled' | 'Unenrolled' }>
}
export interface MockVideo {
  id: string; studentId: string; classId: string; title: string; date: string
  module: string; notes: string; url: string; fileId?: string
}
export interface MockFeedback {
  id: string; studentId: string; classId: string; module: string; teacher: string
  date: string; strengths: string; nextSteps: string; rating: string; published: boolean
}
export interface MockSession {
  roster?: string[]
  id: string; classId: string; date: string; time: string; notes: string
  module?: string; videoUrl?: string
  completed: boolean; attendance: Record<string, 'present' | 'absent' | 'mia' | 'excused' | 'unmarked'>
}
export interface MockReport { id: string; studentId: string; date: string; text: string; cycle?: number; fileId?: string; filename?: string; published?: boolean; sessionIds?: string[] }
export interface MockCertificate { id: string; studentId: string; moduleId: string; module: string; date: string; fileId: string; filename: string }
export interface MockData {
  certificates?: MockCertificate[]
  learnerModules?: LearnerModule[]
  payments?: MockPayment[]
  centers?: Array<{ id: string; name: string }>
  weeklySlots?: Array<{ id: string; classId: string; weekday: number; time: string; start: string; end?: string; members: Array<{ studentId: string; start: string; end?: string }> }>
  learning?: LearningData
  version: 1; classes: MockClass[]; students: MockStudent[]; videos: MockVideo[]
  feedback: MockFeedback[]; sessions: MockSession[]; reports: MockReport[]
  teachers: Array<{ id: string; name: string; email: string }>
}
export const MOCK_STORAGE_KEY = 'kodehub-mock-mvp-v1'
export const SAMPLE_VIDEO = 'https://media.w3.org/2010/05/sintel/trailer.mp4'
export function mockToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}
export function mockId() { return crypto.randomUUID() }
export function createMockData(): MockData {
  const date = mockToday()
  const modules = ['Meet your robot', 'Motors & movement', 'Sensors & signals', 'Loops & logic', 'Robot challenge', 'Showcase project']
  const names = ['Aiden Pratama', 'Sofia Wijaya', 'Ethan Santoso', 'Maya Putri', 'Lucas Tan', 'Chloe Hartono']
  return {
    version: 1,
    classes: [
      { id: 'robotics', name: 'Robotics Explorers', ageBracket: '8–12 years', teacher: 'Gio', modules },
      { id: 'coding', name: 'Creative Coding', ageBracket: '9–13 years', teacher: 'Gio', modules: ['Hello, Scratch!', 'Characters & stories', 'Events & animation', 'Game mechanics', 'Scoreboards & variables', 'Build your own game'] },
      { id: 'builders', name: 'Junior Builders', ageBracket: '6–8 years', teacher: 'Nadia', modules: ['Building basics', 'Gears in motion', 'Simple machines', 'Bridge challenge', 'Moving creations', 'Show & tell'] },
    ],
    students: names.map((name, index) => ({
      id: `student-${index + 1}`, name, age: 8 + index % 4,
      parentName: ['Dewi Pratama', 'Dewi Pratama', 'Budi Santoso', 'Sari Putri', 'Michelle Tan', 'Andi Hartono'][index],
      parentEmail: `parent${index < 2 ? 1 : index + 1}@example.com`,
      classIds: index < 3 ? ['robotics'] : index < 5 ? ['coding'] : ['builders'],
      credits: [8, 5, 2, 10, 6, 12][index],
      creditHistory: [{ id: `credit-${index}`, date, amount: [8, 5, 2, 10, 6, 12][index], reason: 'Opening package balance' }],
      completedModules: index < 3 ? modules.slice(0, index === 0 ? 2 : 1).map(title => `robotics:${title}`) : [],
    })),
    videos: [{ id: 'video-demo', studentId: 'student-1', classId: 'robotics', title: 'Motors & movement · project documentation', date, module: 'Motors & movement', notes: 'Sample footage for the demo. Add your own classroom video using a link or upload.', url: SAMPLE_VIDEO }],
    feedback: [{ id: 'feedback-demo', studentId: 'student-1', classId: 'robotics', module: 'Motors & movement', teacher: 'Gio', date, strengths: 'Aiden built a working rover and confidently explained how changing motor speed affects its movement. Great persistence when debugging the wheel alignment.', nextSteps: 'Next module, we will connect sensors and practice predicting how the robot responds to obstacles.', rating: 'Confident', published: true }],
    sessions: [
      { id: 'session-robotics', classId: 'robotics', date, time: '15:00', notes: '', completed: false, attendance: {} },
      { id: 'session-coding', classId: 'coding', date, time: '16:30', notes: '', completed: false, attendance: {} },
      { id: 'session-builders', classId: 'builders', date, time: '10:00', notes: '', completed: false, attendance: {} },
    ],
    reports: [],
    teachers: [{ id: 'gio', name: 'Gio', email: 'gio@example.com' }, { id: 'nadia', name: 'Nadia', email: 'nadia@example.com' }],
  }
}
