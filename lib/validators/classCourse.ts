import { z } from 'zod'

export const setClassCourse = z.strictObject({
  requestId: z.uuid(), courseId: z.uuid().nullable(),
})
