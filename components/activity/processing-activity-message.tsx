"use client"
import { formatDistanceToNow, format } from "date-fns"
import { CheckCircle, RefreshCw, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProcessingData {
  processingID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt?: string
  processingTimeInSeconds?: number
  progress?: number
  numberOfContent?: number
  errorMessage?: string
}

interface ProcessingActivityMessageProps {
  data: ProcessingData
  onNavigateToFetchedContents?: (processingID: number) => void
  onViewProcessingDetails?: (processingID: number) => void
  onViewWorkflowDetails?: (workflowId: number) => void
  /** Optional class applied to the inner content wrapper. */
  className?: string
}

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a")
}

const formatMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60)
  return minutes === 1 ? "1 minute" : `${minutes} minutes`
}

const timeAgo = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

const ActivityBadge = ({
  label,
  onClick,
  className = "",
}: {
  label: string | number
  onClick?: () => void
  className?: string
}) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white hover:bg-gray-300 cursor-pointer transition-colors ${className}`}
    onClick={onClick}
  >
    {label}
  </span>
)

export function ProcessingActivityMessage({
  data,
  onNavigateToFetchedContents,
  onViewProcessingDetails,
  onViewWorkflowDetails,
  className,
}: ProcessingActivityMessageProps) {
  const {
    processingID,
    status,
    timestamp,
    completedAt,
    processingTimeInSeconds,
    progress,
    numberOfContent,
    errorMessage,
  } = data

  const [workflowId, setWorkflowId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/workflow-execution-log/workflow-id?processingId=${processingID}`,
          { cache: "no-store" },
        )
        const data = await res.json()
        if (!data.error) setWorkflowId(data.data)
      } catch (error) {
        console.error("Failed to fetch workflow id", error)
      }
    }
    load()
  }, [processingID])

  const handleContentClick = () => {
    if (onNavigateToFetchedContents) {
      onNavigateToFetchedContents(processingID)
    }
  }

  const handleProcessingIdClick = () => {
    if (onViewProcessingDetails) {
      onViewProcessingDetails(processingID)
    }
  }

  const handleWorkflowIdClick = () => {
    if (onViewWorkflowDetails && workflowId !== null) {
      onViewWorkflowDetails(workflowId)
    }
  }

  const renderMessage = () => {
    switch (status?.toLowerCase()) {
      case "processing success":
      case "success":
        return (
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Processing completed successfully</h4>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">processing success</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Processing job <ActivityBadge label={processingID} onClick={handleProcessingIdClick} />, executed within workflow {workflowId !== null ? (
                    <ActivityBadge label={workflowId} onClick={handleWorkflowIdClick} />
                  ) : (
                    "-"
                  )}, started on {formatDateTime(timestamp)} and finished at {completedAt ? formatDateTime(completedAt) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">
                  Processed {progress ?? 0}% of content in {processingTimeInSeconds ? formatMinutes(processingTimeInSeconds) : "N/A"}. Total <ActivityBadge label={numberOfContent || 0} onClick={handleContentClick} /> files processed.
                </p>
                <p className="text-xs text-gray-500">
                  Executed by: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )

      case "currently processing":
      case "in progress":
      case "processing":
        const elapsedMinutes = processingTimeInSeconds ? Math.round(processingTimeInSeconds / 60) : 0
        return (
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Flux is currently processing</h4>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">currently processing</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Processing job <ActivityBadge label={processingID} onClick={handleProcessingIdClick} /> is in progress in workflow{' '}
                  {workflowId !== null ? (
                    <ActivityBadge label={workflowId} onClick={handleWorkflowIdClick} />
                  ) : (
                    "-"
                  )}
                  :
                </p>
                <p className="text-sm text-gray-700">
                  {progress || 0}% completed in {elapsedMinutes} min, currently processing {numberOfContent || 0} files.
                </p>
                <p className="text-xs text-gray-500">
                  Executing: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )

      case "processing failed":
      case "failed":
      case "error":
        return (
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Processing failed with errors</h4>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">processing failed</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Processing job <ActivityBadge label={processingID} onClick={handleProcessingIdClick} /> failed in workflow{' '}
                  {workflowId !== null ? (
                    <ActivityBadge label={workflowId} onClick={handleWorkflowIdClick} />
                  ) : (
                    '-'
                  )}
                  :
                </p>
                <p className="text-sm text-red-600">Reason – {errorMessage || "Unknown error"}.</p>
                <p className="text-sm text-gray-700">
                  Started {formatDateTime(timestamp)}, stopped {completedAt ? formatDateTime(completedAt) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">
                  Processed {progress || 0}% before error, lasted{" "}
                  {processingTimeInSeconds ? formatMinutes(processingTimeInSeconds) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">Affected files: {numberOfContent || 0}.</p>
                <p className="text-xs text-gray-500">
                  Executed by: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">
              Processing job <ActivityBadge label={processingID} onClick={handleProcessingIdClick} /> status: {status}
            </p>
            <p className="text-xs text-gray-500">
              <strong>System</strong> · {timeAgo(timestamp)}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="py-4 px-0 border-b border-gray-200 last:border-b-0 break-words">
      <div className={cn(className)}>{renderMessage()}</div>
    </div>
  )
}
