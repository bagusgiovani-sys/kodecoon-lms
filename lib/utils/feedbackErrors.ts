import { NextResponse } from 'next/server'

export function feedbackError(error: { code?: string }) {
  const status = error.code === '42501' ? 404
    : ['P0002', '23505'].includes(error.code ?? '') ? 409
      : ['22023', '23514', '23502', '23503', '22P02'].includes(error.code ?? '') ? 422 : 500
  return NextResponse.json({ error: status === 404 ? 'Feedback unavailable.'
    : status === 409 ? 'Feedback changed, revision already published, or request ID reused. Reload before retrying.'
      : status === 422 ? 'Invalid feedback.' : 'Unable to save feedback.' }, { status })
}
