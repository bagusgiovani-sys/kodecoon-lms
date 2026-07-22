import 'server-only'

// Server-side Drive helper. KOMS never touches video bytes (CLAUDE.md §11) —
// this only confirms a picked/pasted file is reachable before the link is
// saved. Validation failure is NEVER a save blocker (PRD edge case: session
// saves without video).

export interface DriveFileCheck {
  ok: boolean
  fileName?: string
}

// Works for files shared "anyone with the link" — which is what the parent-
// facing preview requires anyway. Uses the public Drive API v3 with the
// Picker API key; soft-fails on any error.
export async function validateDriveFile(fileId: string): Promise<DriveFileCheck> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY
  if (!apiKey) return { ok: true } // not configured yet — don't block saves

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!response.ok) return { ok: false }
    const data = (await response.json()) as { id: string; name?: string }
    return { ok: true, fileName: data.name }
  } catch (err) {
    console.warn('[drive] file validation failed (non-blocking):', err)
    return { ok: false }
  }
}
