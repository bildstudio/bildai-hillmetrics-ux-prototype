"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

// Definišemo tip za jedan zapis istorije fetch-ovanja
export interface FetchingHistoryData {
  fetchingID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt: string | null
  fetchingTimeInSeconds: number | null
  progress: number | null
  numberOfContent: number | null
  errorMessage: string | null
  processingsCount: Array<{ count: number }> | null // Ažuriran tip
}

// Definišemo tip za povratnu vrednost funkcije
interface FetchingHistoryResult {
  data: FetchingHistoryData[]
  totalCount: number
  error: PostgrestError | null
}

// Definišemo tip za parametre funkcije
interface GetFetchingHistoryParams {
  fluxId: string
  page: number
  pageSize: number
  sortColumn: keyof FetchingHistoryData | null
  sortDirection: "asc" | "desc" | null
  filters: { field: string; operator: string; value: any }[]
}

export async function getFetchingHistory({
  fluxId,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  filters,
}: GetFetchingHistoryParams): Promise<FetchingHistoryResult> {
  const supabase = await createServerClient()
  const fluxIdNum = Number.parseInt(fluxId, 10)

  // Bazični upit za fetching history bez pridruženog brojanja processing zapisa
  // Dodavanje procesa u SELECT je u nekim slučajevima uzrokovalo veoma spore
  // upite i timeout-ove na bazi. Stoga ovde dohvataju samo kolone iz
  // `fetchinghistory`, dok će se broj procesiranja za prikazane fetchinge
  // dohvatiti u posebnoj funkciji.
  let query = supabase.from("fetchinghistory").select("*", { count: "exact" })

  if (fluxId && fluxId !== "all") {
    if (isNaN(fluxIdNum)) {
      return { data: [], totalCount: 0, error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" } }
    }
    query = query.eq("fluxID", fluxIdNum)
  }

  // Primenjujemo filtere
  filters.forEach((filter) => {
    const { field, operator, value } = filter
    if (value === null || value === undefined || value === "") return

    switch (operator) {
      case "contains":
        query = query.ilike(field, `%${value}%`)
        break
      case "equals":
        query = query.eq(field, value)
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
      case "between":
        // Expects value in format "from,to" or {from, to}
        if (typeof value === 'string' && value.includes(',')) {
          const [from, to] = value.split(',')
          query = query.gte(field, from).lte(field, to)
        } else if (value && typeof value === 'object' && value.from && value.to) {
          query = query.gte(field, value.from).lte(field, value.to)
        }
        break
      case "progress_ranges":
        if (Array.isArray(value) && value.length > 0) {
          // Simplified approach: use the first range for now
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
          // Simplified approach: use the first range for now
          const firstRange = value[0]
          switch (firstRange) {
            case "0-1 min":
              query = query.gte("fetchingTimeInSeconds", 0).lte("fetchingTimeInSeconds", 60)
              break
            case "1-2 min":
              query = query.gt("fetchingTimeInSeconds", 60).lte("fetchingTimeInSeconds", 120)
              break
            case "2-5 min":
              query = query.gt("fetchingTimeInSeconds", 120).lte("fetchingTimeInSeconds", 300)
              break
            case "5-10 min":
              query = query.gt("fetchingTimeInSeconds", 300).lte("fetchingTimeInSeconds", 600)
              break
            case "10-20 min":
              query = query.gt("fetchingTimeInSeconds", 600).lte("fetchingTimeInSeconds", 1200)
              break
            case "20+ min":
              query = query.gt("fetchingTimeInSeconds", 1200)
              break
          }
        }
        break
      case "date_range":
        if (value && typeof value === "object" && value.start && value.end) {
          // Convert Date objects to ISO strings if needed
          const startDate = value.start instanceof Date ? value.start.toISOString() : value.start
          const endDate = value.end instanceof Date ? value.end.toISOString() : value.end
          query = query.gte(field, startDate).lte(field, endDate)
        }
        break
      case "custom_date_range":
        if (value && typeof value === "object") {
          if (value.after) {
            // Ensure we have a proper date format
            const afterDate = value.after.includes("T") ? value.after : `${value.after}T00:00:00.000Z`
            query = query.gte(field, afterDate)
          }
          if (value.before) {
            // Ensure we have a proper date format
            const beforeDate = value.before.includes("T") ? value.before : `${value.before}T23:59:59.999Z`
            query = query.lte(field, beforeDate)
          }
        }
        break
      case "error_contains":
        if (Array.isArray(value) && value.length > 0) {
          // For multiple error types, let's use the first one for now
          // We can improve this later to handle multiple OR conditions properly
          const firstErrorType = value[0]
          query = query.ilike("errorMessage", `%${firstErrorType}%`)
        }
        break
    }
  })

  // Primenjujemo sortiranje
  if (sortColumn && sortDirection) {
    query = query.order(sortColumn, { ascending: sortDirection === "asc" })
  } else {
    // Podrazumevano sortiranje po najnovijem
    query = query.order("timestamp", { ascending: false })
  }

  // Primenjujemo paginaciju
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize - 1
  query = query.range(startIndex, endIndex)

  const { data, error, count } = await query

  return {
    data: data as FetchingHistoryData[],
    totalCount: count ?? 0,
    error,
  }
}

export interface StatusCount {
  status: string
  count: number
}

export interface DurationCount {
  bucket: string
  count: number
}

export interface ErrorTypeCount {
  message: string
  count: number
}


export async function getFetchingStatusCounts(
  fluxId: string,
): Promise<{ data: StatusCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("fetchinghistory").select("status")
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

export async function getFetchingDurationBuckets(
  fluxId: string,
): Promise<{ data: DurationCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("fetchinghistory").select("fetchingTimeInSeconds")
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

  ;(data as { fetchingTimeInSeconds: number | null }[]).forEach((row) => {
    const t = row.fetchingTimeInSeconds
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

export async function getFetchingErrorTypes(
  fluxId: string,
): Promise<{ data: ErrorTypeCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("fetchinghistory").select("errorMessage").not("errorMessage", "is", null)
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

export async function getFetchingTrend(
  fluxId: string,
  startDate?: string,
  endDate?: string,
): Promise<{ data: TrendRow[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  let query = supabase.from("fetchinghistory").select("status,timestamp")
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

// Dohvata broj processing zapisa za dati niz fetchingID vrednosti. Ovo se
// koristi kako bismo izbegli skupe JOIN operacije prilikom glavnog upita za
// fetching history.
export async function getProcessingCounts(
  fetchingIds: number[],
): Promise<{ data: Record<number, number>; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  if (!fetchingIds.length) {
    return { data: {}, error: null }
  }

  const { data, error } = await supabase
    .from('processinghistory')
    .select('fetchingID, count:processingID', { group: 'fetchingID' })
    .in('fetchingID', fetchingIds)

  if (error) {
    return { data: {}, error }
  }

  const counts: Record<number, number> = {}
  ;(data as { fetchingID: number; count: number }[]).forEach((row) => {
    counts[row.fetchingID] = row.count
  })

  return { data: counts, error: null }
}

export async function getFetchingHistoryById(
  fetchingId: number,
): Promise<{ data: FetchingHistoryData | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("fetchinghistory")
    .select("*")
    .eq("fetchingID", fetchingId)
    .single()
  return { data: data as FetchingHistoryData | null, error }
}
