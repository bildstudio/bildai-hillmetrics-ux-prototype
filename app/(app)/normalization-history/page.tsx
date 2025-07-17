"use client"

import { NormalizationHistoryGrid } from "@/components/normalization-history/normalization-history-grid"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export default function NormalizationHistoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const { openBlade, closeTopBlade } = useBladeStack()

  const status = searchParams.get("status")
  const durationBucket = searchParams.get("durationBucket")
  const date = searchParams.get("date")
  const fluxParam = searchParams.get("fluxId")

  const handleClear = (param: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    router.replace(`/normalization-history${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const handleViewNormalization = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/normalization-history/normalization-details-blade"),
        {
          normalizationId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Normalization ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewWorkflow = useCallback(
    (item: any) => {
      openBlade(
        () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
        {
          item,
          onClose: closeTopBlade,
          onViewNormalization: handleViewNormalization,
        },
        item.flux_name || `Flux ${item.flux_id}`,
      )
    },
    [openBlade, closeTopBlade, handleViewNormalization],
  )

  return (
    <div className="p-0">
      <NormalizationHistoryGrid
        status={status}
        durationBucket={durationBucket}
        date={date}
        fluxId={fluxParam}
        onViewNormalization={handleViewNormalization}
        onViewWorkflow={handleViewWorkflow}
      />
    </div>
  )
}
