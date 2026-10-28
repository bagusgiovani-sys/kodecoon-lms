'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function NexusSplash() {
  const initializing = 'Initializing . . .'
  const [shown, setShown] = useState(0)
  const [blinkDuration, setBlinkDuration] = useState(.42)
  useEffect(() => {
    let typeTimer: number | undefined
    let blinkTimer: number | undefined
    const startTimer = window.setTimeout(() => {
      let index = 0
      typeTimer = window.setInterval(() => {
        index += 1
        setShown(index)
        if (index >= initializing.length && typeTimer) window.clearInterval(typeTimer)
      }, 42)
      blinkTimer = window.setInterval(() => setBlinkDuration(value => Math.max(.055, value * .92)), 100)
    }, 3200)
    return () => { window.clearTimeout(startTimer); if (typeTimer) window.clearInterval(typeTimer); if (blinkTimer) window.clearInterval(blinkTimer) }
  }, [initializing.length])
  return <motion.div data-testid="nexus-splash" role="status" aria-label="Opening KodeNexus" className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background" exit={{ opacity: 0 }} transition={{ duration: .3 }}>
    <div aria-hidden className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 73% 32%,color-mix(in srgb,var(--primary) 22%,transparent),transparent 34%),radial-gradient(ellipse at 18% 72%,color-mix(in srgb,var(--primary) 14%,transparent),transparent 38%),radial-gradient(ellipse at 49% 0%,color-mix(in srgb,var(--accent) 45%,transparent),transparent 48%)' }} />
    <div aria-hidden className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle,color-mix(in srgb,var(--nexus-bright) 70%,transparent) 1px,transparent 2px),radial-gradient(circle,color-mix(in srgb,var(--primary) 60%,transparent) 1px,transparent 2px)', backgroundSize: '173px 131px,211px 179px', filter: 'blur(3px)' }} />
    <motion.div data-testid="nexus-wire" aria-hidden className="pointer-events-none absolute z-10 w-[3px]" style={{ left: 'calc(50% - 1.5px)', top: '27%', height: '29%', background: 'linear-gradient(90deg,transparent,var(--nexus-bright) 35%,var(--primary) 65%,transparent)', boxShadow: '0 0 8px var(--primary),0 0 18px var(--nexus-bright)' }} initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)', 'inset(0% 0 0 0)', 'inset(0% 0 100% 0)'] }} transition={{ duration: 2.1, delay: .1, times: [0,.25,.78,1], ease: 'linear' }} />
    <motion.span data-testid="nexus-wire-node" aria-hidden className="absolute left-1/2 top-[27%] z-10 size-2 -translate-x-1/2 rounded-full bg-[var(--nexus-bright)] shadow-[0_0_10px_var(--primary),0_0_22px_var(--nexus-bright)]" initial={{ opacity: 0, scale: .2 }} animate={{ opacity: [0,1,.75], scale: [0,2.8,1.5] }} transition={{ duration: .55, delay: .55, ease: 'easeOut' }} />
    <motion.div className="relative z-20 h-80 w-80 max-w-[90vw]" initial={{ opacity: 0, scale: .92, clipPath: 'inset(0 0 100% 0)' }} animate={{ opacity: 1, scale: 1, clipPath: 'inset(0 0 0% 0)' }} transition={{ opacity: { delay: 1.3, duration: .35 }, scale: { delay: 1.3, duration: .6 }, clipPath: { delay: 1.3, duration: .8, ease: 'easeOut' } }}>
      <svg aria-hidden viewBox="0 0 320 320" className="absolute inset-0 h-full w-full text-primary/50"><motion.circle cx="160" cy="135" r="94" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="85 30 4 30" style={{ transformOrigin: '160px 135px' }} animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} /><motion.circle cx="160" cy="135" r="104" fill="none" stroke="currentColor" strokeDasharray="2 14" style={{ transformOrigin: '160px 135px' }} animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} /><path d="M27 135h24m218 0h24M160 10v20m0 211v20" stroke="currentColor" /></svg>
      <div role="img" aria-label="Kodecoon logo in electric blue" className="absolute inset-0" style={{ maskImage: 'url(/brand/kodecoon-transparent.png)', WebkitMaskImage: 'url(/brand/kodecoon-transparent.png)', maskSize: 'contain', maskPosition: 'center', maskRepeat: 'no-repeat', background: 'linear-gradient(145deg,var(--nexus-bright) 15%,var(--primary) 50%,var(--nexus-dim) 80%)', filter: 'drop-shadow(0 0 12px color-mix(in srgb,var(--primary) 55%,transparent))' }}>
        <motion.div data-testid="logo-data-scan" className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-white to-transparent" initial={{ y: 10, opacity: 0 }} animate={{ y: [10,300], opacity: [.2,.95,.2] }} transition={{ duration: 2.4, delay: 1.6, repeat: Infinity, ease: 'linear' }} />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent 0px,transparent 3px,color-mix(in srgb,var(--background) 65%,transparent) 4px)' }} />
      </div>
    </motion.div>
    <motion.p initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }} animate={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }} transition={{ delay: 1.45, duration: .65, ease: 'easeOut' }} className="relative z-20 -mt-12 text-sm font-medium tracking-[.2em] text-primary">Beyond Coding</motion.p>
    <motion.p className="relative z-20 mt-9 bg-clip-text px-4 text-center text-4xl font-semibold uppercase tracking-[.18em] text-transparent sm:text-5xl" style={{ backgroundImage: 'linear-gradient(110deg,var(--nexus-dim) 10%,var(--nexus-bright) 40%,var(--primary) 55%,var(--nexus-bright) 80%)', backgroundSize: '220% 100%', filter: 'drop-shadow(0 0 14px color-mix(in srgb,var(--primary) 40%,transparent))' }} animate={{ backgroundPosition: ['0% 50%', '220% 50%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>Kode Nexus</motion.p>
    <motion.p aria-label={initializing} className="absolute bottom-[9vh] z-20 flex min-h-6 items-center font-mono text-xs tracking-[.08em] text-primary sm:text-sm"><span>{initializing.slice(0, shown)}</span>{shown > 0 && <motion.span aria-hidden className="ml-1 inline-block h-4 w-2 bg-primary" animate={{ opacity: [1,0] }} transition={{ duration: blinkDuration, repeat: Infinity, ease: 'linear' }} />}</motion.p>
    <span className="sr-only">Opening your academy workspace</span>
  </motion.div>
}
