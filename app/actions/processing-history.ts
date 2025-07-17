"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"
import type { StatusCount, DurationCount, ErrorTypeCount } from "./fetching-history"

export interface ProcessingHistoryData {
  processingID: number
  fluxID: number
  fetchingID: number | null
  status: string
  timestamp: string
  completedAt: string | null
  processingTimeInSeconds: number | null
  progress: number | null
  numberOfProcessingContent: number | null
  errorMessage: string | null
}

interface ProcessingHistoryResult {
  data: ProcessingHistoryData[]
  totalCount: number
  error: PostgrestError | null
}

interface GetProcessingHistoryParams {
  fluxId: string
  page: number
  pageSize: number
  sortColumn: keyof ProcessingHistoryData | null
  sortDirection: "asc" | "desc" | null
  filters: { field: string; operator: string; value: any }[]
}


export async function getProcessingHistory({
  fluxId,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  filters,
}: GetProcessingHistoryParams): Promise<ProcessingHistoryResult> {
  const supabase = await createServerClient()
  const fluxIdNum = Number.parseInt(fluxId, 10)

  let query = supabase.from("processinghistory").select("*", { count: "exact" })

  if (fluxId && fluxId !== "all") {
    if (isNaN(fluxIdNum)) {
      return { data: [], totalCount: 0, error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" } }
    }
    query = query.eq("fluxID", fluxIdNum)
  }

  filters.forEach((filter) => {
    const { field, operator, value } = filter
    if (value === null || value === undefined || value === "") return

    switch (operator) {
      case "contains":
        query = query.ilike(field, `%${value}%`)
        break
      case "equals":
        if (field === "fetchingID") {
          const fetchingIdNum = Number.parseInt(String(value), 10)
          if (!isNaN(fetchingIdNum)) {
            query = query.eq("fetchingID", fetchingIdNum)
          }
        } else {
          query = query.eq(field, value)
        }
        break
      case "startsWith":
        query = query.ilike(field, `${value}%`)
        break
      case "endsWith":
        query = query.ilike(field, `%${value}`)
        break
      case "greaterThan":
        query = query.gt(field, value)
        break
      case "lessThan":
        query = query.lt(field, value)
        break
      case "in":
        if (Array.isArray(value) && value.length > 0) {
          query = query.in(field, value)
        }
        break
      case "before":
        query = query.lt(field, value)
        break
      case "after":
        query = query.gt(field, value)
        break
      case "progress_ranges":
        if (Array.isArray(value) && value.length > 0) {
          const firstRange = value[0]
          switch (firstRange) {
            case "0% - 25%":
              query = query.gte("progress", 0).lte("progress", 25)
              break
            case "26% - 50%":
              query = query.gte("progress", 26).lte("progress", 50)
              break
            case "51% - 75%":
              query = query.gte("progress", 51).lte("progress", 75)
              break
            case "76% - 100%":
              query = query.gte("progress", 76).lte("progress", 100)
              break
          }
        }
        break
      case "duration_ranges":
        if (Array.isArray(value) && value.length > 0) {
          const firstRange = value[0]
          switch (firstRange) {
            case "0-1 min":
              query = query.gte("processingTimeInSeconds", 0).lte("processingTimeInSeconds", 60)
              break
            case "1-2 min":
              query = query.gt("processingTimeInSeconds", 60).lte("processingTimeInSeconds", 120)
              break
            case "2-5 min":
              query = query.gt("processingTimeInSeconds", 120).lte("processingTimeInSeconds", 300)
              break
            case "5-10 min":
              query = query.gt("processingTimeInSeconds", 300).lte("processingTimeInSeconds", 600)
              break
            case "10-20 min":
              query = query.gt("processingTimeInSeconds", 600).lte("processingTimeInSeconds", 1200)
              break
            case "20+ min":
              query = query.gt("processingTimeInSeconds", 1200)
              break
          }
        }
        break
      case "date_range":
        if (value && typeof value === "object" && value.start && value.end) {
          const startDate = value.start instanceof Date ? value.start.toISOString() : value.start
          const endDate = value.end instanceof Date ? value.end.toISOString() : value.end
          query = query.gte(field, startDate).lte(field, endDate)
        }
        break
      case "custom_date_range":
        if (value && typeof value === "object") {
          if (value.after) {
            const afterDate = value.after.includes("T") ? value.after : `${value.after}T00:00:00.000Z`
            query = query.gte(field, afterDate)
          }
          if (value.before) {
            const beforeDate = value.before.includes("T") ? value.before : `${value.before}T23:59:59.999Z`
            query = query.lte(field, beforeDate)
          }
        }
        break
      case "error_contains":
        if (Array.isArray(value) && value.length > 0) {
          const firstErrorType = value[0]
          query = query.ilike("errorMessage", `%${firstErrorType}%`)
        }
        break
    }
  })

  if (sortColumn && sortDirection) {
    query = query.order(sortColumn, { ascending: sortDirection === "asc" })
  } else {
    query = query.order("timestamp", { ascending: false })
  }

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize - 1
  query = query.range(startIndex, endIndex)

  const { data, error, count } = await query

  return {
    data: data as ProcessingHistoryData[],
    totalCount: count ?? 0,
    error,
  }
}

export async function getProcessingStatusCounts(
  fluxId: string,
): Promise<{ data: StatusCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("processinghistory").select("status")
  if (fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (isNaN(fluxIdNum)) {
      return {
        data: [],
        error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" },
      }
    }
    query = query.eq("fluxID", fluxIdNum)
  }
  const { data, error } = await query

  if (error) {
    return { data: [], error }
  }

  const counts: Record<string, number> = {}
  ;(data as { status: string }[]).forEach((row) => {
    counts[row.status] = (counts[row.status] || 0) + 1
  })

  const result = Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }))

  return { data: result, error: null }
}

