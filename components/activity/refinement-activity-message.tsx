"use client"

import { formatDistanceToNow, format } from "date-fns"
import { CheckCircle, RefreshCw, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RefinementData {
  refinementID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt?: string
  refinementTimeInSeconds?: number
  progress?: number
  numberOfItems?: number
  errorMessage?: string
}

interface RefinementActivityMessageProps {
  data: RefinementData
  onViewRefinementDetails?: (refinementID: number) => void
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

export function RefinementActivityMessage({
  data,
  onViewRefinementDetails,
  className,
}: RefinementActivityMessageProps) {
  const {
    refinementID,
    status,
    timestamp,
    completedAt,
    refinementTimeInSeconds,
    progress,
    numberOfItems,
    errorMessage,
  } = data

  const handleIdClick = () => {
    if (onViewRefinementDetails) {
      onViewRefinementDetails(refinementID)
    }
  }

  const renderMessage = () => {
    switch (status?.toLowerCase()) {
      case "refinement success":
      case "success":
        return (
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Refinement completed successfully</h4>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">refinement success</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Refinement job <ActivityBadge label={refinementID} onClick={handleIdClick} /> started at {formatDateTime(timestamp)} completed at {completedAt ? formatDateTime(completedAt) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">
                  Processed 100% of items in {refinementTimeInSeconds ? formatMinutes(refinementTimeInSeconds) : "N/A"}. Total <ActivityBadge label={numberOfItems || 0} /> items refined.
                </p>
                <p className="text-xs text-gray-500">
                  Executed by: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )
      case "currently refining":
      case "currently refinement":
      case "in progress":
      case "refining":
        const elapsedMinutes = refinementTimeInSeconds ? Math.round(refinementTimeInSeconds / 60) : 0
        return (
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Flux is currently refining</h4>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">currently refining</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Refinement job <ActivityBadge label={refinementID} onClick={handleIdClick} /> is in progress:
                </p>
                <p className="text-sm text-gray-700">
                  {progress || 0}% completed in {elapsedMinutes} min, currently processing {numberOfItems || 0} items.
                </p>
                <p className="text-xs text-gray-500">
                  Executing: <strong>System</strong> · {timeAgo(timestamp)}
                </p>
              </div>
            </div>
          </div>
        )
      case "refinement failed":
      case "failed":
      case "error":
        return (
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black text-sm">Refinement failed with errors</h4>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">refinement failed</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Refinement job <ActivityBadge label={refinementID} onClick={handleIdClick} /> failed:
                </p>
                <p className="text-sm text-red-600">Reason – {errorMessage || "Unknown error"}.</p>
                <p className="text-sm text-gray-700">
                  Started {formatDateTime(timestamp)}, stopped {completedAt ? formatDateTime(completedAt) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">
                  Processed {progress || 0}% before error, lasted {refinementTimeInSeconds ? formatMinutes(refinementTimeInSeconds) : "N/A"}.
                </p>
                <p className="text-sm text-gray-700">Affected items: {numberOfItems || 0}.</p>
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
              Refinement job <ActivityBadge label={refinementID} onClick={handleIdClick} /> status: {status}
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
