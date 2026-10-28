'use client'
import { ChevronDown } from 'lucide-react'
import { type ReactNode } from 'react'

export interface NexusOption { id: string; label: string; detail?: string; swatch?: string }
export function NexusDropdown({ label, value, options, onChange, icon }: { label: string; value: string; options: NexusOption[]; onChange: (id: string) => void; icon: ReactNode }) {
  const selected = options.find(o => o.id === value)
  return <label className="relative flex min-h-12 min-w-40 items-center gap-3 rounded-xl border border-primary/25 bg-card/90 px-3 shadow-[0_5px_24px_color-mix(in_srgb,var(--primary)_8%,transparent)] transition hover:border-primary/60 hover:bg-secondary focus-within:ring-2 focus-within:ring-primary">
    {selected?.swatch ? <span aria-hidden className="size-4 shrink-0 rounded-full border border-border" style={{ backgroundColor: selected.swatch }} /> : <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>}
    <span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold uppercase tracking-[.18em] text-muted-foreground">{label}</span><span className="block truncate text-sm font-semibold text-foreground">{selected?.label ?? 'Select'}</span></span>
    <select aria-label={label} value={value} onChange={event => onChange(event.currentTarget.value)} className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0">
      {options.map(option => <option key={option.id} value={option.id}>{option.detail ? `${option.label} — ${option.detail}` : option.label}</option>)}
    </select>
    <ChevronDown aria-hidden className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
  </label>
}
