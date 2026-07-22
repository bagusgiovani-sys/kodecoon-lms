import { z } from 'zod'

export const draftReportSchema = z.object({
  classId: z.uuid(),
  rawNotes: z.string().trim().min(1, 'Write some notes first'),
})

export const exportReportSchema = z.object({
  classId: z.uuid(),
  finalText: z.string().trim().min(1, 'Report text cannot be empty'),
  templateId: z.uuid(),
})
