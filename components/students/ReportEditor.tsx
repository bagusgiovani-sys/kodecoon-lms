'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
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
    mutationFn: () =>
      fetchJson<ExportReportResponse>(`/api/students/${studentId}/report/export`, {
        method: 'POST',
        body: JSON.stringify({ classId, finalText: reportText, templateId }),
      }),
    onSuccess: (data) => {
      setExportedUrl(data.pdfUrl)
      toast.success(t('reportExported'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('genericError'))
    },
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
          className="justify-self-start"
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
          onChange={(e) => setReportText(e.target.value)}
          rows={12}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || reportText.trim().length === 0}
        >
          {exportMutation.isPending ? t('exporting') : t('exportPdf')}
        </Button>
        {exportedUrl ? (
          <Button
            variant="outline"
            render={
              <a href={exportedUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLink className="size-4" /> PDF
          </Button>
        ) : null}
      </div>
    </div>
  )
}
