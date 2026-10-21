import { z } from 'zod'

export const feedbackContent = z.strictObject({
  title: z.string().trim().min(1).max(200), lessonId: z.uuid().nullable(),
  strengths: z.string().trim().min(1).max(10000), nextSteps: z.string().trim().min(1).max(10000),
  rating: z.enum(['Getting started', 'Growing', 'Confident', 'Independent']),
})
const revision = z.number().int().min(1).max(2147483647)
export const createFeedback = z.strictObject({ id: z.uuid(), classId: z.uuid(), requestId: z.uuid(), expectedRevision: z.literal(0), content: feedbackContent })
export const editFeedback = z.strictObject({ requestId: z.uuid(), expectedRevision: revision, content: feedbackContent })
export const feedbackTransition = z.strictObject({ requestId: z.uuid(), expectedRevision: revision })
export const feedbackListQuery = z.strictObject({ after: z.uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(30) })