export async function getProcessingDurationBuckets(
  fluxId: string,
): Promise<{ data: DurationCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("processinghistory").select("processingTimeInSeconds")
  if (fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (isNaN(fluxIdNum)) {
      return {
        data: [],
        error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" },
      }
    }
    query = query.eq("fluxID", fluxIdNum)
  }
  const { data, error } = await query

  if (error) {
    return { data: [], error }
  }

  const buckets: Record<string, number> = {
    "0-1 min": 0,
    "1-2 min": 0,
    "2-5 min": 0,
    "5-10 min": 0,
    "10-20 min": 0,
    "20+ min": 0,
  }

  ;(data as { processingTimeInSeconds: number | null }[]).forEach((row) => {
    const t = row.processingTimeInSeconds
    if (t === null) return
    if (t <= 60) buckets["0-1 min"]++
    else if (t <= 120) buckets["1-2 min"]++
    else if (t <= 300) buckets["2-5 min"]++
    else if (t <= 600) buckets["5-10 min"]++
    else if (t <= 1200) buckets["10-20 min"]++
    else buckets["20+ min"]++
  })

  const result = Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }))

  return { data: result, error: null }
}

export async function getProcessingErrorTypes(
  fluxId: string,
): Promise<{ data: ErrorTypeCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("processinghistory").select("errorMessage").not("errorMessage", "is", null)
  if (fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (isNaN(fluxIdNum)) {
      return {
        data: [],
        error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" },
      }
    }
    query = query.eq("fluxID", fluxIdNum)
  }
  const { data, error } = await query

  if (error) {
    return { data: [], error }
  }

  const counts: Record<string, number> = {}
  ;(data as { errorMessage: string | null }[]).forEach((row) => {
    if (!row.errorMessage) return
    counts[row.errorMessage] = (counts[row.errorMessage] || 0) + 1
  })

  const result = Object.entries(counts).map(([message, count]) => ({
    message,
    count,
  }))

  return { data: result, error: null }
}

export interface TrendRow {
  status: string
  timestamp: string
}

export async function getProcessingTrend(
  fluxId: string,
  startDate?: string,
  endDate?: string,
): Promise<{ data: TrendRow[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("processinghistory").select("status,timestamp")
  if (fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (isNaN(fluxIdNum)) {
      return {
        data: [],
        error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" },
      }
    }
    query = query.eq("fluxID", fluxIdNum)
  }
  if (startDate) query = query.gte("timestamp", startDate)
  if (endDate) query = query.lte("timestamp", endDate)
  const { data, error } = await query.order("timestamp", { ascending: true })
  return { data: (data as TrendRow[]) || [], error }
}

export async function getProcessingHistoryById(
  processingId: number,
): Promise<{ data: ProcessingHistoryData | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("processinghistory")
    .select("*")
    .eq("processingID", processingId)
    .single()
  return { data: data as ProcessingHistoryData | null, error }
}
