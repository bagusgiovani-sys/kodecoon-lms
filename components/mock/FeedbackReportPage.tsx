'use client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { mockId, mockToday, type MockStudent } from '@/lib/mock/data'
import { feedbackAttendance, gradeDescriptions, reportSkills, validatePdf } from '@/lib/mock/studentDocuments'
import { saveMockVideo } from '@/lib/mock/videoStorage'
import { useAcademyData, useMock } from './MockProvider'
import { Action, Back, Field, Heading, inputStyle, Panel } from './MockUI'
import { StudentReports } from './StudentDocuments'

export function FeedbackReportPage({ student }: { student: MockStudent }) {
  const data = useAcademyData(), { update } = useMock()
  const attended = feedbackAttendance(data, student.id)
  const due = Math.floor(attended.length / 12)
  const [busy, setBusy] = useState(false), lock = useRef(false)
  const [mode, setMode] = useState('generate')
  const requested = typeof window === 'undefined' ? 1 : Number(new URLSearchParams(window.location.search).get('cycle') ?? 1)
  return <><Back href={`/students/${student.id}`} text="Student profile" /><Heading title="Learning feedback report" description={`${student.name} · ${attended.length} attended classes · ${due} feedback periods due`} />
    <Panel className="mb-6"><form className="grid gap-5" onSubmit={async event => {
      event.preventDefault()
      if (lock.current) return
      const fields = new FormData(event.currentTarget), cycle = Number(fields.get('cycle'))
      if (!Number.isInteger(cycle) || cycle < 1 || cycle > due) { toast.error('A report is due after each 12 attended classes.'); return }
      lock.current = true; setBusy(true)
      try {
        const date = mockToday(), text = String(fields.get('text') ?? '').trim(), id = mockId()
        let file: File
        if (mode === 'upload') { file = fields.get('pdf') as File; await validatePdf(file) }
        else {
          const { generateFeedbackPdf } = await import('@/lib/mock/feedbackPdf')
          const blob = await generateFeedbackPdf({ name: student.name, cycle, date, text, module: String(fields.get('module')).trim(), grades: Object.fromEntries(reportSkills.map(skill => [skill, String(fields.get(skill) ?? '')])) })
          file = new File([blob], `feedback-${student.id}-${cycle}-${date}.pdf`, { type: 'application/pdf' })
        }
        await saveMockVideo(id, file)
        if (update(current => {
          const sessions = feedbackAttendance(current, student.id)
          if (sessions.length < cycle * 12) throw new Error('Attendance changed. Review the feedback period before saving.')
          return { ...current, reports: [{ id, studentId: student.id, date, text, cycle, fileId: id, filename: file.name, published: true, sessionIds: sessions.slice((cycle - 1) * 12, cycle * 12).map(s => s.id) }, ...current.reports] }
        })) toast.success('PDF saved and published to the parent preview')
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save PDF. Please try again.') }
      finally { lock.current = false; setBusy(false) }
    }}>
      <div className="grid gap-4 sm:grid-cols-2"><Field title="Feedback period"><select name="cycle" defaultValue={Math.max(1, Math.min(requested, due))} className={inputStyle} disabled={!due}>{!due && <option value="1">First report due at 12 attended classes</option>}{Array.from({ length: due }, (_, i) => <option key={i} value={i + 1}>Feedback {i + 1} · Classes {i * 12 + 1}–{(i + 1) * 12}</option>)}</select></Field><Field title="PDF source"><select value={mode} onChange={e => setMode(e.target.value)} className={inputStyle}><option value="generate">Generate a report</option><option value="upload">Upload an existing PDF</option></select></Field></div>
      {mode === 'upload' ? <Field title="Report PDF"><input name="pdf" type="file" accept="application/pdf,.pdf" required className={inputStyle} /></Field> : <>
        <Field title="Module(s) covered"><input name="module" required maxLength={300} className={inputStyle} defaultValue={(data.learnerModules ?? []).filter(m => m.studentId === student.id && m.status === 'active').map(m => m.title).join(', ')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">{reportSkills.map(skill => <Field key={skill} title={skill}><select name={skill} className={inputStyle}><option value="">Not assessed</option>{Object.entries(gradeDescriptions).map(([grade, label]) => <option key={grade} value={grade}>{grade} — {label}</option>)}</select></Field>)}</div>
        <Field title="Teacher feedback and next steps"><textarea name="text" rows={7} maxLength={8000} required className={inputStyle} placeholder="Describe achievements, progress and the next steps for this learner." /></Field>
      </>}
      <p className="text-xs text-muted-foreground">Saving publishes this PDF to the parent preview. Previous versions remain available. Demo files stay in this browser; they are not uploaded to Drive or shared across devices.</p>
      <Action type="submit" disabled={busy || !due}>{busy ? 'Saving PDF…' : 'Save & publish PDF'}</Action>
    </form></Panel><StudentReports student={student} parent={false} /></>
}
