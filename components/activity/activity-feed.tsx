"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActivityFilters } from "./activity-filters"
import { ActivityItem } from "./activity-item"
import type { ActivityEvent } from "@/types/activity"

interface ActivityFeedProps {
  fluxId: string
  onNavigateToFetchedContents?: (fetchingID: number) => void
  onNavigateToFetchedContentsFromProcessing?: (processingID: number) => void
  onViewFetchingDetails?: (fetchingID: number) => void
  onViewProcessingDetails?: (processingID: number) => void
  onViewWorkflowDetails?: (workflowId: number) => void
  onViewNormalizationDetails?: (normalizationID: number) => void
  onViewRefinementDetails?: (refinementID: number) => void
  onViewCalculationDetails?: (calculationID: number) => void
}

function encodeFilters(filters: { field: string; operator: string; value: any }[]): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(filters)))
  } catch {
    return ""
  }
}

function decodeFilters(encoded: string | null): { field: string; operator: string; value: any }[] {
  if (!encoded) return []
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch {
    return []
  }
}

async function fetchActivities({
  fluxId,
  page,
  pageSize,
  filters,
}: {
  fluxId: string
  page: number
  pageSize: number
  filters: { field: string; operator: string; value: any }[]
}) {
  const params = new URLSearchParams({
    fluxId,
    page: String(page),
    pageSize: String(pageSize),
  })
  if (filters.length > 0) {
    params.set("filters", encodeFilters(filters))
  }
  const res = await fetch(`/api/activities?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return (await res.json()) as {
    activities: ActivityEvent[]
    hasMore: boolean
    total: number
    error?: string
  }
}

export function ActivityFeed({
  fluxId,
  onNavigateToFetchedContents,
  onNavigateToFetchedContentsFromProcessing,
  onViewFetchingDetails,
  onViewProcessingDetails,
  onViewWorkflowDetails,
  onViewNormalizationDetails,
  onViewRefinementDetails,
  onViewCalculationDetails,
}: ActivityFeedProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialFilters = decodeFilters(searchParams.get("filters"))
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ field: string; operator: string; value: any }[]>(initialFilters)

  // Koristimo ref da pratimo da li je komponenta mount-ovana
  const isMountedRef = useRef(true)
  const loadingRef = useRef(false)

  console.log("🎯 ActivityFeed rendered with fluxId:", fluxId)

  const loadActivities = useCallback(
    async (pageNum: number, currentFilters: { field: string; operator: string; value: any }[], reset: boolean) => {
      // Sprečavamo duplo pozivanje
      if (loadingRef.current) {
        console.log("⏸️ Already loading, skipping...")
        return
      }

      try {
        loadingRef.current = true

        if (pageNum === 1) {
          setLoading(true)
          setError(null)
        } else {
          setLoadingMore(true)
        }

        console.log("📥 Loading activities:", { fluxId, pageNum, currentFilters, reset })

        const response = await fetchActivities({
          fluxId,
          page: pageNum,
          pageSize: 20,
          filters: currentFilters,
        })

        console.log("✅ Activities response:", {
          ...response,
          newActivitiesCount: response.activities.length,
          pageNum,
          reset,
        })

        if (response.error) {
          throw new Error(response.error)
        }

        // Proveravamo da li je komponenta još uvek mount-ovana
        if (!isMountedRef.current) return

        if (reset || pageNum === 1) {
          console.log("🔄 Resetting activities list")
          setActivities(response.activities)
        } else {
          console.log("➕ Appending activities to existing list")
          setActivities((prev) => {
            // Kreiraj Set postojećih ID-jeva da izbegneš duplikate
            const existingIds = new Set(prev.map((activity) => activity.id))
            const newActivities = response.activities.filter((activity) => !existingIds.has(activity.id))
            console.log("🆕 New unique activities:", newActivities.length)
            return [...prev, ...newActivities]
          })
        }

        setHasMore(response.hasMore)
        setPage(pageNum)
      } catch (err) {
        console.error("❌ Error loading activities:", err)
        if (isMountedRef.current) {
          setError("Failed to load activities. Please try again.")
        }
      } finally {
        loadingRef.current = false
        if (isMountedRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [fluxId],
  )

  // Početno učitavanje - samo kada se fluxId promeni
  useEffect(() => {
    if (fluxId) {
      console.log("🚀 Initial load for flux:", fluxId)
      setActivities([]) // Resetuj aktivnosti
      setPage(1) // Resetuj page
      loadActivities(1, filters, true)
    }
  }, [fluxId, loadActivities])

  // Cleanup funkcija
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const handleNavigateToFetchedContents = (event: CustomEvent) => {
      if (onNavigateToFetchedContents && event.detail?.fetchingID) {
        onNavigateToFetchedContents(event.detail.fetchingID)
      }
    }

    window.addEventListener("navigateToFetchedContents", handleNavigateToFetchedContents as EventListener)

    return () => {
      window.removeEventListener("navigateToFetchedContents", handleNavigateToFetchedContents as EventListener)
    }
  }, [onNavigateToFetchedContents])

  useEffect(() => {
    const handleNavigateToFetchedContentsProcessing = (event: CustomEvent) => {
      if (onNavigateToFetchedContentsFromProcessing && event.detail?.processingID) {
        onNavigateToFetchedContentsFromProcessing(event.detail.processingID)
      }
    }

    window.addEventListener(
      "navigateToFetchedContentsProcessing",
      handleNavigateToFetchedContentsProcessing as EventListener,
    )

    return () => {
      window.removeEventListener(
        "navigateToFetchedContentsProcessing",
        handleNavigateToFetchedContentsProcessing as EventListener,
      )
    }
  }, [onNavigateToFetchedContentsFromProcessing])

  const handleFilterChange = useCallback(
    (newFilters: { field: string; operator: string; value: any }[]) => {
      console.log("🔍 Filters changed:", newFilters)
      setFilters(newFilters)
      setActivities([]) // Resetuj aktivnosti
      setPage(1) // Resetuj page
      loadActivities(1, newFilters, true)
    },
    [loadActivities],
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (filters.length > 0) {
      params.set("filters", encodeFilters(filters))
    } else {
      params.delete("filters")
    }
    router.replace(`/recent-activity${params.toString() ? `?${params.toString()}` : ""}`)
  }, [filters])

  const handleLoadMore = useCallback(() => {
    console.log("🔄 Load more clicked:", {
      loadingMore,
      hasMore,
      page,
      currentActivitiesCount: activities.length,
      loadingRef: loadingRef.current,
    })

    if (!loadingMore && !loadingRef.current && hasMore) {
      loadActivities(page + 1, filters, false)
    }
  }, [loadingMore, hasMore, page, activities.length, loadActivities, filters])

  const handleRefresh = useCallback(() => {
    setActivities([])
    setPage(1)
    loadActivities(1, filters, true)
  }, [loadActivities, filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading activities...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none mx-auto">
      <div className="w-full sm:w-[90%] md:w-[80%] lg:w-[60%] mx-auto mb-6">
        <ActivityFilters initialFilters={filters} onFilterChange={handleFilterChange} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border w-full sm:w-[90%] md:w-[80%] lg:w-[60%] mx-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No activities found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            <div>
              {activities.map((activity) => (
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
                  className="px-6"
                />
              ))}
            </div>

            {hasMore && (
              <div className="p-4 border-t border-gray-100 text-center">
                <Button onClick={handleLoadMore} disabled={loadingMore || loadingRef.current} variant="outline">
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}

            <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-500">
              {hasMore
                ? `Showing ${activities.length} activities (more available)`
                : `Showing ${activities.length} ${activities.length === 1 ? "activity" : "activities"}`}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
