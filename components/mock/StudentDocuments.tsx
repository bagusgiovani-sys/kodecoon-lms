'use client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { mockId, mockToday, type MockStudent } from '@/lib/mock/data'
import { feedbackAttendance, validatePdf } from '@/lib/mock/studentDocuments'
import { readMockVideo, saveMockVideo } from '@/lib/mock/videoStorage'
import { useAcademyData, useMock } from './MockProvider'
import { Action, Empty, Field, inputStyle, LinkAction, Panel, Pill } from './MockUI'
import { ReportPrintButton } from './ReportPrintButton'

export function PdfDownload({ fileId, filename }: { fileId: string; filename: string }) {
  const [busy, setBusy] = useState(false)
  return <Action secondary disabled={busy} onClick={async () => {
    setBusy(true)
    try {
      const blob = await readMockVideo(fileId)
      if (!blob) throw new Error('This PDF is unavailable in this browser. Ask staff to upload it again.')
      const url = URL.createObjectURL(blob), link = document.createElement('a')
      link.href = url; link.download = filename; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not open PDF.') }
    finally { setBusy(false) }
  }}>{busy ? 'Opening…' : 'Download PDF'}</Action>
}

export function StudentReports({ student, parent }: { student: MockStudent; parent: boolean }) {
  const data = useAcademyData()
  const attended = feedbackAttendance(data, student.id).length
  const reports = data.reports.filter(r => r.studentId === student.id && (!parent || r.published !== false))
  const due = Math.floor(attended / 12)
  const count = Math.max(due + 1, ...reports.map(r => r.cycle ?? 0))
  return <Panel title="Learning feedback reports" subtitle="A report every 12 attended classes, whether or not the module is finished.">
    <p className="mb-4 text-sm text-muted-foreground">{attended} classes attended across all centers. Leave and Absent do not count.</p>
    <div className="space-y-4">{Array.from({ length: count }, (_, i) => i + 1).reverse().map(cycle => {
      const history = reports.filter(r => r.cycle === cycle).sort((a,b) => b.date.localeCompare(a.date))
      const available = history.some(r => r.fileId && r.published !== false)
      return <article key={cycle} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">Feedback {cycle} · Classes {(cycle - 1) * 12 + 1}–{cycle * 12}</h3><Pill>{available ? 'Available' : cycle <= due ? 'Awaiting report' : `${cycle * 12 - attended} more classes`}</Pill></div>
        {!parent && cycle <= due && <div className="mt-3"><LinkAction secondary href={`/students/${student.id}/report?cycle=${cycle}`}>{history.length ? 'Add report version' : 'Create / upload PDF'}</LinkAction></div>}
        {history.map(report => <div key={report.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><span className="text-sm">{report.date} · {report.published === false ? 'Staff draft' : 'Published'}{cycle > due ? ' · Attendance was corrected; saved report retained' : ''}</span>{report.fileId && <PdfDownload fileId={report.fileId} filename={report.filename ?? 'feedback.pdf'} />}</div>)}
      </article>
    })}</div>
    {reports.filter(r => !r.cycle).map(r => <article key={r.id} className="mt-4 rounded-xl border p-4"><p className="mb-3 text-sm">Earlier report · {r.date}</p><ReportPrintButton studentName={student.name} date={r.date} text={r.text} /></article>)}
    <p className="mt-4 text-xs text-muted-foreground">Demo PDFs are saved in this browser. Sharing across parent devices requires connected private storage.</p>
  </Panel>
}

export function StudentCertificates({ student, parent }: { student: MockStudent; parent: boolean }) {
  const data = useAcademyData()
  const modules = (data.learnerModules ?? []).filter(m => m.studentId === student.id && m.status === 'completed')
  const certificates = (data.certificates ?? []).filter(c => c.studentId === student.id)
  return <Panel title="Certificates of completion" subtitle="Certificates celebrate completed modules, independently of the 12-class feedback cycle.">
    {!modules.length && !certificates.length && <Empty title="No completed modules yet" description="Certificates will appear here when a module is completed and staff upload its PDF." />}
    <div className="space-y-4">{modules.map(module => <article key={module.id} className="rounded-xl border p-4"><h3 className="font-medium">{module.title}</h3><p className="my-3 text-sm text-muted-foreground">{certificates.some(c => c.moduleId === module.id) ? 'Certificate available below' : 'Completed · Certificate not uploaded yet'}</p>{!parent && <CertificateUpload student={student} moduleId={module.id} module={module.title} />}</article>)}</div>
    {certificates.map(c => <article key={c.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><h3 className="font-medium">{c.module}</h3><p className="text-xs text-muted-foreground">Issued {c.date}</p></div><PdfDownload fileId={c.fileId} filename={c.filename} /></article>)}
    <p className="mt-4 text-xs text-muted-foreground">Demo uploads stay in this browser. Parents can download published certificates in the parent preview here.</p>
  </Panel>
}

function CertificateUpload({ student, moduleId, module }: { student: MockStudent; moduleId: string; module: string }) {
  const { update } = useMock()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  return <form className="grid gap-3" onSubmit={async event => {
    event.preventDefault()
    if (lock.current) return
    const form = event.currentTarget, file = new FormData(form).get('certificate') as File
    lock.current = true; setBusy(true)
    try {
      await validatePdf(file)
      const id = mockId(); await saveMockVideo(id, file)
      if (update(current => {
        if (!current.learnerModules?.some(m => m.id === moduleId && m.studentId === student.id && m.status === 'completed')) throw new Error('This module must be completed before issuing a certificate.')
        return { ...current, certificates: [{ id, studentId: student.id, moduleId, module, date: mockToday(), fileId: id, filename: file.name }, ...(current.certificates ?? [])] }
      })) { toast.success('Certificate saved and published'); form.reset() }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save certificate.') }
    finally { lock.current = false; setBusy(false) }
  }}><Field title="Certificate PDF"><input name="certificate" type="file" accept="application/pdf,.pdf" required className={inputStyle} /></Field><Action type="submit" disabled={busy}>{busy ? 'Saving…' : 'Upload & publish certificate'}</Action></form>
}
