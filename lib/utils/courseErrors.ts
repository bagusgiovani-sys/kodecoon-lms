import { NextResponse } from 'next/server'

export function courseError(error: { code?: string }) {
  const status = error.code === '42501' ? 404
    : ['P0002', '23505'].includes(error.code ?? '') ? 409
      : ['22023', '23514', '23502', '22P02', '22003'].includes(error.code ?? '') ? 422 : 500
  const message = status === 409 ? 'Course content changed, the request ID was reused, or that lesson position is taken. Reload before retrying.'
    : status === 422 ? 'Invalid course content.' : status === 404 ? 'Course unavailable.' : 'Unable to save course content.'
  return NextResponse.json({ error: message }, { status })
}
