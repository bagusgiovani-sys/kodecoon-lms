// Tiny typed fetch wrapper for client-side calls to our own API routes.
// Throws ApiRequestError so callers can show the server's plain-language
// message (SDD.md §8) instead of a generic one.

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null

  if (!response.ok) {
    const message =
      data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${response.status})`
    throw new ApiRequestError(response.status, message)
  }

  return data as T
}
