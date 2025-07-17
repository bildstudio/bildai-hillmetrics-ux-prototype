"use client"

import type { BladePanelData } from "@/components/blade/blade-panel"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface BladeContextType {
  openBlade: (initialData?: BladePanelData | null) => void
  closeBlade: () => void
  isBladeOpen: boolean
  bladeData: BladePanelData | null
  // Add these for notification sequence
  dataFromLastSaveAttempt: BladePanelData | null
  setDataFromLastSaveAttempt: (data: BladePanelData | null) => void
}

const BladeContext = createContext<BladeContextType | undefined>(undefined)

export function BladeProvider({ children }: { ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isBladeOpen, setIsBladeOpen] = useState(false)
  const [bladeData, setBladeData] = useState<BladePanelData | null>(null)
  const [dataFromLastSaveAttempt, setDataFromLastSaveAttempt] = useState<BladePanelData | null>(null)

  // Initialize blade state from URL on mount
  useEffect(() => {
    const urlBladeState = searchParams.get("blade")
    if (urlBladeState === "open") {
      setIsBladeOpen(true)
    } else {
      // Eksplicitno postavite na false ako URL parametar 'blade' nije 'open'
      setIsBladeOpen(false)
    }
  }, [searchParams])

  const openBlade = useCallback(
    (initialData?: BladePanelData | null) => {
      setBladeData(initialData || null)
      setIsBladeOpen(true)
      // Update URL
      const currentPath = window.location.pathname
      const newSearchParams = new URLSearchParams(searchParams.toString())
      // Remove id and tab parameters to prevent reopening previous sessions
      newSearchParams.delete("id")
      newSearchParams.delete("tab")
      newSearchParams.set("blade", "open")
      router.replace(`${currentPath}?${newSearchParams.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const closeBlade = useCallback(() => {
    setIsBladeOpen(false)
    // Update URL
    const currentPath = window.location.pathname
    const newSearchParams = new URLSearchParams(searchParams.toString())
    // Clean up id and tab parameters as well
    newSearchParams.delete("id")
    newSearchParams.delete("tab")
    newSearchParams.delete("blade")
    router.replace(`${currentPath}?${newSearchParams.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <BladeContext.Provider
      value={{ openBlade, closeBlade, isBladeOpen, bladeData, dataFromLastSaveAttempt, setDataFromLastSaveAttempt }}
    >
      {children}
    </BladeContext.Provider>
  )
}

export function useBlade() {
  const context = useContext(BladeContext)
  if (context === undefined) {
    throw new Error("useBlade must be used within a BladeProvider")
  }
  return context
}
