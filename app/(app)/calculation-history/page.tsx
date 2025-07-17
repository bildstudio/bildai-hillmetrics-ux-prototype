"use client"

import { CalculationHistoryGrid } from "@/components/calculation-history/calculation-history-grid"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export default function CalculationHistoryPage() {
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
    router.replace(`/calculation-history${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const handleViewCalculation = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/calculation-history/calculation-details-blade"),
        {
          calculationId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Calculation ${id}`,
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
          onViewCalculation: handleViewCalculation,
        },
        item.flux_name || `Flux ${item.flux_id}`,
      )
    },
    [openBlade, closeTopBlade, handleViewCalculation],
  )

  return (
    <div className="p-0">
      <CalculationHistoryGrid
        status={status}
        durationBucket={durationBucket}
        date={date}
        fluxId={fluxParam}
        onViewCalculation={handleViewCalculation}
        onViewWorkflow={handleViewWorkflow}
      />
    </div>
  )
}
