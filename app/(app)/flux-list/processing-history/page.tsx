"use client"

import { ProcessingHistoryGrid } from "@/components/processing-history/processing-history-grid"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export default function ProcessingHistoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openBlade, closeTopBlade } = useBladeStack()

  const status = searchParams.get("status")
  const durationBucket = searchParams.get("durationBucket")
  const errorType = searchParams.get("errorType")
  const date = searchParams.get("date")
  const fetchingId = searchParams.get("fetchingId")
  const processingId = searchParams.get("processingId")
  const fluxParam = searchParams.get("fluxId")

  const handleClear = (param: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    router.replace(`/flux-list/processing-history${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const handleView = useCallback(
    (id: number, fluxId?: number) => {
      openBlade(
        () => import("@/components/processing-history/processing-history-details-blade"),
        {
          processingId: id,
          fluxName: `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleProcessingContentClick = (id: number) => {
    router.push(`/flux-list/processing-history/fetched-content?processingId=${id}`)
  }

  const handleFetchedContentClick = (id: number) => {
    router.push(`/flux-list/processing-history/fetched-content?fetchingId=${id}`)
  }

  return (
    <div className="p-4 md:p-6">
      <ProcessingHistoryGrid
        fluxId="all"
        fluxIdFilter={fluxParam ? Number(fluxParam) : null}
        onClearFluxId={() => handleClear("fluxId")}
        fetchingIdFilter={fetchingId ? Number(fetchingId) : null}
        processingIdFilter={processingId ? Number(processingId) : null}
        statusFilter={status}
        durationBucketFilter={durationBucket}
        errorTypeFilter={errorType}
        dateFilter={date}
        onProcessingContentClick={handleProcessingContentClick}
        onFetchingContentClick={handleFetchedContentClick}
        onViewClick={handleView}
        onClearFetchingId={() => handleClear("fetchingId")}
        onClearProcessingId={() => handleClear("processingId")}
        onClearStatusFilter={() => handleClear("status")}
        onClearDurationBucketFilter={() => handleClear("durationBucket")}
        onClearErrorTypeFilter={() => handleClear("errorType")}
        onClearDateFilter={() => handleClear("date")}
      />
    </div>
  )
}
