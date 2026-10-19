import { z } from 'zod'

export const courseContent = z.strictObject({
  title: z.string().trim().min(1).max(200),
  category: z.string().max(100), age_range: z.string().max(100), level: z.string().max(100),
  description: z.string().max(10000), prerequisites: z.string().max(10000), archived: z.boolean(),
})
export const lessonContent = z.strictObject({
  title: z.string().trim().min(1).max(200), sequence: z.number().int().min(1).max(10000),
  minutes: z.number().int().min(1).max(1440), objective: z.string().max(10000),
  materials: z.string().max(10000), steps: z.string().max(20000), evidence: z.string().max(10000), archived: z.boolean(),
})
export const courseWrite = z.strictObject({
  requestId: z.uuid(), expectedRevision: z.number().int().min(0).max(2147483646), content: courseContent,
})
export const lessonWrite = courseWrite.extend({ content: lessonContent })
export const courseCreate = courseWrite.extend({ id: z.uuid(), expectedRevision: z.literal(0) })
export const libraryQuery = z.strictObject({
  after: z.uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(30),
  archived: z.enum(['true', 'false']).default('false'),
})
