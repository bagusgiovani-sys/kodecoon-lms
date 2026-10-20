import { z } from 'zod'

export const assignmentContent = z.strictObject({
  title: z.string().trim().min(1).max(200), brief: z.string().max(20000),
  dueAt: z.iso.datetime({ offset: true }).nullable(), courseLessonId: z.uuid().nullable(),
})
export const createAssignment = z.strictObject({ id: z.uuid(), requestId: z.uuid(), expectedRevision: z.literal(0), content: assignmentContent })
export const editAssignment = z.strictObject({ requestId: z.uuid(), expectedRevision: z.number().int().min(1), content: assignmentContent })
export const assignmentListQuery = z.strictObject({ after: z.uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(30) })
export const assignmentTransition = z.strictObject({ requestId: z.uuid(), expectedRevision: z.number().int().min(1) })
