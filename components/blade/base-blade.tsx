"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useBladeStack } from "@/lib/blade-stack-context"
import { BLADE_TYPE_WIDTHS, type BladeType } from "./blade-config"
import React from "react"

export interface BaseBladeProps {
  children: React.ReactNode
  onClose?: () => void
  zIndex?: number
  duration?: number
  overlayOpacity?: number
  className?: string
  bladeType?: BladeType
}

export function BaseBlade({
  children,
  onClose,
  zIndex,
  duration = 0.24,
  overlayOpacity = 0.48,
  className,
  bladeType,
}: BaseBladeProps) {
  const { activeBladeZIndex } = useBladeStack()
  const finalZ = zIndex ?? activeBladeZIndex + 5
  const widthClasses = bladeType ? BLADE_TYPE_WIDTHS[bladeType] : ""
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Check if any dropdown menus are open by looking for radix dropdown content
    const openDropdowns = document.querySelectorAll('[data-radix-popper-content-wrapper]')
    if (openDropdowns.length > 0) {
      // Don't close blade if dropdown is open
      return
    }
    onClose?.()
  }
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        exit={{ opacity: 0 }}
        transition={{ duration: duration / 2 }}
        className="fixed inset-0 bg-black"
        style={{ zIndex: finalZ - 1 }}
        onClick={handleOverlayClick}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration }}
        className={cn(
          "fixed top-0 right-0 h-full bg-white shadow-2xl flex flex-col",
          widthClasses,
          className,
        )}
        style={{ zIndex: finalZ }}
      >
        {children}
      </motion.div>
    </>
  )
}
