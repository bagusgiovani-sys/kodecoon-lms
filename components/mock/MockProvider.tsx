'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createMockData, MOCK_STORAGE_KEY, type MockData } from '@/lib/mock/data'
import { DEMO_IDENTITY_KEY, upgradeNexusData, type DemoIdentity } from '@/lib/mock/nexus'
import { scopeCenterData } from '@/lib/mock/center'
import { PageSkeleton } from './NexusExperience'
export const CenterScope = createContext<string | null>(null)
interface MockContextValue {
  data: MockData
  update: (change: (data: MockData) => MockData) => boolean
  identity: DemoIdentity | null
  signIn: (identity: DemoIdentity) => boolean
  signOut: () => void
}
const MockContext = createContext<MockContextValue | null>(null)
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MockData | null>(null)
  const dataRef = useRef<MockData | null>(null)
  const [identity, setIdentity] = useState<DemoIdentity | null>(null)
  useEffect(() => {
    let initial = createMockData()
    try {
      const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? 'null')
      if (stored?.version === 1 && ['students', 'classes', 'sessions', 'videos', 'feedback', 'reports', 'teachers'].every(key => Array.isArray(stored[key]))) initial = stored
    } catch { toast.info('Starting with fresh demo data.') }
    // Browser-owned data is hydrated after mount, avoiding SSR mismatches.
    const upgraded = upgradeNexusData(initial)
    dataRef.current = upgraded
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate external browser storage after SSR.
    setData(upgraded)
    try {
      const saved = JSON.parse(sessionStorage.getItem(DEMO_IDENTITY_KEY) ?? 'null')
      if (saved && ['teacher', 'center_manager', 'parent'].includes(saved.role) && typeof saved.email === 'string' && typeof saved.name === 'string') {
        setIdentity(saved)
      }
    } catch { sessionStorage.removeItem(DEMO_IDENTITY_KEY) }
    const sync = (event: StorageEvent) => {
      if (event.key !== MOCK_STORAGE_KEY || !event.newValue) return
      try {
        const saved = JSON.parse(event.newValue)
        if (saved?.version !== 1 || !Array.isArray(saved.students) || !Array.isArray(saved.classes)) return
        const next = upgradeNexusData(saved); dataRef.current = next; setData(next)
      } catch { /* Keep the last usable demo state. */ }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  function update(change: (current: MockData) => MockData) {
    if (!dataRef.current || !identity) return false
    try {
      const next = change(dataRef.current)
      if (identity.role === 'parent') throw new Error('Parent previews are read-only. Staff record after-class documentation.')
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(next))
      dataRef.current = next
      setData(next)
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Your browser could not save this change. Free some storage and try again.')
      return false
    }
  }
  if (!data) return <div className="mx-auto max-w-7xl p-8"><PageSkeleton /></div>
  function signIn(next: DemoIdentity) {
    try { sessionStorage.setItem(DEMO_IDENTITY_KEY, JSON.stringify(next)); setIdentity(next); return true }
    catch { toast.error('Allow browser storage to open the demo.'); return false }
  }
  function signOut() { sessionStorage.removeItem(DEMO_IDENTITY_KEY); setIdentity(null) }
  return <MockContext.Provider value={{ data, update, identity, signIn, signOut }}>{children}</MockContext.Provider>
}
export function useMock() {
  const context = useContext(MockContext)
  const centerId = useContext(CenterScope)
  if (!context) throw new Error('MockProvider is required')
  return centerId && context.identity?.role !== 'parent' ? { ...context, data: scopeCenterData(context.data, centerId) } : context
}
export function useAcademyData() {
  const context = useContext(MockContext)
  if (!context) throw new Error('MockProvider is required')
  return context.data
}
