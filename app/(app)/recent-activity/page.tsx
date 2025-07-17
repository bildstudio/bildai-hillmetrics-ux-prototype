"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { useBladeStack } from "@/lib/blade-stack-context"

export default function RecentActivityPage() {
  const { openBlade, closeTopBlade } = useBladeStack()
  const router = useRouter()

  const handleViewProcessingDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/processing-history/processing-history-details-blade"),
        { processingId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewFetchingDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/fetching-history/fetching-history-details-blade"),
        { fetchingId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewNormalizationDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/normalization-history/NormalizationDetailsBlade"),
        { normalizationId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewRefinementDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/refinement-history/RefinementDetailsBlade"),
        { refinementId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewCalculationDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/calculation-history/CalculationDetailsBlade"),
        { calculationId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewWorkflowDetails = useCallback(
    async (workflowId: number) => {
      const res = await fetch(
        `/api/workflow-execution-log/item?id=${workflowId}`,
        { cache: "no-store" },
      )
      const { data } = await res.json()
      if (!data) return
      openBlade(
        () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
        {
          item: data,
          onClose: closeTopBlade,
          onViewFetching: handleViewFetchingDetails,
          onViewProcessing: handleViewProcessingDetails,
          onViewNormalization: handleViewNormalizationDetails,
          onViewRefinement: handleViewRefinementDetails,
          onViewCalculation: handleViewCalculationDetails,
          onContentClick: (id: number) => {
            router.push(`/flux-list/processing-history/fetched-content?fetchingId=${id}`)
          },
        },
        data.flux_name || `Flux ${data.flux_id}`,
      )
    },
    [
      openBlade,
      closeTopBlade,
      handleViewFetchingDetails,
      handleViewProcessingDetails,
      handleViewNormalizationDetails,
      handleViewRefinementDetails,
      handleViewCalculationDetails,
      router,
    ],
  )

  return (
    <div className="p-4 md:p-6 flex justify-center">
      <ActivityFeed
        fluxId="all"
        onViewProcessingDetails={handleViewProcessingDetails}
        onViewFetchingDetails={handleViewFetchingDetails}
        onViewWorkflowDetails={handleViewWorkflowDetails}
        onViewNormalizationDetails={handleViewNormalizationDetails}
        onViewRefinementDetails={handleViewRefinementDetails}
        onViewCalculationDetails={handleViewCalculationDetails}
      />
    </div>
  )
}
