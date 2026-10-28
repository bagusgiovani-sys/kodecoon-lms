'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Palette } from 'lucide-react'
import { NexusDropdown } from './NexusDropdown'

export const nexusThemes = { blue: 'Ion Blue', red: 'Inferno Red', green: 'Emerald Green', mono: 'Obsidian Mono', light: 'Arctic White', candy: 'Candy Bloom' }
const themes = Object.entries(nexusThemes).map(([id,label]) => ({ id, label, detail: ({ blue: 'Electric blue · deep navy', red: 'Crimson · softened rose', green: 'Emerald · midnight green', mono: 'Silver · charcoal', light: 'White · graphite · cool grey', candy: 'Coral · sunshine · mint · lilac' } as Record<string,string>)[id], swatch: ({ blue: '#55baff', red: '#dc5b70', green: '#27e398', mono: '#e2e6ed', light: '#f7f9fc', candy: '#ff7198' } as Record<string,string>)[id] }))
export function useNexusTheme() {
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem('kodenexus-theme') ?? 'blue'
      document.documentElement.dataset.nexusTheme = saved in nexusThemes ? saved : 'blue'
    } catch { document.documentElement.dataset.nexusTheme = 'blue' }
  }, [])
}
export function ThemeSelector() {
  const [theme, setTheme] = useState('blue')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect browser-owned preference
    setTheme(document.documentElement.dataset.nexusTheme ?? 'blue')
  }, [])
  return <NexusDropdown label="Color theme" value={theme} options={themes} icon={<Palette className="size-4" />} onChange={next => {
    setTheme(next); document.documentElement.dataset.nexusTheme = next
    try { localStorage.setItem('kodenexus-theme', next) } catch { /* Theme still applies for this visit. */ }
  }} />
}
