'use client'

import { createContext, useContext, useState } from 'react'

export interface Center {
  id: string
  name: string
  country: string
}

interface CenterContextValue {
  centers: Center[]
  activeCenterId: string
  setActiveCenterId: (id: string) => void
}

const CenterContext = createContext<CenterContextValue | null>(null)

interface CenterProviderProps {
  centers: Center[]
  children: React.ReactNode
}

// The admin's selected center — one option in v1, but every admin query is
// scoped through it from day one so Singapore is never a retrofit (PRD).
export function CenterProvider({ centers, children }: CenterProviderProps) {
  const [activeCenterId, setActiveCenterId] = useState(centers[0]?.id ?? '')

  return (
    <CenterContext.Provider value={{ centers, activeCenterId, setActiveCenterId }}>
      {children}
    </CenterContext.Provider>
  )
}

export function useCenter() {
  const context = useContext(CenterContext)
  if (!context) {
    throw new Error('useCenter must be used inside CenterProvider')
  }
  return context
}
