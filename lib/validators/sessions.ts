import { z } from 'zod'

export const createSessionSchema = z.object({
  classId: z.uuid(),
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }).optional(),
})

export const logSessionSchema = z.object({
  attendance: z.array(
    z.object({
      studentId: z.uuid(),
      status: z.enum(['present', 'absent']),
    })
  ),
  video: z
    .object({
      driveFileId: z.string().min(1),
      driveLink: z.url(),
    })
    .optional(),
  notes: z.string().optional(),
  lessonCompletions: z.array(
    z.object({
      studentId: z.uuid(),
      lessonId: z.uuid(),
    })
  ),
})
