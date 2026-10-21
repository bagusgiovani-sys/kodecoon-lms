import { z } from 'zod'
import { createFeedback, editFeedback, feedbackTransition } from '@/lib/validators/feedback'

export const feedbackRequest = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('create'), body: createFeedback }),
  z.strictObject({ kind: z.literal('edit'), id: z.uuid(), body: editFeedback }),
  z.strictObject({ kind: z.literal('publish'), id: z.uuid(), body: feedbackTransition }),
  z.strictObject({ kind: z.literal('withdraw'), id: z.uuid(), body: feedbackTransition }),
])
export type FeedbackRequest = z.infer<typeof feedbackRequest>

export function feedbackRequestTarget(studentId: string, operation: FeedbackRequest) {
  switch (operation.kind) {
    case 'create': return { url: `/api/students/${studentId}/feedback`, method: 'POST' }
    case 'edit': return { url: `/api/feedback/${operation.id}`, method: 'PATCH' }
    case 'publish': return { url: `/api/feedback/${operation.id}/publications`, method: 'POST' }
    case 'withdraw': return { url: `/api/feedback-publications/${operation.id}/withdraw`, method: 'POST' }
  }
}
