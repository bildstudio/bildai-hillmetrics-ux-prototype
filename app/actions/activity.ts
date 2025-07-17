"use server"

import { createServerClient } from "@/lib/supabase-server-client"

export interface ActivityEvent {
  id: string
  type:
    | "fetching"
    | "processing"
    | "normalization"
    | "refinement"
    | "calculation"
    | "flux_change"
  timestamp: string
  data: any
}

export type ActivityEventType =
  | "fetching"
  | "processing"
  | "normalization"
  | "refinement"
  | "calculation"
  | "flux_change"

interface Filter {
  field: string
  operator: string
  value: any
}

interface GetActivitiesParams {
  fluxId: string
  page?: number
  pageSize?: number
  filters?: Filter[]
}

interface ActivityResponse {
  activities: ActivityEvent[]
  hasMore: boolean
  total: number
  error?: string
}

export async function getActivities({
  fluxId,
  page = 1,
  pageSize = 20,
  filters = [],
}: GetActivitiesParams): Promise<ActivityResponse> {
  try {
    console.log("🔍 getActivities called with:", {
      fluxId,
      page,
      pageSize,
      filters,
      offset: (page - 1) * pageSize,
    })

    const supabase = await createServerClient()
    const offset = (page - 1) * pageSize
    const fetchRangeEnd = offset + pageSize

    // Get fetching history data
    let fetchingQuery = supabase.from("fetchinghistory").select("*")
    if (fluxId !== "all") {
      fetchingQuery = fetchingQuery
        .eq("fluxID", Number.parseInt(fluxId))
        .order("timestamp", { ascending: false })
        .range(offset, fetchRangeEnd)
    } else {
      fetchingQuery = fetchingQuery
        .order("timestamp", { ascending: false })
        .range(offset, fetchRangeEnd)
    }

    // Get processing history data
    let processingQuery = supabase.from("processinghistory").select("*")
    if (fluxId !== "all") {
      processingQuery = processingQuery
        .eq("fluxID", Number.parseInt(fluxId))
        .order("timestamp", { ascending: false })
        .range(offset, fetchRangeEnd)
    } else {
      processingQuery = processingQuery
        .order("timestamp", { ascending: false })
        .range(offset, fetchRangeEnd)
    }

    // Get normalization history data
    let normalizationQuery = supabase.from("normalization_history").select("*")
    if (fluxId !== "all") {
      normalizationQuery = normalizationQuery.eq(
        "fluxID",
        Number.parseInt(fluxId),
      )
    }
    normalizationQuery = normalizationQuery
      .order("timestamp", { ascending: false })
      .range(offset, fetchRangeEnd)

    // Get refinement history data
    let refinementQuery = supabase.from("refinement_history").select("*")
    if (fluxId !== "all") {
      refinementQuery = refinementQuery.eq(
        "fluxID",
        Number.parseInt(fluxId),
      )
    }
    refinementQuery = refinementQuery
      .order("timestamp", { ascending: false })
      .range(offset, fetchRangeEnd)

    // Get calculation history data
    let calculationQuery = supabase.from("calculation_history").select("*")
    if (fluxId !== "all") {
      calculationQuery = calculationQuery.eq(
        "fluxID",
        Number.parseInt(fluxId),
      )
    }
    calculationQuery = calculationQuery
      .order("timestamp", { ascending: false })
      .range(offset, fetchRangeEnd)

    let typeFilter: string[] | undefined

    for (const filter of filters || []) {
      const { field, operator, value } = filter
      if (field === "type") {
        if (Array.isArray(value)) typeFilter = value
        continue
      }
      switch (field) {
        case "status":
          if (operator === "in" && Array.isArray(value) && value.length) {
            fetchingQuery = fetchingQuery.in("status", value)
            processingQuery = processingQuery.in("status", value)
            normalizationQuery = normalizationQuery.in("status", value)
            refinementQuery = refinementQuery.in("status", value)
            calculationQuery = calculationQuery.in("status", value)
          }
          break
        case "progress":
          if (operator === "progress_ranges" && Array.isArray(value) && value.length) {
            const r = value[0]
            const apply = (q: any, col: string) => {
              switch (r) {
                case "0% - 25%":
                  return q.gte(col, 0).lte(col, 25)
                case "26% - 50%":
                  return q.gte(col, 26).lte(col, 50)
                case "51% - 75%":
                  return q.gte(col, 51).lte(col, 75)
                case "76% - 100%":
                  return q.gte(col, 76).lte(col, 100)
                default:
                  return q
              }
            }
            fetchingQuery = apply(fetchingQuery, "progress")
            processingQuery = apply(processingQuery, "progress")
            normalizationQuery = apply(normalizationQuery, "progress")
            refinementQuery = apply(refinementQuery, "progress")
            calculationQuery = apply(calculationQuery, "progress")
          }
          break
        case "duration":
          if (operator === "duration_ranges" && Array.isArray(value) && value.length) {
            const r = value[0]
            const apply = (q: any, col: string) => {
              switch (r) {
                case "0-1 min":
                  return q.gte(col, 0).lte(col, 60)
                case "1-2 min":
                  return q.gt(col, 60).lte(col, 120)
                case "2-5 min":
                  return q.gt(col, 120).lte(col, 300)
                case "5-10 min":
                  return q.gt(col, 300).lte(col, 600)
                case "10-20 min":
                  return q.gt(col, 600).lte(col, 1200)
                case "20+ min":
                  return q.gt(col, 1200)
                default:
                  return q
              }
            }
            fetchingQuery = apply(fetchingQuery, "fetchingTimeInSeconds")
            processingQuery = apply(processingQuery, "processingTimeInSeconds")
            normalizationQuery = apply(normalizationQuery, "normalizationTimeInSeconds")
            refinementQuery = apply(refinementQuery, "refinementTimeInSeconds")
            calculationQuery = apply(calculationQuery, "calculationTimeInSeconds")
          }
          break
        case "timestamp":
          if (operator === "date_range") {
            fetchingQuery = fetchingQuery
              .gte("timestamp", value.start.toISOString())
              .lte("timestamp", value.end.toISOString())
            processingQuery = processingQuery
              .gte("timestamp", value.start.toISOString())
              .lte("timestamp", value.end.toISOString())
            normalizationQuery = normalizationQuery
              .gte("timestamp", value.start.toISOString())
              .lte("timestamp", value.end.toISOString())
            refinementQuery = refinementQuery
              .gte("timestamp", value.start.toISOString())
              .lte("timestamp", value.end.toISOString())
            calculationQuery = calculationQuery
              .gte("timestamp", value.start.toISOString())
              .lte("timestamp", value.end.toISOString())
          } else if (operator === "custom_date_range") {
            if (value.after) {
              const after = value.after.includes("T") ? value.after : `${value.after}T00:00:00.000Z`
              fetchingQuery = fetchingQuery.gte("timestamp", after)
              processingQuery = processingQuery.gte("timestamp", after)
              normalizationQuery = normalizationQuery.gte("timestamp", after)
              refinementQuery = refinementQuery.gte("timestamp", after)
              calculationQuery = calculationQuery.gte("timestamp", after)
            }
            if (value.before) {
              const before = value.before.includes("T") ? value.before : `${value.before}T23:59:59.999Z`
              fetchingQuery = fetchingQuery.lte("timestamp", before)
              processingQuery = processingQuery.lte("timestamp", before)
              normalizationQuery = normalizationQuery.lte("timestamp", before)
              refinementQuery = refinementQuery.lte("timestamp", before)
              calculationQuery = calculationQuery.lte("timestamp", before)
            }
          }
          break
        case "completedAt":
          if (operator === "date_range") {
            fetchingQuery = fetchingQuery
              .gte("completedAt", value.start.toISOString())
              .lte("completedAt", value.end.toISOString())
            processingQuery = processingQuery
              .gte("completedAt", value.start.toISOString())
              .lte("completedAt", value.end.toISOString())
            normalizationQuery = normalizationQuery
              .gte("completedAt", value.start.toISOString())
              .lte("completedAt", value.end.toISOString())
            refinementQuery = refinementQuery
              .gte("completedAt", value.start.toISOString())
              .lte("completedAt", value.end.toISOString())
            calculationQuery = calculationQuery
              .gte("completedAt", value.start.toISOString())
              .lte("completedAt", value.end.toISOString())
          } else if (operator === "custom_date_range") {
            if (value.after) {
              const after = value.after.includes("T") ? value.after : `${value.after}T00:00:00.000Z`
              fetchingQuery = fetchingQuery.gte("completedAt", after)
              processingQuery = processingQuery.gte("completedAt", after)
              normalizationQuery = normalizationQuery.gte("completedAt", after)
              refinementQuery = refinementQuery.gte("completedAt", after)
              calculationQuery = calculationQuery.gte("completedAt", after)
            }
            if (value.before) {
              const before = value.before.includes("T") ? value.before : `${value.before}T23:59:59.999Z`
              fetchingQuery = fetchingQuery.lte("completedAt", before)
              processingQuery = processingQuery.lte("completedAt", before)
              normalizationQuery = normalizationQuery.lte("completedAt", before)
              refinementQuery = refinementQuery.lte("completedAt", before)
              calculationQuery = calculationQuery.lte("completedAt", before)
            }
          }
          break
        case "errorMessage":
          if (operator === "error_contains" && Array.isArray(value) && value.length) {
            const first = value[0]
            fetchingQuery = fetchingQuery.ilike("errorMessage", `%${first}%`)
            processingQuery = processingQuery.ilike("errorMessage", `%${first}%`)
            normalizationQuery = normalizationQuery.ilike("errorMessage", `%${first}%`)
            refinementQuery = refinementQuery.ilike("errorMessage", `%${first}%`)
            calculationQuery = calculationQuery.ilike("errorMessage", `%${first}%`)
          }
          break
      }
    }

    const fetchingResult = await fetchingQuery
    const processingResult = await processingQuery

    let normalizationResult = await normalizationQuery
    if (
      normalizationResult.error?.message.includes("timestamp") &&
      normalizationResult.error?.message.includes("does not exist")
    ) {
      console.warn(
        "⚠️ Normalization query failed due to missing timestamp column. Retrying with started_at...",
      )
      let nq = supabase.from("normalization_history").select("*")
      if (fluxId !== "all") {
        nq = nq.eq("fluxID", Number.parseInt(fluxId))
      }
      normalizationResult = await nq
        .order("started_at", { ascending: false })
        .range(offset, fetchRangeEnd)
      if (
        normalizationResult.error?.message.includes("started_at") &&
        normalizationResult.error?.message.includes("does not exist")
      ) {
        console.warn(
          "⚠️ Normalization query missing started_at as well. Retrying without ordering...",
        )
        nq = supabase.from("normalization_history").select("*")
        if (fluxId !== "all") {
          nq = nq.eq("fluxID", Number.parseInt(fluxId))
        }
        normalizationResult = await nq.range(offset, fetchRangeEnd)
      }
    }

    // Attempt refinement query; retry without timestamp ordering on failure
    let refinementResult = await refinementQuery
    if (
      refinementResult.error?.message.includes("timestamp") &&
      refinementResult.error?.message.includes("does not exist")
    ) {
      console.warn(
        "⚠️ Refinement query failed due to missing timestamp column. Retrying without ordering...",
      )
      let rq = supabase.from("refinement_history").select("*")
      if (fluxId !== "all") {
        rq = rq.eq("fluxID", Number.parseInt(fluxId))
      }
      refinementResult = await rq.range(offset, fetchRangeEnd)
    }

    // Attempt calculation query; retry with alternative ordering on failure
    let calculationResult = await calculationQuery
    if (
      calculationResult.error?.message.includes("timestamp") &&
      calculationResult.error?.message.includes("does not exist")
    ) {
      console.warn(
        "⚠️ Calculation query failed due to missing timestamp column. Retrying with started_at...",
      )
      let cq = supabase.from("calculation_history").select("*")
      if (fluxId !== "all") {
        cq = cq.eq("fluxID", Number.parseInt(fluxId))
      }
      calculationResult = await cq
        .order("started_at", { ascending: false })
        .range(offset, fetchRangeEnd)
      if (
        calculationResult.error?.message.includes("started_at") &&
        calculationResult.error?.message.includes("does not exist")
      ) {
        console.warn(
          "⚠️ Calculation query missing started_at as well. Retrying without ordering...",
        )
        cq = supabase.from("calculation_history").select("*")
        if (fluxId !== "all") {
          cq = cq.eq("fluxID", Number.parseInt(fluxId))
        }
        calculationResult = await cq.range(offset, fetchRangeEnd)
      }
    }

    if (fetchingResult.error) {
      console.error("❌ Error fetching activities:", fetchingResult.error)
      return {
        activities: [],
        hasMore: false,
        total: 0,
        error: fetchingResult.error.message,
      }
    }

    if (processingResult.error) {
      console.error("❌ Error fetching processing activities:", processingResult.error)
      return {
        activities: [],
        hasMore: false,
        total: 0,
        error: processingResult.error.message,
      }
    }

    if (normalizationResult.error) {
      console.warn(
        "⚠️ Normalization query failed:",
        normalizationResult.error.message,
      )
    }

    if (refinementResult.error) {
      console.warn(
        "⚠️ Refinement query failed:",
        refinementResult.error.message,
      )
    }

    if (calculationResult.error) {
      console.warn(
        "⚠️ Calculation query failed:",
        calculationResult.error.message,
      )
    }

    console.log("📊 Raw data counts:", {
      fetchingCount: fetchingResult.data?.length || 0,
      processingCount: processingResult.data?.length || 0,
      normalizationCount: normalizationResult.data?.length || 0,
      refinementCount: refinementResult.data?.length || 0,
      calculationCount: calculationResult.data?.length || 0,
    })

    // Transform fetching data to activity events
    const fetchingActivities: ActivityEvent[] = (fetchingResult.data || []).map((item) => ({
      id: `fetching-${item.fetchingID}`,
      type: "fetching" as const,
      timestamp: item.timestamp,
      data: {
        fetchingID: item.fetchingID,
        fluxID: item.fluxID,
        status: item.status,
        timestamp: item.timestamp,
        completedAt: item.completedAt,
        fetchingTimeInSeconds: item.fetchingTimeInSeconds,
        progress: item.progress,
        numberOfContent: item.numberOfContent,
        errorMessage: item.errorMessage,
      },
    }))

    // Transform processing data to activity events
    const processingActivities: ActivityEvent[] = (processingResult.data || []).map((item) => ({
      id: `processing-${item.processingID}`,
      type: "processing" as const,
      timestamp: item.timestamp,
      data: {
        processingID: item.processingID,
        fluxID: item.fluxID,
        status: item.status,
        timestamp: item.timestamp,
        completedAt: item.completedAt,
        processingTimeInSeconds: item.processingTimeInSeconds,
        progress: item.progress,
        numberOfContent: item.numberOfProcessingContent,
        errorMessage: item.errorMessage,
      },
    }))

    // Transform normalization data to activity events
    const normalizationActivities: ActivityEvent[] =
      (normalizationResult.error ? [] : normalizationResult.data || []).map(
        (item) => ({
          id: `normalization-${item.normalizationID}`,
          type: "normalization" as const,
          timestamp: (item as any).timestamp || (item as any).started_at,
          data: {
            normalizationID: item.normalizationID,
        fluxID: item.fluxID,
        status: item.status,
        timestamp: (item as any).timestamp || (item as any).started_at,
        completedAt: item.completedAt || (item as any).completed_at,
        normalizationTimeInSeconds: item.normalizationTimeInSeconds,
        progress: item.progress,
        numberOfItems: item.numberOfItems,
        errorMessage: item.errorMessage,
      },
    }))

    // Transform refinement data to activity events
    const refinementActivities: ActivityEvent[] =
      (refinementResult.error ? [] : refinementResult.data || []).map((item) => ({
          id: `refinement-${item.refinementID}`,
          type: "refinement" as const,
          timestamp: (item as any).timestamp || (item as any).started_at,
          data: {
            refinementID: item.refinementID,
            fluxID: item.fluxID,
            status: item.status,
            timestamp: (item as any).timestamp || (item as any).started_at,
            completedAt: item.completedAt || (item as any).completed_at,
            refinementTimeInSeconds: item.refinementTimeInSeconds,
            progress: item.progress,
            numberOfItems: item.numberOfItems,
            errorMessage: item.errorMessage,
      },
    }))

    // Transform calculation data to activity events
    const calculationActivities: ActivityEvent[] =
      (calculationResult.error ? [] : calculationResult.data || []).map((item) => ({
          id: `calculation-${item.calculationID}`,
          type: "calculation" as const,
          timestamp: (item as any).timestamp || (item as any).started_at,
          data: {
            calculationID: item.calculationID,
            fluxID: item.fluxID,
            status: item.status,
            timestamp: (item as any).timestamp || (item as any).started_at,
            completedAt: item.completedAt || (item as any).completed_at,
            calculationTimeInSeconds: item.calculationTimeInSeconds,
            progress: item.progress,
            numberOfItems: item.numberOfItems,
            errorMessage: item.errorMessage,
      },
    }))

    // Combine and sort all activities by timestamp (most recent first)
    let allActivities = [
      ...fetchingActivities,
      ...processingActivities,
      ...normalizationActivities,
      ...refinementActivities,
      ...calculationActivities,
    ].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    if (typeFilter && typeFilter.length) {
      allActivities = allActivities.filter((a) => typeFilter!.includes(a.type))
    }

    const filteredActivities = allActivities

    console.log("📋 Before pagination:", {
      totalActivities: filteredActivities.length,
      requestedPage: page,
      pageSize,
    })

    // Apply pagination using the limited result set
    const paginatedActivities = filteredActivities.slice(0, pageSize)
    const hasMore = filteredActivities.length > pageSize

    console.log("✅ Processed activities:", {
      total: filteredActivities.length,
      fetching: fetchingActivities.length,
      processing: processingActivities.length,
      normalization: normalizationActivities.length,
      refinement: refinementActivities.length,
      calculation: calculationActivities.length,
      returned: paginatedActivities.length,
      hasMore,
      page,
    })

    return {
      activities: paginatedActivities,
      hasMore,
      total: offset + paginatedActivities.length + (hasMore ? 1 : 0),
    }
  } catch (error) {
    console.error("❌ Error in getActivities:", error)
    return {
      activities: [],
      hasMore: false,
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
