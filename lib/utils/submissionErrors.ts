import { NextResponse } from 'next/server'

export function submissionError(error: { code?: string }) {
  const status = error.code === '42501' ? 404
    : ['P0002', '23505'].includes(error.code ?? '') ? 409
      : ['22023', '23514', '23502', '23503', '22P02', '22003'].includes(error.code ?? '') ? 422 : 500
  return NextResponse.json({ error: status === 404 ? 'Submission unavailable.'
    : status === 409 ? 'Submission or review changed, submissions closed, or request ID reused. Reload before retrying.'
      : status === 422 ? 'Invalid submission or review.' : 'Unable to save submission or review.' }, { status })
}
