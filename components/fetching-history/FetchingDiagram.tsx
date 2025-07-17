"use client"

import { useEffect, useState, useCallback } from "react"
import WorkflowDiagram from "../workflow-execution-log/WorkflowDiagram"
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log"
import { useBladeStack } from "@/lib/blade-stack-context"

export default function FetchingDiagram({
  fetchingId,
}: {
  fetchingId: number
}) {
  const [item, setItem] = useState<WorkflowExecutionLogData | null>(null)
  const [loading, setLoading] = useState(true)
  const { openBlade, closeTopBlade } = useBladeStack()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const runRes = await fetch(
        `/api/workflow-run-id?stageId=${fetchingId}&stageType=Fetching%20Stage`,
      )
      const { runId, error } = await runRes.json()
      if (!error && runId) {
        const res = await fetch(
          `/api/workflow-execution-log/item?id=${runId}`,
          { cache: "no-store" },
        )
        const { data } = await res.json()
        if (data) setItem(data)
      }
      setLoading(false)
    }
    load()
  }, [fetchingId])

  const handleViewWorkflow = useCallback(
    (id: number) => {
      if (item && item.id === id) {
        openBlade(
          () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
          {
            item: item,
            onClose: closeTopBlade,
          },
          `Workflow ${item.run_number || id}`,
        )
      }
    },
    [openBlade, closeTopBlade, item]
  )

  const handleViewFetching = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/fetching-history/fetching-history-details-blade"),
        {
          fetchingId: id,
          onClose: closeTopBlade,
        },
        `Fetching ${id}`,
      )
    },
    [openBlade, closeTopBlade]
  )

  const handleViewProcessing = useCallback(
    (id: number) => {
      openBlade(
        () => import("@/components/processing-history/processing-history-details-blade"),
        {
          processingId: id,
          onClose: closeTopBlade,
        },
        `Processing ${id}`,
      )
    },
    [openBlade, closeTopBlade]
  )

  const handlePreviewFile = useCallback(
    (contentId: number, contentName: string) => {
      openBlade(
        () => import("@/components/view-flux-blade/FilePreviewBlade"),
        {
          contentId,
          contentName,
          onClose: closeTopBlade,
        },
        `File Preview: ${contentName}`,
      )
    },
    [openBlade, closeTopBlade]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Loading...
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        No data
      </div>
    )
  }

  return (
    <WorkflowDiagram
      item={item}
      onViewWorkflow={handleViewWorkflow}
      onViewFetching={handleViewFetching}
      onViewProcessing={handleViewProcessing}
      onPreviewFile={handlePreviewFile}
      cardStatusBackground={{
        success: "#e6f4ea",
        failed: "#fdeaea",
        progress: "#e7f1fd",
      }}
      highlightStageId={fetchingId}
      isOnWorkflowBlade={false}
    />
  )
}
