'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Sparkles, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { fetchJson } from '@/lib/utils/fetchJson'
import type {
  DraftReportResponse,
  ExportReportResponse,
} from '@/types/api.types'

interface ReportEditorProps {
  studentId: string
  classId: string
  templateId: string
  sparseData: boolean
}

// Rough notes → AI draft → HUMAN edit → PDF export. The draft is never
// auto-exported (CLAUDE.md §11); AI failure falls back to manual writing
// and never blocks report creation (PRD edge case).
export function ReportEditor({
  studentId,
  classId,
  templateId,
  sparseData,
}: ReportEditorProps) {
  const { t } = useLanguage()
  const [rawNotes, setRawNotes] = useState('')
  const [reportText, setReportText] = useState('')
  const [exportedUrl, setExportedUrl] = useState<string | null>(null)
  const [exportedReport, setExportedReport] = useState<{ id: string; text: string } | null>(null)
  const [publicationId, setPublicationId] = useState<string | null>(null)
  const [withdrawn, setWithdrawn] = useState(false)
  const queryClient = useQueryClient()
  const historyKey = ['report-publications', studentId]
  const history = useQuery({
    queryKey: historyKey,
    queryFn: () => fetchJson<{ reports: Array<{ id: string; generated_date: string; withdrawn_at: string | null }> }>(`/api/students/${studentId}/report/publications`),
  })

  const draftMutation = useMutation({
    mutationFn: () =>
      fetchJson<DraftReportResponse>(`/api/students/${studentId}/report/draft`, {
        method: 'POST',
        body: JSON.stringify({ classId, rawNotes }),
      }),
    onSuccess: (data) => {
      setReportText(data.draftText)
    },
    onError: () => {
      toast.error(t('draftFailed'))
    },
  })

  const exportMutation = useMutation({
    mutationFn: (finalText: string) =>
      fetchJson<ExportReportResponse>(`/api/students/${studentId}/report/export`, {
        method: 'POST',
        body: JSON.stringify({ classId, finalText, templateId }),
      }),
    onSuccess: (data, finalText) => {
      setExportedUrl(data.pdfUrl)
      setExportedReport({ id: data.reportId, text: finalText })
      setPublicationId(null)
      setWithdrawn(false)
      toast.success(t('reportExported'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
  })

  const publicationMutation = useMutation({
    mutationFn: () => fetchJson<{ publicationId: string }>(`/api/reports/${exportedReport!.id}/publications`, { method: 'POST' }),
    onSuccess: (data) => {
      setPublicationId(data.publicationId)
      void queryClient.invalidateQueries({ queryKey: historyKey })
      toast.success(t('reportPublishedToast'))
    },
    onError: () => toast.error(t('genericError')),
  })
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/report-publications/${id}/withdraw`, { method: 'POST' }),
    onSuccess: (_data, id) => {
      if (id === publicationId) setWithdrawn(true)
      void queryClient.invalidateQueries({ queryKey: historyKey })
      toast.success(t('reportWithdrawnToast'))
    },
    onError: () => toast.error(t('genericError')),
  })

  return (
    <div className="flex flex-col gap-6">
      {sparseData ? (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertDescription>{t('sparseDataWarning')}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="raw-notes">{t('rawNotesLabel')}</Label>
        <Textarea
          id="raw-notes"
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          rows={5}
          placeholder={t('notesPlaceholder')}
        />
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 justify-self-start"
          onClick={() => draftMutation.mutate()}
          disabled={draftMutation.isPending || rawNotes.trim().length === 0}
        >
          <Sparkles className="size-4" />
          {draftMutation.isPending ? t('drafting') : t('draftWithAi')}
        </Button>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="report-text">{t('reportTextLabel')}</Label>
        <Textarea
          id="report-text"
          value={reportText}
          disabled={exportMutation.isPending}
          onChange={(e) => setReportText(e.target.value)}
          rows={12}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="min-h-11"
          onClick={() => exportMutation.mutate(reportText)}
          disabled={exportMutation.isPending || publicationMutation.isPending || withdrawMutation.isPending || reportText.trim().length === 0}
        >
          {exportMutation.isPending ? t('exporting') : t('exportPdf')}
        </Button>
        {exportedUrl ? (
          <Button
            className="min-h-11"
            variant="outline"
            nativeButton={false}
            render={
              <a href={exportedUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLink className="size-4" /> PDF
          </Button>
        ) : null}
        {exportedReport && !publicationId && !withdrawn ? (
          <Button className="min-h-11" onClick={() => publicationMutation.mutate()}
            disabled={exportMutation.isPending || publicationMutation.isPending || reportText !== exportedReport.text}>
            {t('publishToFamily')}
          </Button>
        ) : null}
        {publicationId && !withdrawn ? (
          <Button className="min-h-11" variant="outline" onClick={() => withdrawMutation.mutate(publicationId)}
            disabled={exportMutation.isPending || withdrawMutation.isPending}>{t('withdrawReport')}</Button>
        ) : null}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {withdrawn ? t('reportWithdrawn') : publicationId ? t('reportPublished') : t('reportPrivateHint')}
      </p>
      <section className="grid gap-3" aria-label={t('reportsHeading')}>
        <h2 className="font-semibold">{t('reportsHeading')}</h2>
        {history.isError ? <p role="alert">{t('genericError')}</p> : null}
        {history.data?.reports.map(report => (
          <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <span>{report.generated_date}</span>
            {report.withdrawn_at ? <span className="text-sm text-muted-foreground">{t('reportWithdrawn')}</span> : (
              <div className="flex flex-wrap gap-3">
                <Button className="min-h-11" variant="outline" nativeButton={false} render={<a href={`/api/report-publications/${report.id}/download`} target="_blank" rel="noopener noreferrer" />}>PDF</Button>
                <Button className="min-h-11" variant="outline" disabled={withdrawMutation.isPending || exportMutation.isPending}
                  onClick={() => withdrawMutation.mutate(report.id)}>{t('withdrawReport')}</Button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
