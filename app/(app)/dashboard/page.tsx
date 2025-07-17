"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"
import SummaryOverview from "@/components/view-flux-blade/SummaryOverview"
import { useBladeStack } from "@/lib/blade-stack-context"

export default function DashboardPage() {
  const router = useRouter()
  const { openBlade, closeTopBlade } = useBladeStack()

  const handleNavigate = (
    page: string,
    opts?: { status?: string; durationBucket?: string; errorType?: string; date?: string },
  ) => {
    const params = new URLSearchParams()
    if (opts?.status) params.set("status", opts.status)
    if (opts?.durationBucket) params.set("durationBucket", opts.durationBucket)
    if (opts?.errorType) params.set("errorType", opts.errorType)
    if (opts?.date) params.set("date", opts.date)
    if (page === "activity") {
      router.push(`/recent-activity` + (params.toString() ? `?${params.toString()}` : ""))
      return
    }
    router.push(`/flux-list/${page}` + (params.toString() ? `?${params.toString()}` : ""))
  }

  const handleNavigateToFetchedContents = (fetchingID: number) => {
    router.push(`/flux-list/processing-history/fetched-content?fetchingId=${fetchingID}`)
  }

  const handleNavigateToFetchedContentsFromProcessing = (processingID: number) => {
    router.push(`/flux-list/processing-history/fetched-content?processingId=${processingID}`)
  }

  const handleViewProcessingDetails = useCallback(
    async (processingID: number) => {
      try {
        // Fetch the processing data to get the actual flux ID
        const response = await fetch(`/api/processing-history/by-id?processingId=${processingID}`)
        const result = await response.json()
        
        let actualFluxId = "all"
        let fluxName = `Flux ${processingID}`
        
        if (result.data && !result.error) {
          actualFluxId = String(result.data.fluxID)
          console.log("🔍 Dashboard: Got actual flux ID for processing", processingID, ":", actualFluxId)
          
          // Also try to get the flux name
          try {
            const fluxResponse = await fetch(`/api/reports/${actualFluxId}`)
            const fluxResult = await fluxResponse.json()
            if (fluxResult.data && !fluxResult.error) {
              fluxName = fluxResult.data.name || `Flux ${actualFluxId}`
            }
          } catch (fluxError) {
            console.warn("Could not fetch flux name:", fluxError)
          }
        } else {
          console.warn("Could not fetch processing data, using fallback fluxId:", result.error)
        }
        
        openBlade(
          () => import("@/components/processing-history/processing-history-details-blade"),
          {
            processingId: processingID,
            fluxName: fluxName,
            fluxId: actualFluxId,
            onClose: closeTopBlade,
          },
          fluxName,
        )
      } catch (error) {
        console.error("Error fetching processing details:", error)
        // Fallback to original behavior if something goes wrong
        openBlade(
          () => import("@/components/processing-history/processing-history-details-blade"),
          {
            processingId: processingID,
            fluxName: `Flux ${processingID}`,
            fluxId: "all",
            onClose: closeTopBlade,
          },
          `Flux ${processingID}`,
        )
      }
    },
    [openBlade, closeTopBlade],
  )

  const handleViewFetchingDetails = useCallback(
    (fetchingID: number) => {
      openBlade(
        () => import("@/components/fetching-history/fetching-history-details-blade"),
        {
          fetchingId: fetchingID,
          fluxName: `Flux ${fetchingID}`,
          fluxId: "all",
          onClose: closeTopBlade,
        },
        `Flux ${fetchingID}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewNormalizationDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/normalization-history/NormalizationDetailsBlade"),
        {
          normalizationId: id,
          fluxName: `Flux ${id}`,
          fluxId: "all",
          onClose: closeTopBlade,
        },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewRefinementDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/refinement-history/RefinementDetailsBlade"),
        {
          refinementId: id,
          fluxName: `Flux ${id}`,
          fluxId: "all",
          onClose: closeTopBlade,
        },
        `Flux ${id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleViewCalculationDetails = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/calculation-history/CalculationDetailsBlade"),
        {
          calculationId: id,
          fluxName: `Flux ${id}`,
          fluxId: "all",
          onClose: closeTopBlade,
        },
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
    <div className="p-4 md:p-6">
      <SummaryOverview
        fluxId="all"
        onNavigate={handleNavigate}
        onNavigateToFetchedContents={handleNavigateToFetchedContents}
        onNavigateToFetchedContentsFromProcessing={handleNavigateToFetchedContentsFromProcessing}
        onViewFetchingDetails={handleViewFetchingDetails}
        onViewProcessingDetails={handleViewProcessingDetails}
        onViewWorkflowDetails={handleViewWorkflowDetails}
        onViewNormalizationDetails={handleViewNormalizationDetails}
        onViewRefinementDetails={handleViewRefinementDetails}
        onViewCalculationDetails={handleViewCalculationDetails}
      />
    </div>
  )
}
