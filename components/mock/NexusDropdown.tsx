'use client'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

export interface NexusOption { id: string; label: string; detail?: string; swatch?: string }
interface MenuPosition { left: number; top: number; width: number; maxHeight: number; opensUp: boolean }

function DropdownSurface({ menuRef, label, position, children }: {
  menuRef: RefObject<HTMLDivElement | null>; label: string; position: MenuPosition; children: ReactNode
}) {
  const present = useIsPresent()
  // The closing artwork must never intercept the next tab or center click.
  return <motion.div ref={menuRef} role="listbox" aria-label={label} aria-hidden={!present} inert={!present}
    initial={{ opacity: 0, y: position.opensUp ? 8 : -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: position.opensUp ? 6 : -4, scale: .98 }} transition={{ duration: .16, ease: [.22, 1, .36, 1] }}
    style={{ position: 'fixed', left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight, pointerEvents: present ? 'auto' : 'none' }}
    className="z-[10000] overflow-y-auto overscroll-contain rounded-2xl border border-primary/25 bg-popover/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,.32)] backdrop-blur-2xl">{children}</motion.div>
}

export function NexusDropdown({ label, value, options, onChange, icon, compactOnMobile = false, align = 'left' }: {
  label: string
  value: string
  options: NexusOption[]
  onChange: (id: string) => void
  icon: ReactNode
  compactOnMobile?: boolean
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.id === value)

  function placeMenu() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const width = Math.max(216, Math.min(Math.max(rect.width, 240), viewportWidth - 16))
    const left = Math.max(8, Math.min(align === 'right' ? rect.right - width : rect.left, viewportWidth - width - 8))
    const desiredHeight = Math.min(options.length * 58 + 16, viewportHeight * .62, viewportHeight - 24)
    const roomBelow = viewportHeight - rect.bottom - 12
    const roomAbove = rect.top - 12
    const opensUp = roomBelow < Math.min(desiredHeight, 168) && roomAbove > roomBelow
    const available = Math.max(96, Math.min(desiredHeight, opensUp ? roomAbove : roomBelow))
    const top = opensUp ? Math.max(8, rect.top - available - 8) : Math.min(viewportHeight - available - 8, rect.bottom + 8)
    setPosition({ left, top, width, maxHeight: available, opensUp })
  }

  useEffect(() => {
    if (!open) return
    function dismissOutside(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && (triggerRef.current?.contains(target) || menuRef.current?.contains(target))) return
      setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    const dismissOnViewportChange = () => setOpen(false)
    const dismissOnPageScroll = (event: Event) => {
      // Scrolling the options is not a change to the trigger's position.
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', dismissOnViewportChange)
    window.addEventListener('scroll', dismissOnPageScroll, true)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', dismissOnViewportChange)
      window.removeEventListener('scroll', dismissOnPageScroll, true)
    }
  }, [open])

  function toggleMenu() {
    if (open) { setOpen(false); return }
    placeMenu()
    setOpen(true)
  }

  const menu = typeof document !== 'undefined' && position ? createPortal(
    <AnimatePresence>
      {open && <DropdownSurface menuRef={menuRef} label={label} position={position}>
        {options.map(option => <button type="button" role="option" aria-selected={value === option.id} key={option.id} onClick={() => { onChange(option.id); setOpen(false) }} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value === option.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
          {option.swatch ? <span className="size-4 shrink-0 rounded-full border border-border shadow-sm" style={{ backgroundColor: option.swatch }} /> : <span className="size-2 shrink-0 rounded-full bg-primary/50" />}
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{option.label}</span>{option.detail && <span className="block truncate text-[10px] text-muted-foreground">{option.detail}</span>}</span>
          {value === option.id && <Check aria-hidden className="size-4 shrink-0" />}
        </button>)}
      </DropdownSurface>}
    </AnimatePresence>, document.body
  ) : null

  return <>
    <button ref={triggerRef} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={toggleMenu} className={`group flex min-h-11 items-center gap-3 rounded-xl border border-primary/25 bg-card/90 px-3 text-left shadow-[0_5px_24px_color-mix(in_srgb,var(--primary)_8%,transparent)] transition hover:border-primary/60 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compactOnMobile ? 'min-w-11 justify-center px-2 sm:min-w-40 sm:justify-start sm:px-3' : 'min-w-40'}`}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span className={compactOnMobile ? 'hidden min-w-0 flex-1 sm:block' : 'min-w-0 flex-1'}><span className="block text-[9px] font-semibold uppercase tracking-[.18em] text-muted-foreground">{label}</span><span className="block max-w-44 truncate text-sm font-semibold text-foreground">{selected?.label ?? 'Select'}</span></span>
      <ChevronDown aria-hidden className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''} ${compactOnMobile ? 'hidden sm:block' : ''}`} />
    </button>
    {menu}
  </>
}
