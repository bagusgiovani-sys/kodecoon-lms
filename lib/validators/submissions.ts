import { z } from 'zod'

const projectUrl = z.string().max(2048)
  .regex(/^https:\/\/[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?([/?#][^\s\\]*)?$/)
  .refine(value => {
    if (/\s/.test(value)) return false
    const port = value.match(/^https:\/\/[^/?#:]+:([0-9]+)/)?.[1]
    return !port || (Number(port) >= 1 && Number(port) <= 65535)
  })
export const createSubmission = z.strictObject({
  requestId: z.uuid(), projectUrl, reflection: z.string().trim().min(1).max(10000),
})
export const createReview = z.strictObject({
  requestId: z.uuid(), expectedVersion: z.number().int().min(1).max(2147483646),
  expectedReviewId: z.uuid().nullable(), outcome: z.enum(['revision', 'approved']),
  feedback: z.string().trim().min(1).max(10000),
})
export const submissionHistoryQuery = z.strictObject({
  before: z.coerce.number().int().min(1).max(2147483647).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})
