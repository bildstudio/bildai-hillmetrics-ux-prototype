"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import FluxDetails from "@/components/view-flux-blade/FluxDetails"
import { cn } from "@/lib/utils"

interface FluxDetailsInfoPanelProps {
  reportId: string
  open: boolean
  onClose: () => void
  drawer?: boolean
}

export default function FluxDetailsInfoPanel({ reportId, open, onClose, drawer = false }: FluxDetailsInfoPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3 }}
          className={cn(
            "h-full bg-white shadow-lg flex flex-col flex-shrink-0",
            drawer ? "fixed top-0 right-0 w-[360px] md:w-[400px] z-[10000]" : "w-full sm:w-[360px] md:w-[400px]",
          )}
        >
          <div className="flex items-center justify-between p-4 border-b min-h-[60px]">
            <h2 className="text-lg font-semibold">Flux details - ID: {reportId}</h2>
            <button onClick={onClose} className="rounded-full p-1 text-gray-600 hover:bg-gray-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FluxDetails reportId={reportId} singleColumn compact />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
