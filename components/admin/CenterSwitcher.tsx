'use client'

import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCenter } from '@/components/admin/CenterProvider'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

// Persistent dropdown in the admin header, present on every /admin/* route
// (PRD note on Center Switcher).
export function CenterSwitcher() {
  const { centers, activeCenterId, setActiveCenterId } = useCenter()
  const { t } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <Building2 className="text-muted-foreground size-4" aria-hidden />
      <Select
        value={activeCenterId}
        onValueChange={(id) => {
          if (id) setActiveCenterId(id)
        }}
      >
        <SelectTrigger size="sm" aria-label={t('centerSwitcherLabel')}>
          <SelectValue placeholder={t('centerSwitcherLabel')} />
        </SelectTrigger>
        <SelectContent>
          {centers.map((center) => (
            <SelectItem key={center.id} value={center.id}>
              {center.name} · {center.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
