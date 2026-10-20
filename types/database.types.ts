// Hand-authored to match schema.sql exactly (2026-07-17).
// Once the Supabase project is linked, replace this file with the generated one:
//   npx supabase gen types typescript --local > types/database.types.ts
// and regenerate after every migration (CLAUDE.md §6).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'teacher' | 'center_manager' | 'admin' | 'parent'
export type SessionStatus = 'scheduled' | 'completed'
export type AttendanceStatus = 'present' | 'absent' | 'unmarked'
export type LessonProgressStatus = 'locked' | 'unlocked' | 'completed'

type CourseRow = {
  id: string; center_id: string; owner_id: string; title: string; category: string
  age_range: string; level: string; description: string; prerequisites: string
  revision: number; archived_at: string | null; created_at: string; updated_at: string
}
type CourseLessonRow = {
  id: string; course_id: string; sequence: number; title: string; minutes: number
  objective: string; materials: string; steps: string; evidence: string
  revision: number; archived_at: string | null; created_at: string; updated_at: string
}
type CourseDefaults = 'revision' | 'archived_at' | 'created_at' | 'updated_at'
type ClassCourseRow = { id: string; class_id: string; center_id: string; course_id: string; assigned_by: string; assigned_at: string; ended_at: string | null }

type AssignmentRow = {
  id: string; class_id: string; center_id: string; course_assignment_id: string; course_id: string
  course_lesson_id: string | null; title: string; brief: string; due_at: string | null
  status: 'draft' | 'published' | 'archived'; lesson_title_snapshot: string | null
  lesson_objective_snapshot: string | null; revision: number; created_by: string; updated_by: string
  created_at: string; updated_at: string; published_at: string | null
}
type AssignmentLearnerRow = { assignment_id: string; class_id: string; center_id: string; student_id: string; assigned_at: string; submission_open: boolean }

type SubmissionThreadRow = { id: string; assignment_id: string; student_id: string; next_version: number }
type SubmissionVersionRow = { id: string; thread_id: string; version: number; project_url: string; reflection: string; submitted_by: string; submitted_role: 'parent' | 'teacher' | 'admin'; submitted_at: string; is_late: boolean; request_id: string }
type SubmissionReviewRow = { id: string; submission_id: string; sequence: number; outcome: 'revision' | 'approved'; feedback: string; reviewed_by: string; reviewed_at: string; supersedes_id: string | null; request_id: string }

