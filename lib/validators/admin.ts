import { z } from 'zod'

export const addTeacherSchema = z.object({
  name: z.string().trim().min(1, 'Enter the teacher name'),
  email: z.email('Enter a valid email'),
})

export const assignSessionSchema = z.object({
  teacherId: z.uuid(),
})

export const addLessonSchema = z.object({
  title: z.string().trim().min(1, 'Enter a lesson title'),
  description: z.string().trim().optional(),
})

export const updateLessonSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    sequenceNumber: z.number().int().min(1).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.sequenceNumber !== undefined,
    { message: 'Nothing to update' }
  )
