'use client'
import { DemoLink as Link, navigateDemo } from './DemoLink'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Building2, ShieldCheck } from 'lucide-react'
import type { DemoIdentity } from '@/lib/mock/nexus'
import { useMock } from './MockProvider'
import { Action, Field, inputStyle, Panel, Pill } from './MockUI'
import { KodecoonIcon } from './KodecoonIcon'
import { ThemeSelector } from './NexusTheme'

const loginStreams = Array.from({ length: 21 }, (_, i) => ({ x: 3 + i * 4.7, delay: i * .14, duration: 4.2 + (i % 5) * .55 }))

export function NexusLogin({ parent }: { parent: boolean }) {
  const { data, signIn } = useMock()
  const guardians = [...new Map(data.students.map(s => [s.parentEmail.toLowerCase(), { email: s.parentEmail.toLowerCase(), name: s.parentName }])).values()]
  const [role, setRole] = useState<'teacher' | 'center_manager'>('teacher')
  const [signingIn, setSigningIn] = useState(false)
  const [email, setEmail] = useState(() => {
    const selected = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('email')
    return guardians.some(g => g.email === selected) ? selected! : guardians[0]?.email ?? ''
  })
  return <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, ease: [.22, 1, .36, 1] }} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 73% 32%,color-mix(in srgb,var(--primary) 20%,transparent),transparent 34%),radial-gradient(ellipse at 18% 72%,color-mix(in srgb,var(--primary) 13%,transparent),transparent 38%),radial-gradient(ellipse at 49% 0%,color-mix(in srgb,var(--accent) 40%,transparent),transparent 48%)' }} />
    <div className="nexus-theme-dock fixed z-50 rounded-full border border-border/70 bg-background/90 p-1.5 shadow-lg sm:absolute sm:rounded-xl"><ThemeSelector compactOnMobile /></div>
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">{loginStreams.map((s,i) => <motion.span key={i} className="absolute top-0 w-[2px]" style={{ left: `${s.x}%`, height: 170 + i % 3 * 60, background: 'linear-gradient(to top,transparent,var(--primary),var(--nexus-bright),transparent)', boxShadow: '0 0 8px color-mix(in srgb,var(--primary) 55%,transparent)' }} initial={{ y: '110vh', opacity: 0 }} animate={{ y: ['110vh','-35vh'], opacity: [0,.52,0] }} transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'linear' }}><span className="absolute -top-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--nexus-bright)] shadow-[0_0_9px_var(--primary)]" /></motion.span>)}</div>
    <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20"><div className="flex flex-col justify-center">
      <div className="relative z-10 mb-10 flex items-center gap-4"><motion.div initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} transition={{ duration: 2.2, ease: 'easeOut' }}><KodecoonIcon size={68} /></motion.div><div><p className="text-2xl font-semibold tracking-[.12em]">Kode Nexus</p><p className="mt-1 text-xs font-medium uppercase tracking-[.24em] text-primary">by Kodecoon</p></div></div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Every learner. Connected.</p>
      <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">One academy.<br />Individual journeys.<br /><span className="text-primary">Everything connected.</span></h1>
      <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">From the weekly timetable to a student’s latest breakthrough. Manage classes, learning, documentation and lesson packages in one place.</p>
      <div className="mt-8 flex flex-wrap gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Building2 className="size-4 text-primary" />STB · PIK · BSD</span><span className="flex items-center gap-2"><BookOpen className="size-4 text-primary" />Individual learning</span></div>
    </div><Panel className="self-center p-7 sm:p-9"><Pill tone="good">Interactive MVP demo</Pill><h2 className="mt-6 text-2xl font-semibold">{parent ? 'A window into their learning.' : 'Open your staff workspace.'}</h2><p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">{parent ? 'Choose a guardian to preview only their linked children.' : 'Add your own students and class details. Teacher and center manager have equal demo access.'}</p>
      <form className="grid gap-5" onSubmit={e => {
        e.preventDefault()
        if (signingIn) return
        const guardian = guardians.find(g => g.email === email)
        if (parent && !guardian) return
        const identity: DemoIdentity = parent ? { role: 'parent', ...guardian! } : { role, email: 'staff@example.com', name: role === 'teacher' ? 'Gio' : 'Center manager' }
        if (signIn(identity)) {
          setSigningIn(true)
          const destination = parent ? '/student' : '/staff'
          window.dispatchEvent(new CustomEvent('kodenexus:welcome', { detail: { name: identity.name, destination } }))
          navigateDemo(destination)
        }
      }}>
        {parent ? <Field title="Guardian account"><select value={email} onChange={e => setEmail(e.target.value)} required className={inputStyle}>{guardians.map(g => <option key={g.email} value={g.email}>{g.name} · {g.email}</option>)}</select></Field> : <Field title="Staff role"><select value={role} onChange={e => setRole(e.target.value as typeof role)} className={inputStyle}><option value="teacher">Teacher</option><option value="center_manager">Center manager</option></select></Field>}
        <Action type="submit" disabled={signingIn || (parent && !guardians.length)}>{signingIn ? 'Opening workspace…' : parent ? 'Open parent preview' : 'Open KodeNexus'}<ArrowRight className="size-4" /></Action>
      </form><p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Demo accounts are simulated. Use sample information; changes stay in this browser.</p>
      <div className="mt-6 border-t pt-5 text-center text-sm"><Link href={parent ? '/login' : '/student/login'} className="font-medium text-primary">{parent ? 'Choose a staff account' : 'Choose a parent preview'} →</Link></div>
    </Panel></div>
  </motion.main>
}
