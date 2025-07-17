"use client"
import { AnimatePresence, motion } from "framer-motion"
import { useBladeStack } from "@/lib/blade-stack-context"

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  width?: number | string
  children: React.ReactNode
}

export function SlidePanel({ open, onClose, width = 360, children }: SlidePanelProps) {
  const { activeBladeZIndex } = useBladeStack()
  const panelWidth = typeof width === "number" ? `${width}px` : width
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: panelWidth }}
          animate={{ x: 0 }}
          exit={{ x: panelWidth }}
          transition={{ duration: 0.24 }}
          className="fixed top-0 right-0 h-full bg-white shadow-xl"
          style={{ width: panelWidth, zIndex: activeBladeZIndex + 5 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
