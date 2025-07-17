"use client"

import { ActivityMessage } from "./activity-message"
import { ProcessingActivityMessage } from "./processing-activity-message"
import { NormalizationActivityMessage } from "./normalization-activity-message"
import { RefinementActivityMessage } from "./refinement-activity-message"
import { CalculationActivityMessage } from "./calculation-activity-message"
import type { ActivityEvent } from "@/app/actions/activity"

interface ActivityItemProps {
  activity: ActivityEvent
  onNavigateToFetchedContents?: (fetchingID: number) => void
  onNavigateToFetchedContentsFromProcessing?: (processingID: number) => void
  onViewFetchingDetails?: (fetchingID: number) => void
  onViewProcessingDetails?: (processingID: number) => void
  onViewWorkflowDetails?: (workflowId: number) => void
  onViewNormalizationDetails?: (normalizationID: number) => void
  onViewRefinementDetails?: (refinementID: number) => void
  onViewCalculationDetails?: (calculationID: number) => void
  /** Optional class applied to the inner content wrapper. */
  className?: string
}

export function ActivityItem({
  activity,
  onNavigateToFetchedContents,
  onNavigateToFetchedContentsFromProcessing,
  onViewFetchingDetails,
  onViewProcessingDetails,
  onViewWorkflowDetails,
  onViewNormalizationDetails,
  onViewRefinementDetails,
  onViewCalculationDetails,
  className,
}: ActivityItemProps) {
  const handleNavigateToFetchedContents = (fetchingID: number) => {
    // Dispatch custom event for navigation
    const event = new CustomEvent("navigateToFetchedContents", {
      detail: { fetchingID },
    })
    window.dispatchEvent(event)

    // Also call the prop callback if provided
    if (onNavigateToFetchedContents) {
      onNavigateToFetchedContents(fetchingID)
    }
  }

  const handleNavigateToFetchedContentsProcessing = (processingID: number) => {
    const event = new CustomEvent("navigateToFetchedContentsProcessing", {
      detail: { processingID },
    })
    window.dispatchEvent(event)

    if (onNavigateToFetchedContentsFromProcessing) {
      onNavigateToFetchedContentsFromProcessing(processingID)
    }
  }

  const handleViewFetchingDetails = (fetchingID: number) => {
    if (onViewFetchingDetails) {
      onViewFetchingDetails(fetchingID)
    }
  }

  const handleViewNormalizationDetails = (normalizationID: number) => {
    if (onViewNormalizationDetails) {
      onViewNormalizationDetails(normalizationID)
    }
  }

  const handleViewRefinementDetails = (refinementID: number) => {
    if (onViewRefinementDetails) {
      onViewRefinementDetails(refinementID)
    }
  }

  const handleViewCalculationDetails = (calculationID: number) => {
    if (onViewCalculationDetails) {
      onViewCalculationDetails(calculationID)
    }
  }

  const handleViewWorkflowDetails = (workflowId: number) => {
    if (onViewWorkflowDetails) {
      onViewWorkflowDetails(workflowId)
    }
  }

  if (activity.type === "fetching") {
    return (
      <ActivityMessage
        data={activity.data}
        onNavigateToFetchedContents={handleNavigateToFetchedContents}
        onViewFetchingDetails={handleViewFetchingDetails}
        onViewWorkflowDetails={handleViewWorkflowDetails}
        className={className}
      />
    )
  }

  if (activity.type === "processing") {
    return (
      <ProcessingActivityMessage
        data={activity.data}
        onNavigateToFetchedContents={handleNavigateToFetchedContentsProcessing}
        onViewProcessingDetails={onViewProcessingDetails}
        onViewWorkflowDetails={handleViewWorkflowDetails}
        className={className}
      />
    )
  }

  if (activity.type === "normalization") {
    return (
      <NormalizationActivityMessage
        data={activity.data}
        onViewNormalizationDetails={handleViewNormalizationDetails}
        className={className}
      />
    )
  }

  if (activity.type === "refinement") {
    return (
      <RefinementActivityMessage
        data={activity.data}
        onViewRefinementDetails={handleViewRefinementDetails}
        className={className}
      />
    )
  }

  if (activity.type === "calculation") {
    return (
      <CalculationActivityMessage
        data={activity.data}
        onViewCalculationDetails={handleViewCalculationDetails}
        className={className}
      />
    )
  }

  // Fallback for other activity types
  return (
    <div className="py-4 px-0">
      <div className={className}>
        <p className="text-sm text-gray-900">{activity.type} activity</p>
        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
      </div>
    </div>
  )
}
