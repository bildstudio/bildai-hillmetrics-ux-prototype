"use client"

import { FetchingHistoryGrid } from "@/components/fetching-history/fetching-history-grid"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export default function FetchingHistoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openBlade, closeTopBlade } = useBladeStack()

  const status = searchParams.get("status")
  const durationBucket = searchParams.get("durationBucket")
  const errorType = searchParams.get("errorType")
  const date = searchParams.get("date")
  const fluxParam = searchParams.get("fluxId")

  const handleClear = (param: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    router.replace(`/flux-list/fetching-history${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const handleView = useCallback(
    (id: number, fluxId?: number) => {
      openBlade(
        () => import("@/components/fetching-history/fetching-history-details-blade"),
        {
          fetchingId: id,
          fluxName: `Flux ${fluxId ?? id}`,
          fluxId: String(fluxId ?? ""),
          onClose: closeTopBlade,
        },
        `Flux ${fluxId ?? id}`,
      )
    },
    [openBlade, closeTopBlade],
  )

  const handleContentClick = (id: number) => {
    router.push(`/flux-list/processing-history/fetched-content?fetchingId=${id}`)
  }

  const handleProcessingsClick = (id: number) => {
    router.push(`/flux-list/processing-history?fetchingId=${id}`)
  }

  return (
    <div className="p-4 md:p-6">
      <FetchingHistoryGrid
        fluxId="all"
        fluxIdFilter={fluxParam ? Number(fluxParam) : null}
        onClearFluxId={() => handleClear("fluxId")}
        statusFilter={status}
        durationBucketFilter={durationBucket}
        errorTypeFilter={errorType}
        dateFilter={date}
        onContentClick={handleContentClick}
        onProcessingsClick={handleProcessingsClick}
        onViewClick={handleView}
        onClearStatusFilter={() => handleClear("status")}
        onClearDurationBucketFilter={() => handleClear("durationBucket")}
        onClearErrorTypeFilter={() => handleClear("errorType")}
        onClearDateFilter={() => handleClear("date")}
      />
    </div>
  )
}
