"use client"

import { FetchedContentsGrid } from "@/components/fetched-contents/fetched-contents-grid"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function ProcessingFetchedContentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openBlade, closeTopBlade } = useBladeStack()
  const fetchingId = searchParams.get("fetchingId")
  const processingId = searchParams.get("processingId")
  const fluxParam = searchParams.get("fluxId")

  const handleClear = (param: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    router.replace(`/flux-list/processing-history/fetched-content${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const handlePreview = (file: { id: string; name: string; fluxId: string; fluxName?: string }) => {
    openBlade(
      () => import("@/components/view-flux-blade/FilePreviewBlade"),
      {
        file,
        onClose: closeTopBlade,
      },
      file.name,
    )
  }

  return (
    <div className="p-4 md:p-6">
      <FetchedContentsGrid
        fluxId="all"
        fluxIdFilter={fluxParam ? Number(fluxParam) : null}
        onClearFluxId={() => handleClear("fluxId")}
        fetchingIdFilter={fetchingId ? Number(fetchingId) : null}
        processingIdFilter={processingId ? Number(processingId) : null}
        onPreviewClick={handlePreview}
        onClearFetchingId={() => handleClear("fetchingId")}
        onClearProcessingId={() => handleClear("processingId")}
      />
    </div>
  )
}
