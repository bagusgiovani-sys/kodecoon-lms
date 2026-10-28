'use client'
import { useSyncExternalStore, type AnchorHTMLAttributes } from 'react'

// The isolated demo renders one Pages Router page behind proxy aliases. Keep
// its local navigation on that page instead of requesting App Router aliases.
const eventName = 'kodenexus:navigate'
export const demoNavigationEvent = eventName
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback)
  window.addEventListener('popstate', callback)
  return () => { window.removeEventListener(eventName, callback); window.removeEventListener('popstate', callback) }
}
export function useDemoLocation(initial = '/login') {
  return useSyncExternalStore(subscribe, () => window.location.pathname + window.location.search, () => initial)
}
export function navigateDemo(href: string) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: { href } }))
}
export function DemoLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} href={href} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target || props.download || !href.startsWith('/') || href.startsWith('//')) return
    event.preventDefault()
    navigateDemo(href)
  }} />
}
