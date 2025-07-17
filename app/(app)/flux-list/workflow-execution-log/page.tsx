"use client"

import { WorkflowExecutionLogGrid } from "@/components/workflow-execution-log/workflow-execution-log-grid"
import { useBladeStack } from "@/lib/blade-stack-context"
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export default function WorkflowExecutionLogPage() {
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
    router.replace(`/flux-list/workflow-execution-log${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const handleViewFetching = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/fetching-history/fetching-history-details-blade"),
        {
          fetchingId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewProcessing = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/processing-history/processing-history-details-blade"),
        {
          processingId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewNormalization = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/normalization-history/NormalizationDetailsBlade"),
        {
          normalizationId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewRefinement = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/refinement-history/RefinementDetailsBlade"),
        {
          refinementId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewCalculation = useCallback(
    (id: number, fluxId?: number, name?: string) => {
      openBlade(
        () => import("@/components/calculation-history/CalculationDetailsBlade"),
        {
          calculationId: id,
          fluxName: name ?? `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        name ?? `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleContentClick = (id: number) => {
    router.push(`/flux-list/processing-history/fetched-content?fetchingId=${id}`)
  }

  const handleViewWorkflow = useCallback(
    (item: WorkflowExecutionLogData) => {
      openBlade(
        () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
        {
          item,
          onClose: closeTopBlade,
          onViewFetching: handleViewFetching,
          onViewProcessing: handleViewProcessing,
          onViewNormalization: handleViewNormalization,
          onViewRefinement: handleViewRefinement,
          onViewCalculation: handleViewCalculation,
          onContentClick: handleContentClick,
        },
        item.flux_name || `Flux ${item.flux_id}`,
      )
    },
    [
      openBlade,
      closeTopBlade,
      handleViewFetching,
      handleViewProcessing,
      handleViewNormalization,
      handleViewRefinement,
      handleViewCalculation,
    ],
  )

  return (
    <div className="p-0">
      <WorkflowExecutionLogGrid
        fluxId="all"
        fluxIdFilter={fluxParam ? Number(fluxParam) : null}
        onClearFluxId={() => handleClear("fluxId")}
        statusFilter={status}
        durationBucketFilter={durationBucket}
        dateFilter={date}
        onContentClick={handleContentClick}
        onViewClick={handleViewFetching}
        onViewProcessingClick={handleViewProcessing}
        onViewNormalizationClick={handleViewNormalization}
        onViewRefinementClick={handleViewRefinement}
        onViewCalculationClick={handleViewCalculation}
        onWorkflowDetailsClick={handleViewWorkflow}
        onClearStatusFilter={() => handleClear("status")}
        onClearDurationBucketFilter={() => handleClear("durationBucket")}
        onClearDateFilter={() => handleClear("date")}
      />
    </div>
  )
}
