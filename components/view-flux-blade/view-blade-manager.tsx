"use client"

import { useViewBlade } from "@/lib/view-blade-context"
import ViewFluxBlade from "./ViewFluxBlade"
import { AnimatePresence } from "framer-motion"

export default function ViewBladeManager() {
  const { blades } = useViewBlade()

  return (
    <>
      <AnimatePresence>
        {blades.map(
          (blade) =>
            !blade.isMinimized &&
            !blade.stackControlled && (
              <ViewFluxBlade key={blade.id} reportId={blade.id} onReady={() => {}} />
            ),
        )}
      </AnimatePresence>
    </>
  )
}
