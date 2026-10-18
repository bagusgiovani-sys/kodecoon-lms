import { downloadReport } from '@/lib/reports/download'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return downloadReport((await params).id, true)
}
