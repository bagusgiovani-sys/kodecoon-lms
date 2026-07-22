// Request/response interfaces from SDD.md Section 3 — used verbatim by every
// route handler and every client fetch. Do not invent new shapes here; if a
// contract changes, SDD.md changes first (CLAUDE.md §5).

// ---------- Auth ----------

export interface StaffLoginRequest {
  email: string
  password: string
}

export interface StaffLoginResponse {
  redirectTo: '/dashboard' | '/admin'
}

export interface MagicLinkRequest {
  email: string
}

export interface MagicLinkResponse {
  sent: true
}

export interface LogoutResponse {
  redirectTo: '/'
}

// ---------- Classes ----------

export interface ClassListResponse {
  classes: Array<{
    id: string
    name: string
    ageBracket: string | null
    todaySession: { id: string; date: string; time: string | null } | null
  }>
}

export interface CreateClassRequest {
  name: string
  ageBracket?: string
}

export interface CreateClassResponse {
  id: string
}

export interface RosterResponse {
  students: Array<{
    id: string
    name: string
    lessonsCompleted: number
    lessonsTotal: number
  }>
}

export interface AddStudentRequest {
  name: string
  parentEmail: string
}

export interface AddStudentResponse {
  studentId: string
}

// ---------- Schedule / Sessions ----------

export interface ScheduleResponse {
  sessions: Array<{
    id: string
    classId: string
    className: string
    date: string
    time: string | null
    status: 'scheduled' | 'completed'
  }>
}

export interface CreateSessionRequest {
  classId: string
  date: string // ISO date
  time?: string // HH:mm
}

export interface CreateSessionResponse {
  sessionId: string
}

export interface LogSessionRequest {
  attendance: Array<{ studentId: string; status: 'present' | 'absent' }>
  video?: { driveFileId: string; driveLink: string }
  notes?: string
  lessonCompletions: Array<{ studentId: string; lessonId: string }>
}

export interface LogSessionResponse {
  sessionId: string
  status: 'completed'
}

// ---------- Students ----------

export interface StudentDetailResponse {
  student: { id: string; name: string; avatarInitials: string }
  enrollments: Array<{
    classId: string
    className: string
    lessonsCompleted: number
    lessonsTotal: number
  }>
  attendance: Array<{ sessionId: string; date: string; status: string }>
  sessions: Array<{
    id: string
    date: string
    videoLink: string | null
    notes: string | null
  }>
}

export interface DraftReportRequest {
  classId: string
  rawNotes: string
}

export interface DraftReportResponse {
  draftText: string
}

export interface ExportReportRequest {
  classId: string
  finalText: string
  templateId: string
}

export interface ExportReportResponse {
  reportId: string
  pdfUrl: string
}

// ---------- Admin ----------

export interface AdminTeachersResponse {
  teachers: Array<{ id: string; name: string; email: string }>
}

export interface AddTeacherRequest {
  name: string
  email: string
}

export interface AddTeacherResponse {
  userId: string
}

export interface AdminScheduleResponse {
  sessions: Array<{
    id: string
    teacherId: string
    teacherName: string
    classId: string
    className: string
    date: string
    time: string | null
  }>
}

export interface AssignSessionRequest {
  teacherId: string
}

export interface AssignSessionResponse {
  sessionId: string
}

export interface AdminLessonsResponse {
  lessons: Array<{
    id: string
    sequenceNumber: number
    title: string
    description: string | null
  }>
}

export interface AddLessonRequest {
  title: string
  description?: string
}

export interface AddLessonResponse {
  lessonId: string
  sequenceNumber: number
}

export interface UpdateLessonRequest {
  title?: string
  description?: string
  sequenceNumber?: number
}

export interface UpdateLessonResponse {
  lessonId: string
}

export interface DeleteLessonResponse {
  deleted: true
  studentsAffected: number
}

export interface AdminCentersResponse {
  centers: Array<{ id: string; name: string; country: string }>
}

// ---------- Student portal (parent) ----------

export interface StudentProfileResponse {
  students: Array<{
    id: string
    name: string
    avatarInitials: string
    activePrograms: Array<{
      classId: string
      className: string
      lessonsCompleted: number
      lessonsTotal: number
    }>
    completedPrograms: Array<{ classId: string; className: string }>
    reports: Array<{ id: string; generatedDate: string; pdfUrl: string }>
  }>
}

export interface JourneyResponse {
  lessons: Array<{
    id: string
    sequenceNumber: number
    title: string
    status: 'locked' | 'unlocked' | 'completed'
    completedDate: string | null
    videoLink: string | null
    notes: string | null
  }>
}

// ---------- Shared error shape ----------

export interface ApiError {
  error: string
}
