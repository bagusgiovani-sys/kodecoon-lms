'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createMockData, MOCK_STORAGE_KEY, type MockData } from '@/lib/mock/data'
interface MockContextValue {
  data: MockData
  update: (change: (data: MockData) => MockData) => boolean
}
const MockContext = createContext<MockContextValue | null>(null)
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MockData | null>(null)
  useEffect(() => {
    let initial = createMockData()
    try {
      const stored = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) ?? 'null')
      if (stored?.version === 1 && ['students', 'classes', 'sessions', 'videos', 'feedback', 'reports', 'teachers'].every(key => Array.isArray(stored[key]))) initial = stored
    } catch { toast.info('Starting with fresh demo data.') }
    // Browser-owned data is hydrated after mount, avoiding SSR mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(initial)
  }, [])
  function update(change: (current: MockData) => MockData) {
    if (!data) return false
    const next = change(data)
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(next))
      setData(next)
      return true
    } catch {
      toast.error('Your browser could not save this change. Free some storage and try again.')
      return false
    }
  }
  if (!data) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Opening your classroom…</div>
  return <MockContext.Provider value={{ data, update }}>{children}</MockContext.Provider>
}
export function useMock() {
  const context = useContext(MockContext)
  if (!context) throw new Error('MockProvider is required')
  return context
}
