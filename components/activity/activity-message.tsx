"use client"
import { formatDistanceToNow, format } from "date-fns"
import { CheckCircle, RefreshCw, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface FetchingData {
  fetchingID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt?: string
  fetchingTimeInSeconds?: number
  progress?: number
  numberOfContent?: number
  errorMessage?: string
}

interface ActivityMessageProps {
  data: FetchingData
  onNavigateToFetchedContents?: (fetchingID: number) => void
  onViewFetchingDetails?: (fetchingID: number) => void
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

export function ActivityMessage({
  data,
  onNavigateToFetchedContents,
  onViewFetchingDetails,
  onViewWorkflowDetails,
  className,
}: ActivityMessageProps) {
  const {
    fetchingID,
    status,
    timestamp,
    completedAt,
    fetchingTimeInSeconds,
    progress,
    numberOfContent,
    errorMessage,
  } = data

  const [workflowId, setWorkflowId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/workflow-execution-log/workflow-id?fetchingId=${fetchingID}`,
          { cache: "no-store" },
        )
        const data = await res.json()
        if (!data.error) setWorkflowId(data.data)
      } catch (error) {
        console.error("Failed to fetch workflow id", error)
      }
    }
    load()
  }, [fetchingID])

  const handleContentClick = () => {
    if (onNavigateToFetchedContents) {
      onNavigateToFetchedContents(fetchingID)
    }
  }

  const handleFetchingIdClick = () => {
    if (onViewFetchingDetails) {
      onViewFetchingDetails(fetchingID)
    }
  }

  const handleWorkflowIdClick = () => {
    if (onViewWorkflowDetails && workflowId !== null) {
      onViewWorkflowDetails(workflowId)
    }
  }

  const renderMessage = () => {
    switch (status?.toLowerCase()) {
      case "fetching success":
      case "success":
        return (
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Fetching completed successfully</h4>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">fetching success</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Feching process <ActivityBadge label={fetchingID} onClick={handleFetchingIdClick} />, executed within workflow
                  {" "}
                  {workflowId !== null ? (
                    <ActivityBadge label={workflowId} onClick={handleWorkflowIdClick} />
                  ) : (
                    "-"
                  )}, started on {formatDateTime(timestamp)} and finished at {completedAt ? formatDateTime(completedAt) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">
                  Feching {progress ?? 0}% of content in {fetchingTimeInSeconds ? formatMinutes(fetchingTimeInSeconds) : "N/A"}. Total
                  {" "}
                  <ActivityBadge label={numberOfContent || 0} onClick={handleContentClick} /> files.
                </p>
                <p className="text-xs text-gray-500">
                  Executed by: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )

      case "currently fetching":
      case "in progress":
      case "fetching":
        const elapsedMinutes = fetchingTimeInSeconds ? Math.round(fetchingTimeInSeconds / 60) : 0
        return (
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Flux is currently fetching</h4>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">currently fetching</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Fetching process <ActivityBadge label={fetchingID} onClick={handleFetchingIdClick} /> is in progress in workflow {" "}
                  {workflowId !== null ? (
                    <ActivityBadge label={workflowId} onClick={handleWorkflowIdClick} />
                  ) : (
                    "-"
                  )}
                  :
                </p>
                <p className="text-sm text-gray-700">
                  {progress || 0}% completed in {elapsedMinutes} min, currently {numberOfContent || 0} files.
                </p>
                <p className="text-xs text-gray-500">
                  Executing: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )

      case "fetching failed":
      case "failed":
      case "error":
        return (
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Fetching failed with errors</h4>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">fetching failed</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Fetching process <ActivityBadge label={fetchingID} onClick={handleFetchingIdClick} /> failed in workflow{' '}
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
                  {fetchingTimeInSeconds ? formatMinutes(fetchingTimeInSeconds) : "N/A"}.
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
              Fetching process <ActivityBadge label={fetchingID} onClick={handleFetchingIdClick} /> status: {status}
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