export interface Database {
  public: {
    Tables: {
      submission_threads: { Row: SubmissionThreadRow; Insert: Omit<SubmissionThreadRow, 'id' | 'next_version'> & Partial<SubmissionThreadRow>; Update: Partial<SubmissionThreadRow>; Relationships: [] }
      submission_versions: { Row: SubmissionVersionRow; Insert: Omit<SubmissionVersionRow, 'id' | 'submitted_at'> & Partial<SubmissionVersionRow>; Update: Partial<SubmissionVersionRow>; Relationships: [] }
      submission_reviews: { Row: SubmissionReviewRow; Insert: Omit<SubmissionReviewRow, 'id' | 'reviewed_at' | 'supersedes_id'> & Partial<SubmissionReviewRow>; Update: Partial<SubmissionReviewRow>; Relationships: [] }
      submission_write_receipts: { Row: { actor_id: string; request_id: string; payload: Json; result: Json }; Insert: { actor_id: string; request_id: string; payload: Json; result: Json }; Update: { actor_id?: string; request_id?: string; payload?: Json; result?: Json }; Relationships: [] }
      assignments: {
        Row: AssignmentRow
        Insert: Pick<AssignmentRow, 'id' | 'class_id' | 'center_id' | 'course_assignment_id' | 'course_id' | 'title' | 'brief' | 'created_by' | 'updated_by'> & Partial<AssignmentRow>
        Update: Partial<AssignmentRow>
        Relationships: []
      }
      assignment_learners: {
        Row: AssignmentLearnerRow
        Insert: Omit<AssignmentLearnerRow, 'assigned_at' | 'submission_open'> & Partial<AssignmentLearnerRow>
        Update: Partial<AssignmentLearnerRow>
        Relationships: []
      }
      assignment_write_receipts: {
        Row: { actor_id: string; request_id: string; payload: Json; result: Json; created_at: string }
        Insert: { actor_id: string; request_id: string; payload: Json; result: Json; created_at?: string }
        Update: { actor_id?: string; request_id?: string; payload?: Json; result?: Json; created_at?: string }
        Relationships: []
      }
      courses: {
        Row: CourseRow
        Insert: Omit<CourseRow, CourseDefaults> & Partial<Pick<CourseRow, CourseDefaults>>
        Update: Partial<CourseRow>
        Relationships: []
      }
      course_lessons: {
        Row: CourseLessonRow
        Insert: Omit<CourseLessonRow, CourseDefaults> & Partial<Pick<CourseLessonRow, CourseDefaults>>
        Update: Partial<CourseLessonRow>
        Relationships: []
      }
      course_write_receipts: {
        Row: { actor_id: string; request_id: string; payload: Json; result: Json; created_at: string }
        Insert: { actor_id: string; request_id: string; payload: Json; result: Json; created_at?: string }
        Update: { actor_id?: string; request_id?: string; payload?: Json; result?: Json; created_at?: string }
        Relationships: []
      }
      class_course_assignments: {
        Row: ClassCourseRow
        Insert: Omit<ClassCourseRow, 'id' | 'assigned_at' | 'ended_at'> & Partial<Pick<ClassCourseRow, 'id' | 'assigned_at' | 'ended_at'>>
        Update: Partial<ClassCourseRow>
        Relationships: []
      }
      class_course_write_receipts: {
        Row: { actor_id: string; request_id: string; payload: Json; result: Json; created_at: string }
        Insert: { actor_id: string; request_id: string; payload: Json; result: Json; created_at?: string }
        Update: { actor_id?: string; request_id?: string; payload?: Json; result?: Json; created_at?: string }
        Relationships: []
      }
      centers: {
        Row: {
          id: string
          name: string
          country: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          country?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          country?: string
          created_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          center_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: string
          center_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          center_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_center_id_fkey'
            columns: ['center_id']
            isOneToOne: false
            referencedRelation: 'centers'
            referencedColumns: ['id']
          },
        ]
      }
      classes: {
        Row: {
          id: string
          center_id: string
          teacher_id: string
          name: string
          age_bracket: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          center_id: string
          teacher_id: string
          name: string
          age_bracket?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          center_id?: string
          teacher_id?: string
          name?: string
          age_bracket?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'classes_center_id_fkey'
            columns: ['center_id']
            isOneToOne: false
            referencedRelation: 'centers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          id: string
          center_id: string
          name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          center_id: string
          name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          center_id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'students_center_id_fkey'
            columns: ['center_id']
            isOneToOne: false
            referencedRelation: 'centers'
            referencedColumns: ['id']
          },
        ]
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          class_id: string
          enrolled_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          class_id: string
          enrolled_date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          class_id?: string
          enrolled_date?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          class_id: string
          teacher_id: string
          session_date: string
          session_time: string | null
          credit_billable: boolean
          revision: number
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id: string
          session_date: string
          session_time?: string | null
          credit_billable?: boolean
          revision?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          teacher_id?: string
          session_date?: string
          session_time?: string | null
          credit_billable?: boolean
          revision?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sessions_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          session_id: string
          student_id: string
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      session_videos: {
        Row: {
          id: string
          session_id: string
          drive_file_id: string
          drive_link: string
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          drive_file_id: string
          drive_link: string
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          drive_file_id?: string
          drive_link?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'session_videos_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          class_id: string
          sequence_number: number
          title: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          class_id: string
          sequence_number: number
          title: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          sequence_number?: number
          title?: string
          description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      student_lesson_progress: {
        Row: {
          id: string
          student_id: string
          lesson_id: string
          status: string
          session_id: string | null
          completed_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          lesson_id: string
          status?: string
          session_id?: string | null
          completed_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          lesson_id?: string
          status?: string
          session_id?: string | null
          completed_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'student_lesson_progress_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_lesson_progress_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      report_templates: {
        Row: {
          id: string
          name: string
          design_reference: string | null
          is_default: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          design_reference?: string | null
          is_default?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          design_reference?: string | null
          is_default?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          student_id: string
          class_id: string | null
          template_id: string | null
          raw_notes: string | null
          ai_draft_text: string | null
          final_text: string | null
          final_pdf_url: string | null
          pdf_storage_path: string | null
          generated_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          class_id?: string | null
          template_id?: string | null
          raw_notes?: string | null
          ai_draft_text?: string | null
          final_text?: string | null
          final_pdf_url?: string | null
          pdf_storage_path?: string | null
          generated_date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          class_id?: string | null
          template_id?: string | null
          raw_notes?: string | null
          ai_draft_text?: string | null
          final_text?: string | null
          final_pdf_url?: string | null
          pdf_storage_path?: string | null
          generated_date?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reports_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'report_templates'
            referencedColumns: ['id']
          },
        ]
      }
      published_reports: {
        Row: {
          id: string
          report_id: string
          student_id: string
          class_id: string
          final_text: string
          generated_date: string
          pdf_storage_path: string
          published_by: string
          published_at: string
          withdrawn_at: string | null
        }
        Insert: {
          id?: string
          report_id: string
          student_id: string
          class_id: string
          final_text: string
          generated_date: string
          pdf_storage_path: string
          published_by: string
          published_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      credit_accounts: {
        Row: {
          student_id: string
          balance: number
          revision: number
        }
        Insert: {
          student_id: string
          balance?: number
          revision?: number
        }
        Update: {
          student_id?: string
          balance?: number
          revision?: number
        }
        Relationships: []
      }
      credit_operations: {
        Row: {
          actor_id: string
          request_id: string
          payload: Json
          result: Json
          created_at: string
        }
        Insert: {
          actor_id: string
          request_id: string
          payload: Json
          result: Json
          created_at?: string
        }
        Update: {
          actor_id?: string
          request_id?: string
          payload?: Json
          result?: Json
          created_at?: string
        }
        Relationships: []
      }
      credit_entries: {
        Row: {
          id: string
          student_id: string
          amount: number
          kind: string
          reason: string
          actor_id: string
          request_id: string
          session_id: string | null
          effective_date: string
          recorded_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          kind: string
          reason: string
          actor_id: string
          request_id: string
          session_id?: string | null
          effective_date: string
          recorded_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          amount?: number
          kind?: string
          reason?: string
          actor_id?: string
          request_id?: string
          session_id?: string | null
          effective_date?: string
          recorded_at?: string
        }
        Relationships: [{ foreignKeyName: 'credit_entries_session_id_fkey'; columns: ['session_id']; isOneToOne: false; referencedRelation: 'sessions'; referencedColumns: ['id'] }]
      }
      session_credit_state: {
        Row: {
          session_id: string
          student_id: string
          charged: boolean
        }
        Insert: {
          session_id: string
          student_id: string
          charged: boolean
        }
        Update: {
          session_id?: string
          student_id?: string
          charged?: boolean
        }
        Relationships: []
      }
      student_guardians: {
        Row: {
          id: string
          student_id: string
          guardian_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          guardian_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          guardian_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'student_guardians_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_guardians_guardian_id_fkey'
            columns: ['guardian_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      valid_submission_url: { Args: { p_url: string }; Returns: boolean }
      can_read_submission_thread: { Args: { p_thread: string }; Returns: boolean }
      submit_assignment: { Args: { p_assignment: string; p_student: string; p_request: string; p_url: string; p_reflection: string }; Returns: Json }
      review_submission: { Args: { p_submission: string; p_expected_version: number; p_expected_review: string | null; p_request: string; p_outcome: string; p_feedback: string }; Returns: Json }
      can_manage_class: { Args: { p_class: string }; Returns: boolean }
      can_read_assignment: { Args: { p_assignment: string; p_student?: string | null }; Returns: boolean }
      manage_assignment: { Args: { p_action: string; p_assignment: string; p_class: string | null; p_expected_revision: number; p_request: string; p_content: Json }; Returns: Json }
      save_course_content: { Args: { p_course: string; p_lesson: string | null; p_expected_revision: number; p_request: string; p_content: Json }; Returns: Json }
      set_class_course: { Args: { p_class: string; p_course: string | null; p_request: string }; Returns: Json }
      can_read_credits: { Args: { p_student: string }; Returns: boolean }
      adjust_credits: { Args: { p_student: string; p_amount: number; p_kind: string; p_reason: string; p_request: string }; Returns: Json }
      log_session_credits: { Args: { p_session_id: string; p_notes: string | null; p_attendance: Json; p_lesson_completions: Json; p_request: string; p_expected_revision: number }; Returns: Json }
      can_manage_report: { Args: { p_student: string; p_class: string }; Returns: boolean }
      publish_report: { Args: { p_report_id: string }; Returns: string }
      withdraw_report: { Args: { p_publication_id: string }; Returns: undefined }
      log_session: {
        Args: {
          p_session_id: string
          p_notes: string | null
          p_attendance: Json
          p_lesson_completions: Json
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
