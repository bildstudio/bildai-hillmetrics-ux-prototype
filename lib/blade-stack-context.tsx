"use client"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { IndeterminateProgress } from "@/components/ui/indeterminate-progress"
import { useMaybeEditBlade } from "@/lib/edit-blade-context"
import { useMaybeViewBlade } from "@/lib/view-blade-context"

interface BladeEntry {
  id: number
  Component: React.ComponentType<any>
  props?: Record<string, any>
  ready: boolean
  label?: string
}

interface BladeStackContextType {
  openBlade: (
    loader: () => Promise<{ default: React.ComponentType<any> }>,
    props?: Record<string, any>,
    label?: string,
  ) => Promise<void>
  closeTopBlade: () => void
  minimizeStack: () => void
  maximizeStack: () => void
  isStackMinimized: boolean
  stackLabel: string
  stackCount: number
  activeBladeZIndex: number
}

const BladeStackContext = createContext<BladeStackContextType | undefined>(undefined)

export function BladeStackProvider({ children }: { children: React.ReactNode }) {
  const [blades, setBlades] = useState<BladeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [isStackMinimized, setIsStackMinimized] = useState(false)
  const [stackLabel, setStackLabel] = useState("")
  const progressTimer = useRef<NodeJS.Timeout | null>(null)

  const maybeEditBlade = useMaybeEditBlade()
  const maybeViewBlade = useMaybeViewBlade()
  const editBlades = maybeEditBlade?.blades ?? []
  const minimizeEditBlade = maybeEditBlade?.minimizeBlade
  const viewBlades = maybeViewBlade?.blades ?? []
  const minimizeViewBlade = maybeViewBlade?.minimizeBlade

  const openBlade = useCallback(
    async (
      loader: () => Promise<{ default: React.ComponentType<any> }>,
      props?: Record<string, any>,
      label?: string,
    ) => {
      try {
        setLoading(true)
        progressTimer.current = setTimeout(() => setShowProgress(true), 2000)
        const mod = await loader()
        const Component = mod.default
        const id = Date.now()
        setBlades((prev) => {
          if (prev.length >= 5) return prev
          return [...prev, { id, Component, props, ready: false, label }]
        })
        if (label) setStackLabel(label)
        if (isStackMinimized) {
          if (minimizeEditBlade) {
            editBlades
              .filter((b) => b.stackControlled && !b.isMinimized)
              .forEach((b) => minimizeEditBlade(b.id))
          }
          if (minimizeViewBlade) {
            viewBlades
              .filter((b) => b.stackControlled && !b.isMinimized)
              .forEach((b) => minimizeViewBlade(b.id))
          }

        }
        setIsStackMinimized(false)
      } catch (error) {
        console.error("Failed to open blade", error)
        setShowProgress(false)
        setLoading(false)
        if (progressTimer.current) {
          clearTimeout(progressTimer.current)
          progressTimer.current = null
        }
      }
    },
    [editBlades, viewBlades, minimizeEditBlade, minimizeViewBlade, isStackMinimized],
  )

  const markBladeReady = useCallback((id: number) => {
    setBlades((prev) => {
      let changed = false
      const next = prev.map((b) => {
        if (b.id === id && !b.ready) {
          changed = true
          return { ...b, ready: true }
        }
        return b
      })
      return changed ? next : prev
    })
    setLoading(false)
    setShowProgress(false)
    if (progressTimer.current) {
      clearTimeout(progressTimer.current)
      progressTimer.current = null
    }
  }, [])

  const closeTopBlade = useCallback(() => {
    setBlades((prev) => prev.slice(0, -1))
  }, [])

  const minimizeStack = useCallback(() => {
    if (blades.length > 0) {
      const top = blades[blades.length - 1]
      setStackLabel(top.label || stackLabel)
    }
    setIsStackMinimized(true)
  }, [blades, stackLabel])

  const maximizeStack = useCallback(() => {
    setIsStackMinimized(false)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTopBlade()
    }
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("keydown", handleKey)
      if (progressTimer.current) {
        clearTimeout(progressTimer.current)
        progressTimer.current = null
      }
    }
  }, [closeTopBlade])

  const readyCount = blades.filter((b) => b.ready).length
  const activeBladeZIndex = 1000 + (readyCount - 1) * 10

  return (
    <BladeStackContext.Provider
      value={{
        openBlade,
        closeTopBlade,
        minimizeStack,
        maximizeStack,
        isStackMinimized,
        stackLabel,
        stackCount: blades.length,
        activeBladeZIndex,
      }}
    >
      {children}
      {!isStackMinimized && (
        <>
          <AnimatePresence>
            {showProgress && (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="fixed left-0 right-0 top-0"
                style={{ zIndex: activeBladeZIndex + 30 }}
              >
                <IndeterminateProgress />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="fixed inset-0 flex items-center justify-center bg-black"
                style={{ zIndex: activeBladeZIndex + 20 }}
              >
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {blades.map((blade, index) => {
              const readyBlades = blades.filter((b) => b.ready)
              const readyIndex = readyBlades.findIndex((b) => b.id === blade.id)
              const offsetIndex = readyIndex === -1 ? readyBlades.length : readyBlades.length - 1 - readyIndex
              const offset = -150 * Math.min(offsetIndex, 3)
              const zIndex = 1000 + (readyIndex === -1 ? readyBlades.length : readyIndex) * 10 + 1
          const baseOpacity = Math.min(0.2 + offsetIndex * 0.2, 0.6)
          const overlayOpacity = Math.min(baseOpacity * 1.2, 1)
          const isTop = blade.id === readyBlades[readyBlades.length - 1]?.id
          const Comp = blade.Component

          if (!blade.ready) {
            return (
              <div key={blade.id} className="hidden">
                <Comp {...blade.props} onReady={() => markBladeReady(blade.id)} />
              </div>
            )
          }
              return (
                <React.Fragment key={blade.id}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: overlayOpacity }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="fixed inset-0 bg-black"
                    style={{ zIndex: zIndex - 1, pointerEvents: isTop ? "auto" : "none" }}
                    onClick={isTop ? closeTopBlade : undefined}
                  />
                  <motion.div
                    initial={{ x: "100%", y: 0 }}
                    animate={{ x: offset, y: 0 }}
                    exit={{ x: "100%", y: 0 }}
                    transition={{ duration: 0.16 }}
                    className="fixed top-0 right-0 h-full"
                    style={{ zIndex }}
                  >
                    <Comp {...blade.props} onReady={() => markBladeReady(blade.id)} />
                  </motion.div>
                </React.Fragment>
              )
            })}
          </AnimatePresence>
        </>
      )}
    </BladeStackContext.Provider>
  )
}

export function useBladeStack() {
  const ctx = useContext(BladeStackContext)
  if (!ctx) throw new Error("useBladeStack must be used within BladeStackProvider")
  return ctx
}
