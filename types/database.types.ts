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

export interface Database {
  public: {
    Tables: {
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
    Functions: Record<string, never>
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
