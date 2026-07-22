import { z } from 'zod'

export const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Enter a class name'),
  ageBracket: z.string().trim().min(1).optional(),
})

export const addStudentSchema = z.object({
  name: z.string().trim().min(1, 'Enter the student name'),
  parentEmail: z.email('Enter a valid parent email'),
})
