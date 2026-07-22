import { z } from 'zod'

export const staffLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const magicLinkSchema = z.object({
  email: z.email(),
})
