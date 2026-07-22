'use client'

import { FileText } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { formatDate } from '@/lib/utils/formatDate'

interface ReportsListProps {
  reports: Array<{ id: string; generatedDate: string; pdfUrl: string }>
}

export function ReportsList({ reports }: ReportsListProps) {
  const { t, locale } = useLanguage()

  if (reports.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noReportsYet')}</p>
  }

  return (
    <ul className="grid gap-2">
      {reports.map((report) => (
        <li key={report.id}>
          <a
            href={report.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-accent/50 flex items-center gap-3 rounded-xl border p-3 text-sm"
          >
            <FileText className="text-accent-blue size-4 shrink-0" aria-hidden />
            <span className="flex-1">
              {t('reportsHeading')} · {formatDate(report.generatedDate, locale)}
            </span>
            <span className="text-primary text-xs font-medium">PDF</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
