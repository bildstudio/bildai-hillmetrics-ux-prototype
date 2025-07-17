"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface BladeState {
  id: string
  name: string
  isMinimized: boolean
  isDirty: boolean
  zIndex: number
  minimizedAt?: number
  disableMinimize?: boolean
  stackControlled?: boolean
}

interface EditBladeContextType {
  blades: BladeState[]
  openBlade: (
    id: string,
    name?: string,
    options?: { disableMinimize?: boolean; zIndex?: number; stackControlled?: boolean },
  ) => void
  closeBlade: (id: string) => void
  minimizeBlade: (id: string) => void
  maximizeBlade: (id: string) => void
  updateBladeState: (id: string, updates: Partial<Omit<BladeState, "id">>) => void
  getBlade: (id: string) => BladeState | undefined
}

const EditBladeContext = createContext<EditBladeContextType | undefined>(undefined)

let zIndexCounter = 100

export function EditBladeProvider({ children }: { children: ReactNode }) {
  const [blades, setBlades] = useState<BladeState[]>([])

  const bringToFront = useCallback((id: string) => {
    zIndexCounter += 2 // Increment to leave space for backdrop
    setBlades((prev) => {
      return prev.map((b) =>
        b.id === id ? { ...b, zIndex: zIndexCounter, isMinimized: false, minimizedAt: undefined } : b,
      )
    })
  }, [])

  const openBlade = useCallback(
    (
      id: string,
      name = "Edit Report",
      options?: { disableMinimize?: boolean; zIndex?: number; stackControlled?: boolean },
    ) => {
      setBlades((prev) => {
        const existingBlade = prev.find((b) => b.id === id)
        if (existingBlade) {
          bringToFront(id)
          return prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  isMinimized: false,
                  zIndex: options?.zIndex ?? zIndexCounter,
                  minimizedAt: undefined,
                  disableMinimize: options?.disableMinimize,
                  stackControlled: options?.stackControlled,
                }
              : b,
          )
        }
        zIndexCounter += 2
        return [
          ...prev,
          {
            id,
            name,
            isMinimized: false,
            isDirty: false,
            zIndex: options?.zIndex ?? zIndexCounter,
            disableMinimize: options?.disableMinimize,
            stackControlled: options?.stackControlled,
          },
        ]
      })
    },
    [bringToFront],
  )

  const closeBlade = useCallback((id: string) => {
    setBlades((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const minimizeBlade = useCallback((id: string) => {
    setBlades((prev) => prev.map((b) => (b.id === id ? { ...b, isMinimized: true, minimizedAt: Date.now() } : b)))
  }, [])

  const maximizeBlade = useCallback(
    (id: string) => {
      bringToFront(id)
    },
    [bringToFront],
  )

  const updateBladeState = useCallback((id: string, updates: Partial<Omit<BladeState, "id">>) => {
    setBlades((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const getBlade = useCallback(
    (id: string) => {
      return blades.find((b) => b.id === id)
    },
    [blades],
  )

  const value = { blades, openBlade, closeBlade, minimizeBlade, maximizeBlade, updateBladeState, getBlade }

  return <EditBladeContext.Provider value={value}>{children}</EditBladeContext.Provider>
}

export function useEditBlade() {
  const context = useContext(EditBladeContext)
  if (context === undefined) {
    throw new Error("useEditBlade must be used within an EditBladeProvider")
  }
  return context
}

export function useMaybeEditBlade() {
  return useContext(EditBladeContext)
}
