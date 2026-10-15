'use client'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowUpRight, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export const inputStyle = 'min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
export function Action({ children, className, secondary, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return <button type="button" {...props} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50', secondary ? 'border bg-card hover:bg-secondary' : 'bg-primary text-primary-foreground hover:bg-primary/85', className)}>{children}</button>
}
export function LinkAction({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <a href={href} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold', secondary ? 'border hover:bg-secondary' : 'bg-primary text-primary-foreground hover:bg-primary/85')}>{children}</a>
}
export function Heading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>{action}</div>
}
export function Panel({ title, subtitle, action, children, className }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn('mock-panel min-w-0 rounded-2xl border bg-card p-5 sm:p-6', className)}>{title && <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>{action}</div>}{children}</section>
}
export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'good' | 'warning' }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold', tone === 'good' ? 'bg-primary/10 text-primary' : tone === 'warning' ? 'bg-destructive/15 text-foreground' : 'bg-secondary text-muted-foreground')}>{children}</span>
}
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 font-semibold text-primary', large ? 'size-16 text-xl' : 'size-10 text-xs')}>{name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
}
export function Empty({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">{title}</p><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>
}
export function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium"><span>{title}</span>{children}</label>
}
export function Modal({ open, title, description, close, children }: { open: boolean; title: string; description: string; close: () => void; children: ReactNode }) {
  return <Dialog open={open} onOpenChange={value => { if (!value) close() }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>
}
export function Back({ href, text = 'All students' }: { href: string; text?: string }) {
  return <a href={href} className="mb-5 inline-flex min-h-11 items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ChevronLeft className="size-4" />{text}</a>
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}
export function StudentLink({ id, name, parent = false }: { id: string; name: string; parent?: boolean }) {
  return <a href={`/${parent ? 'student' : 'students'}/${id}`} className="flex min-w-0 items-center gap-3"><Avatar name={name} /><span className="truncate font-medium hover:text-primary">{name}</span><ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" /></a>
}
