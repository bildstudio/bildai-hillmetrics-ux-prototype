"use client"

import { useEditBlade } from "@/lib/edit-blade-context"
import EditFluxBlade from "./EditFluxBlade"
import { AnimatePresence } from "framer-motion"

export default function EditBladeManager() {
  const { blades } = useEditBlade()

  return (
    <>
      <AnimatePresence>
        {blades.map(
          (blade) =>
            !blade.isMinimized &&
            !blade.stackControlled && (
              <EditFluxBlade key={blade.id} reportId={blade.id} />
            ),
        )}
      </AnimatePresence>
    </>
  )
}
