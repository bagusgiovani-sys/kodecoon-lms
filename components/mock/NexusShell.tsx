'use client'
import { DemoLink as Link, navigateDemo } from './DemoLink'
import { BookOpen, CalendarDays, GraduationCap, LayoutDashboard, LogOut, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { useMock } from './MockProvider'
import { Avatar, Pill } from './MockUI'
import { PageTransition } from './NexusExperience'
import { cn } from '@/lib/utils'
import { ThemeSelector } from './NexusTheme'
import { NexusDropdown } from './NexusDropdown'
import { Building2 } from 'lucide-react'
import { KodecoonIcon } from './KodecoonIcon'
import { motion } from 'framer-motion'

const ambientStreams = [
  { left: '5%', delay: 0, duration: 15, height: '22vh' },
  { left: '15%', delay: 2, duration: 17, height: '17vh' },
  { left: '26%', delay: 4, duration: 16, height: '25vh' },
  { left: '36%', delay: 6, duration: 18, height: '19vh' },
  { left: '47%', delay: 8, duration: 15, height: '23vh' },
  { left: '58%', delay: 10, duration: 17, height: '18vh' },
  { left: '69%', delay: 12, duration: 16, height: '26vh' },
  { left: '80%', delay: 14, duration: 18, height: '20vh' },
  { left: '91%', delay: 16, duration: 15, height: '24vh' },
]

export function NexusShell({ path, centerId, children }: { path: string; centerId: string | null; children: ReactNode }) {
  const { data, identity, signOut } = useMock()
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const previousIndicator = useRef<{ x: number; width: number } | null>(null)
  const parent = identity?.role === 'parent'
  const root = `/staff/${encodeURIComponent(centerId ?? '')}`
  const tabs = parent ? [{ href: '/student', label: 'My children', icon: Users }] : centerId ? [
    { href: `${root}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${root}/schedule`, label: 'Schedule', icon: CalendarDays },
    { href: '/classes', label: 'Class Groups', icon: Users },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/attendance', label: 'Attendance', icon: CalendarDays },
    { href: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
  ] : []
  useLayoutEffect(() => {
    const nav = navRef.current, indicator = indicatorRef.current
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !indicator || !active) { if (indicator) indicator.style.opacity = '0'; return }
    const x = active.offsetLeft + 8, width = Math.max(24, active.offsetWidth - 16)
    const prior = previousIndicator.current
    indicator.style.opacity = '1'
    if (prior && (prior.x !== x || prior.width !== width)) {
      indicator.animate([{ transform: `translateX(${prior.x}px)`, width: `${prior.width}px` }, { transform: `translateX(${x}px)`, width: `${width}px` }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
    } else {
      indicator.style.transform = `translateX(${x}px)`
      indicator.style.width = `${width}px`
    }
    previousIndicator.current = { x, width }
  }, [path, centerId, parent])
  return <div className="mock-workspace relative isolate min-h-screen"><div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden">{ambientStreams.map(stream => <motion.span key={stream.left} className="absolute bottom-[-30vh] block w-px" style={{ left: stream.left, height: stream.height, background: 'linear-gradient(to top, transparent, color-mix(in srgb, var(--primary) 44%, transparent), color-mix(in srgb, var(--nexus-bright) 90%, transparent), transparent)', boxShadow: '0 0 10px color-mix(in srgb, var(--primary) 48%, transparent)' }} initial={{ y: '115vh', opacity: 0 }} animate={{ y: '-145vh', opacity: [0, .36, .32, 0] }} transition={{ duration: stream.duration, delay: stream.delay, repeat: Infinity, ease: 'linear' }}><span className="absolute -top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--nexus-bright)] shadow-[0_0_10px_var(--primary)]" /></motion.span>)}</div><div className="fixed bottom-3 right-3 z-50 rounded-xl border border-border bg-background/95 p-1.5 shadow-lg print:hidden"><ThemeSelector /></div><header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur print:hidden">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-8"><Link href={parent ? '/student' : '/staff'} className="flex items-center gap-2"><KodecoonIcon size={42} /><span><span className="block text-base font-semibold tracking-[.08em]">Kode Nexus</span><span className="block text-[9px] font-medium uppercase tracking-[.22em] text-primary">by Kodecoon</span></span></Link>
      <div className="ml-auto flex items-center gap-2"><Pill tone="good">{parent ? 'Parent preview' : 'Demo workspace'}</Pill><Avatar name={identity?.name ?? 'Staff'} /><Link href={parent ? '/student/login' : '/login'} onClick={signOut} aria-label="Log out" className="flex size-11 items-center justify-center rounded-xl hover:bg-secondary"><LogOut className="size-4" /></Link></div>
    </div>
    {!parent && <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 border-t border-border/50 px-4 py-3 sm:px-8"><NexusDropdown label="Center workspace" value={centerId ?? ''} icon={<Building2 className="size-4" />} options={[{ id: '', label: 'Choose a center', detail: 'Select your workspace' }, ...(data.centers ?? []).map(c => ({ id: c.id, label: c.name, detail: 'Center workspace' }))]} onChange={id => {
      sessionStorage.setItem('kodenexus-center', id)
      const href = id ? `/staff/${encodeURIComponent(id)}/dashboard` : '/staff'
      navigateDemo(href)
    }} /><Link href="/staff" className="ml-auto text-xs text-primary">All centers</Link></div>}
    {!!tabs.length && <nav ref={navRef} aria-label="Main navigation" className="relative mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-8">{tabs.map(({href,label,icon:Icon}) => <Link key={href} href={href} aria-current={path === href || path.startsWith(`${href}/`) ? 'page' : undefined} className={cn('relative flex min-h-12 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm', path === href || path.startsWith(`${href}/`) ? 'font-semibold text-primary' : 'text-muted-foreground')}><Icon className="size-4" />{label}</Link>)}<span ref={indicatorRef} aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" style={{ opacity: 0 }} /></nav>}
  </header><main className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10"><PageTransition pageKey={`${path}:${centerId}`}>{children}</PageTransition></main><footer className="relative z-10 mx-auto max-w-7xl px-4 pb-6 text-xs text-muted-foreground sm:px-8 print:hidden">Demo data · Changes are saved in this browser.</footer></div>
}
