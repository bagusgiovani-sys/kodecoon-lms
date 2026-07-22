'use client'

import { useState } from 'react'
import { CheckCircle2, HardDriveUpload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { extractDriveFileId, openDrivePicker } from '@/lib/drive/picker'

export interface SessionVideo {
  driveFileId: string
  driveLink: string
  name?: string
}

interface VideoPickerProps {
  value: SessionVideo | null
  onChange: (value: SessionVideo | null) => void
}

// Google Drive Picker with a paste-a-link fallback (PRD). Picker failure is
// never fatal — the link path always works, and the session saves without a
// video regardless.
export function VideoPicker({ value, onChange }: VideoPickerProps) {
  const { t } = useLanguage()
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)

  async function handlePick() {
    setError(null)
    setOpening(true)
    try {
      const picked = await openDrivePicker()
      if (picked) {
        onChange({ driveFileId: picked.fileId, driveLink: picked.url, name: picked.name })
      }
    } catch (err) {
      console.warn('[VideoPicker]', err)
      setError(t('orPasteLink'))
    } finally {
      setOpening(false)
    }
  }

  function handleLinkChange(next: string) {
    setLink(next)
    setError(null)
    if (!next.trim()) {
      if (value) onChange(null)
      return
    }
    const fileId = extractDriveFileId(next.trim())
    if (fileId) {
      onChange({ driveFileId: fileId, driveLink: next.trim() })
    }
  }

  if (value) {
    return (
      <div className="border-primary/40 bg-primary/5 flex items-center gap-3 rounded-xl border p-3">
        <CheckCircle2 className="text-primary size-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{t('videoAttached')}</p>
          <p className="text-muted-foreground truncate text-xs">
            {value.name ?? value.driveLink}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange(null)
            setLink('')
          }}
          aria-label={t('delete')}
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={handlePick}
        disabled={opening}
      >
        <HardDriveUpload className="size-4" />
        {t('pickFromDrive')}
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground shrink-0 text-xs">
          {t('orPasteLink')}
        </span>
        <Input
          value={link}
          onChange={(e) => handleLinkChange(e.target.value)}
          placeholder={t('driveLinkPlaceholder')}
          inputMode="url"
        />
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  )
}
