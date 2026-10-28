'use client'

import { useEffect, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Download } from 'lucide-react'
import { Action, dateLabel } from './MockUI'

export function ReportPrintButton({ studentName, date, text }: { studentName: string; date: string; text: string }) {
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    const finished = () => setPrinting(false)
    window.addEventListener('afterprint', finished)
    return () => window.removeEventListener('afterprint', finished)
  }, [])

  return <>
    <Action secondary className="print:hidden" disabled={!text.trim()} onClick={() => {
      // Render the selected report before the browser captures its print layout.
      flushSync(() => setPrinting(true))
      window.print()
    }}><Download className="size-4" />Print / Save PDF</Action>
    {printing && createPortal(<article className="mock-print-report">
      <header><p>KodeNexus · Progress report</p><h1>{studentName}</h1><p>{dateLabel(date)}</p></header>
      <div className="mock-print-report-text">{text}</div>
      <footer>Demo learning record · Teacher-prepared report</footer>
    </article>, document.body)}
  </>
}
