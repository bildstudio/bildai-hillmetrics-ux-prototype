"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ActivityEvent } from "@/app/actions/activity"
import { ActivityItem } from "@/components/activity/activity-item"

export default function RecentActivity({
  fluxId,
  onNavigate,
  onNavigateToFetchedContents,
  onNavigateToFetchedContentsFromProcessing,
  onViewFetchingDetails,
  onViewProcessingDetails,
  onViewWorkflowDetails,
  onViewNormalizationDetails,
  onViewRefinementDetails,
  onViewCalculationDetails,
}: {
  fluxId: string
  onNavigate: (tab: string) => void
  onNavigateToFetchedContents: (fetchingID: number) => void
  onNavigateToFetchedContentsFromProcessing: (processingID: number) => void
  onViewFetchingDetails?: (fetchingID: number) => void
  onViewProcessingDetails?: (processingID: number) => void
  onViewWorkflowDetails?: (workflowID: number) => void
  onViewNormalizationDetails?: (normalizationID: number) => void
  onViewRefinementDetails?: (refinementID: number) => void
  onViewCalculationDetails?: (calculationID: number) => void
}) {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(
        `/api/activities?fluxId=${fluxId}&page=1&pageSize=20`,
      )
      const data = await res.json()
      if (!data.error) setActivities(data.activities)
      setLoading(false)
    }
    load()
  }, [fluxId])

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow relative lg:ml-4 h-[420px] overflow-hidden">
      <div className="sticky top-0 bg-white z-10 pb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="text-sm text-gray-500">
          Stay up to date with what's happening across the flux.{" "}
          <button
            onClick={(e) => {
              e.preventDefault()
              onNavigate("activity")
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            View all activity
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </p>
      </div>
      <div className="mt-2 max-h-[340px] overflow-y-auto gmail-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 px-6">No activity found.</div>
        ) : (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onNavigateToFetchedContents={onNavigateToFetchedContents}
              onNavigateToFetchedContentsFromProcessing={onNavigateToFetchedContentsFromProcessing}
              onViewFetchingDetails={onViewFetchingDetails}
              onViewProcessingDetails={onViewProcessingDetails}
              onViewWorkflowDetails={onViewWorkflowDetails}
              onViewNormalizationDetails={onViewNormalizationDetails}
              onViewRefinementDetails={onViewRefinementDetails}
              onViewCalculationDetails={onViewCalculationDetails}
            />
          ))
        )}
      </div>
    </div>
  )
}
