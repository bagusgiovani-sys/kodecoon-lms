import { z } from 'zod'

export const createSessionSchema = z.object({
  id: z.uuid().optional(),
  classId: z.uuid(),
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }).optional(),
})

export const logSessionSchema = z.object({
  requestId: z.uuid(),
  expectedRevision: z.number().int().nonnegative(),
  attendance: z.array(
    z.object({
      studentId: z.uuid(),
      status: z.enum(['present', 'absent', 'unmarked']),
    })
  ),
  video: z
    .object({
      driveFileId: z.string().min(1),
      driveLink: z.url(),
    })
    .optional(),
  notes: z.string().max(10000).optional(),
  lessonCompletions: z.array(
    z.object({
      studentId: z.uuid(),
      lessonId: z.uuid(),
    })
  ),
})
