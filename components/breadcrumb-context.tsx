"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface BreadcrumbContextType {
  labels: Record<string, string>
  setLabel: (path: string, label: string) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({})

  const setLabel = useCallback((path: string, label: string) => {
    setLabels((prev) => {
      if (prev[path] === label) return prev
      return { ...prev, [path]: label }
    })
  }, [])

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbLabels() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error("useBreadcrumbLabels must be used within a BreadcrumbProvider")
  }
  return context
}
