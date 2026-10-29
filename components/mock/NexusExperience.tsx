'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { NexusSplash } from './DigitalSplash'
import { useNexusTheme } from './NexusTheme'
import { AnimatePresence, motion, MotionConfig, useAnimate } from 'framer-motion'

export function useDebouncedValue<T>(value: T, delay = 250) {
  const [settled, setSettled] = useState(value)
  useEffect(() => { const timer = setTimeout(() => setSettled(value), delay); return () => clearTimeout(timer) }, [value, delay])
  return settled
}

export function PageSkeleton() {
  return <div role="status" aria-label="Loading page" className="space-y-6"><span className="sr-only">Loading page…</span><div className="nexus-skeleton h-9 w-2/3 rounded-lg" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="nexus-skeleton h-28 rounded-2xl" />)}</div><div className="nexus-skeleton h-64 rounded-2xl" /></div>
}

// Delegated motion also covers native links, tab buttons, and controls in lazy pages.
interface WelcomeRequest { name: string; destination: string }

export function Experience({ children }: { children: ReactNode }) {
  useNexusTheme()
  const [scope, animate] = useAnimate()
  const reduced = false
  const [opening, setOpening] = useState(true)
  const [welcome, setWelcome] = useState<WelcomeRequest | null>(null)
  const [revealing, setRevealing] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setOpening(false), 5200); return () => clearTimeout(timer) }, [])
  useEffect(() => {
    const listen = (event: Event) => {
      const detail = (event as CustomEvent<WelcomeRequest>).detail
      if (detail?.name && detail?.destination) { setWelcome(detail); setRevealing(false) }
    }
    window.addEventListener('kodenexus:welcome', listen)
    return () => window.removeEventListener('kodenexus:welcome', listen)
  }, [])
  useEffect(() => {
    if (!welcome) return
    // Navigation happens immediately; only the welcome artwork is delayed.
    // A delayed navigation could otherwise pull staff away from a later tab.
    const hold = Math.min(4500, Array.from(`Welcome, ${welcome.name}`).length * 75 + 900)
    const startTimer = window.setTimeout(() => setRevealing(true), hold)
    // Framer Motion's completion callback is the normal cleanup path. Keep a
    // timer as a fallback so a reduced-motion/browser interruption cannot
    // leave an invisible full-screen layer covering the workspace.
    const fallbackTimer = window.setTimeout(() => {
      setWelcome(current => current === welcome ? null : current)
      setRevealing(false)
    }, hold + 1500)
    return () => { window.clearTimeout(startTimer); window.clearTimeout(fallbackTimer) }
  }, [welcome])
  function target(event: React.SyntheticEvent): HTMLElement | null {
    return event.target instanceof Element ? event.target.closest<HTMLElement>('button:not(:disabled),a[href],input[type=checkbox]') : null
  }
  return <MotionConfig reducedMotion="never"><div ref={scope}
    onPointerOver={e => { const el = target(e); if (el && !reduced) void animate(el, { scale: 1.015 }, { duration: .15 }) }}
    onPointerOut={e => { const el = target(e); if (el && !reduced) void animate(el, { scale: 1 }, { duration: .15 }) }}
    onPointerDown={e => { const el = target(e); if (el && !reduced) void animate(el, { scale: .97 }, { duration: .08 }) }}
    onPointerUp={e => { const el = target(e); if (el && !reduced) void animate(el, { scale: 1 }, { duration: .16 }) }}
    >
    <div style={{ visibility: opening ? 'hidden' : 'visible' }}>{!opening && children}</div><AnimatePresence>{opening && <NexusSplash />}</AnimatePresence>{welcome && <WelcomeTransition name={welcome.name} revealing={revealing} onRevealed={() => { setWelcome(null); setRevealing(false) }} />}
  </div></MotionConfig>
}

export function PageTransition({ children, pageKey }: { children: ReactNode; pageKey: string }) {
  // Do not wait for an exit animation before mounting the next tab. A keyed
  // enter-only section keeps the shell controls live and makes route changes
  // render immediately even if an earlier animation was interrupted.
  return <motion.div key={pageKey} initial={{ opacity: 0, y: 18, filter: 'blur(2px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: .32, ease: [.22, 1, .36, 1] }}>{children}</motion.div>
}

function WelcomeTransition({ name, revealing, onRevealed }: { name: string; revealing: boolean; onRevealed: () => void }) {
  const phrase = `Welcome, ${name}`
  const [visibleCount, setVisibleCount] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setVisibleCount(count => Math.min(count + 1, phrase.length)), 65)
    return () => window.clearInterval(timer)
  }, [phrase.length])
  return <motion.div role="status" aria-live="polite" aria-label={phrase} className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-background px-4" initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }} animate={{ opacity: 1, clipPath: revealing ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)' }} transition={{ duration: revealing ? .92 : .42, ease: [.22, 1, .36, 1] }} onAnimationComplete={() => { if (revealing) onRevealed() }}>
    <div aria-hidden className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--primary) 18%,transparent),transparent 55%),radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--accent) 38%,transparent),transparent 62%)' }} />
    <div className="relative flex max-w-full items-center whitespace-nowrap font-mono text-[clamp(1.25rem,4vw,3.75rem)] font-semibold tracking-normal text-foreground"><span aria-hidden>{phrase.slice(0, visibleCount)}</span><motion.span aria-hidden className="inline-block w-[.65ch] shrink-0 bg-primary" style={{ height: '1em' }} animate={{ opacity: [1,0] }} transition={{ duration: .72, repeat: Infinity, ease: 'linear' }} /></div>
  </motion.div>
}
