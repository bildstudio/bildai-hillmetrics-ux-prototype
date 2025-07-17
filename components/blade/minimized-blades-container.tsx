"use client"

import { useEditBlade, type BladeState as EditBladeState } from "@/lib/edit-blade-context"
import { useViewBlade, type BladeState as ViewBladeState } from "@/lib/view-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Maximize2, X, Pencil, Eye, Layers } from "lucide-react"
import { useState } from "react"
import { UnsavedChangesDialog } from "@/components/blade/unsaved-changes-dialog"

// --- Minimized Edit Blade Bar ---
function MinimizedEditBladeBar({ blade }: { blade: EditBladeState }) {
  const { maximizeBlade, closeBlade } = useEditBlade()
  const { maximizeStack, stackCount } = useBladeStack()
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false)

  const attemptClose = () => {
    if (blade.isDirty) {
      setIsUnsavedDialogOpen(true)
    } else {
      closeBlade(blade.id)
    }
  }

  const handleConfirmClose = () => {
    closeBlade(blade.id)
    setIsUnsavedDialogOpen(false)
  }

  return (
    <>
      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onClose={() => setIsUnsavedDialogOpen(false)}
        onConfirm={handleConfirmClose}
      />
      <motion.div
        layoutId={`edit-blade-${blade.id}`}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        className="h-16 bg-white border-t border-l border-r shadow-2xl flex items-center justify-between px-6 w-72 rounded-t-lg"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Pencil className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-800 truncate">{blade.name}</span>
          {blade.isDirty && (
            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Unsaved changes" />
          )}
        </div>
        <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            maximizeBlade(blade.id)
            if (blade.stackControlled && stackCount > 1) {
              maximizeStack()
            }
          }}
          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
          aria-label="Maximize"
        >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={attemptClose}
            className="h-8 w-8 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// --- Minimized View Blade Bar ---
function MinimizedViewBladeBar({ blade }: { blade: ViewBladeState }) {
  const { maximizeBlade, closeBlade } = useViewBlade()
  const { maximizeStack, stackCount } = useBladeStack()
  return (
    <motion.div
      layoutId={`view-blade-${blade.id}`}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
      className="h-16 bg-white border-t border-l border-r shadow-2xl flex items-center justify-between px-6 w-72 rounded-t-lg"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Eye className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 truncate">{blade.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            maximizeBlade(blade.id)
            if (blade.stackControlled && stackCount > 1) {
              maximizeStack()
            }
          }}
          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
          aria-label="Maximize"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => closeBlade(blade.id)}
          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// --- Combined Container ---
type MergedBlade = (EditBladeState | ViewBladeState) & { type: "edit" | "view" }

export default function MinimizedBladesContainer() {
  const { blades: editBlades } = useEditBlade()
  const { blades: viewBlades } = useViewBlade()
  const { isStackMinimized, maximizeStack, stackLabel, stackCount } = useBladeStack()
  const minimizedEditBlades = editBlades.filter((b) => b.isMinimized)
  const minimizedViewBlades = viewBlades.filter((b) => b.isMinimized)
  const allMinimizedBlades: MergedBlade[] = [
    ...minimizedEditBlades.map((b) => ({ ...b, type: "edit" as const })),
    ...minimizedViewBlades.map((b) => ({ ...b, type: "view" as const })),
  ].sort((a, b) => (a.minimizedAt || 0) - (b.minimizedAt || 0))

  return (
    <div className="fixed bottom-0 right-4 z-40 flex flex-row-reverse items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isStackMinimized && (
          <motion.div
            key="stack-bar"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            className="h-16 bg-white border-t border-l border-r shadow-2xl flex items-center justify-between px-6 w-72 rounded-t-lg pointer-events-auto"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {stackCount > 1 && (
                <Layers className="w-4 h-4 text-gray-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-800 truncate">{stackLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                maximizeStack()
              }}
              className="h-8 w-8 text-gray-500 hover:bg-gray-100"
              aria-label="Maximize"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
        {allMinimizedBlades.map((blade) => (
          <div key={blade.id} className="pointer-events-auto">
            {blade.type === "edit" ? (
              <MinimizedEditBladeBar blade={blade as EditBladeState} />
            ) : (
              <MinimizedViewBladeBar blade={blade as ViewBladeState} />
            )}
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
