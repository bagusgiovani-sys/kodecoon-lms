'use client'

// Client-side Google Drive Picker loader (SDD.md §6): loads Google's script
// tags on demand, gets an OAuth token via Google Identity Services, opens the
// Picker, and hands back { fileId, url }. Raw video bytes never touch KOMS.

export interface PickedDriveFile {
  fileId: string
  url: string
  name: string
}

interface TokenClient {
  requestAccessToken: () => void
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Google's gapi/picker
   globals ship no types; confined to this module. */
declare global {
  interface Window {
    gapi: any
    google: any
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

let cachedAccessToken: string | null = null

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken

  await loadScript('https://accounts.google.com/gsi/client')

  return new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
    if (!clientId) {
      reject(new Error('Google OAuth client ID not configured'))
      return
    }
    const tokenClient: TokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.access_token) {
          cachedAccessToken = response.access_token
          resolve(response.access_token)
        } else {
          reject(new Error(response.error ?? 'Drive authorization failed'))
        }
      },
    })
    tokenClient.requestAccessToken()
  })
}

export async function openDrivePicker(): Promise<PickedDriveFile | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY
  if (!apiKey) throw new Error('Google Picker API key not configured')

  const [accessToken] = await Promise.all([
    getAccessToken(),
    loadScript('https://apis.google.com/js/api.js').then(
      () =>
        new Promise<void>((resolve) =>
          window.gapi.load('picker', () => resolve())
        )
    ),
  ])

  return new Promise((resolve) => {
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS_VIDEOS)
      .addView(new window.google.picker.DocsUploadView())
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback((data: {
        action: string
        docs?: Array<{ id: string; url: string; name: string }>
      }) => {
        if (data.action === window.google.picker.Action.PICKED && data.docs?.[0]) {
          const doc = data.docs[0]
          resolve({ fileId: doc.id, url: doc.url, name: doc.name })
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null)
        }
      })
      .build()
    picker.setVisible(true)
  })
}

// Fallback path: teacher pastes a Drive link instead of using the Picker.
export function extractDriveFileId(link: string): string | null {
  const patterns = [
    /\/file\/d\/([\w-]+)/, // https://drive.google.com/file/d/<id>/view
    /[?&]id=([\w-]+)/, // https://drive.google.com/open?id=<id>
  ]
  for (const pattern of patterns) {
    const match = link.match(pattern)
    if (match) return match[1]
  }
  return null
}
