"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

interface StatusCount {
  status: string
  count: number
}

export interface WorkflowExecutionLogData {
  id: number
  flux_id: number
  flux_name: string | null
  run_number: number
  status: string
  progress: number | null
  started_at: string
  completed_at: string | null
  duration_active: number | null
  duration_minutes?: number | null
  duration_seconds?: number | null
  content_count: number | null
  steps: number | null
  last_stage: string | null
  fetching_id: number | null
  processing_id: number | null
  normalization_id: number | null
  refinement_id: number | null
  calculation_id: number | null
}

interface WorkflowExecutionLogResult {
  data: WorkflowExecutionLogData[]
  totalCount: number
  error: PostgrestError | null
}

interface GetWorkflowExecutionLogParams {
  fluxId: string
  page: number
  pageSize: number
  sortColumn: keyof WorkflowExecutionLogData | null
  sortDirection: "asc" | "desc" | null
  filters: { field: string; operator: string; value: any }[]
}

export async function getWorkflowExecutionLog({
  fluxId,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  filters,
}: GetWorkflowExecutionLogParams): Promise<WorkflowExecutionLogResult> {
  const supabase = await createServerClient()
  const fluxIdNum = Number.parseInt(fluxId, 10)

  let query = supabase.from("workflow_execution_log_summary").select("*", { count: "exact" })

  if (fluxId && fluxId !== "all") {
    if (isNaN(fluxIdNum)) {
      return { data: [], totalCount: 0, error: { message: "Invalid Flux ID", details: "", hint: "", code: "400" } }
    }
    query = query.eq("flux_id", fluxIdNum)
  }

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
              query = query.gte("duration_seconds", 0).lte("duration_seconds", 60)
              break
            case "1-2 min":
              query = query.gt("duration_seconds", 60).lte("duration_seconds", 120)
              break
            case "2-5 min":
              query = query.gt("duration_seconds", 120).lte("duration_seconds", 300)
              break
            case "5-10 min":
              query = query.gt("duration_seconds", 300).lte("duration_seconds", 600)
              break
            case "10-20 min":
              query = query.gt("duration_seconds", 600).lte("duration_seconds", 1200)
              break
            case "20+ min":
              query = query.gt("duration_seconds", 1200)
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
    }
  })

  if (sortColumn && sortDirection) {
    query = query.order(sortColumn, { ascending: sortDirection === "asc" })
  } else {
    query = query.order("started_at", { ascending: false })
  }

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize - 1
  query = query.range(startIndex, endIndex)

  const { data, error, count } = await query

  return {
    data: data as WorkflowExecutionLogData[],
    totalCount: count ?? 0,
    error,
  }
}

export async function getWorkflowExecutionLogById(
  id: number,
): Promise<{ data: WorkflowExecutionLogData | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("workflow_execution_log_summary")
    .select("*")
    .eq("id", id)
    .single()
  return { data: data as WorkflowExecutionLogData | null, error }
}

export async function getWorkflowIdByProcessingId(
  processingId: number,
): Promise<{ data: number | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("workflow_execution_log_summary")
    .select("id")
    .eq("processing_id", processingId)
    .maybeSingle()
  return { data: (data as any)?.id ?? null, error }
}

export async function getWorkflowIdByFetchingId(
  fetchingId: number,
): Promise<{ data: number | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("workflow_execution_log_summary")
    .select("id")
    .eq("fetching_id", fetchingId)
    .maybeSingle()
  return { data: (data as any)?.id ?? null, error }
}

export async function getWorkflowExecutionStatusCounts(
  fluxId: string
): Promise<{ data: StatusCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  
  // Define status mapping to convert workflow statuses to UI-friendly labels
  const statusMapping: Record<string, string> = {
    "Success": "Success",
    "Completed": "Success",
    "InProgress": "Currently executing",
    "In Progress": "Currently executing",
    "Failed": "Failed",
    "Error": "Failed"
  }
  
  let query = supabase
    .from("workflow_execution_log_summary")
    .select("status", { count: "exact", head: false })
  
  if (fluxId && fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (!isNaN(fluxIdNum)) {
      query = query.eq("flux_id", fluxIdNum)
    }
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching workflow execution status counts:", error)
    return { data: [], error }
  }
  
  if (!data) {
    return { data: [], error: null }
  }
  
  // Group by status and count occurrences
  const statusCounts = data.reduce((acc: Record<string, number>, item: any) => {
    const rawStatus = item.status
    const mappedStatus = statusMapping[rawStatus] || rawStatus
    acc[mappedStatus] = (acc[mappedStatus] || 0) + 1
    return acc
  }, {})
  
  // Convert to array format and ensure all statuses are present
  const expectedStatuses = ["Success", "Currently executing", "Failed"]
  const result: StatusCount[] = expectedStatuses.map(status => ({
    status,
    count: statusCounts[status] || 0
  }))
  
  return { data: result, error: null }
}

interface DurationCount {
  bucket: string
  count: number
}

interface ErrorTypeCount {
  message: string
  count: number
}

export async function getWorkflowExecutionDurationBuckets(
  fluxId: string
): Promise<{ data: DurationCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  
  let query = supabase
    .from("workflow_execution_log_summary")
    .select("duration_seconds")
  
  if (fluxId && fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (!isNaN(fluxIdNum)) {
      query = query.eq("flux_id", fluxIdNum)
    }
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching workflow execution duration buckets:", error)
    return { data: [], error }
  }
  
  if (!data) {
    return { data: [], error: null }
  }
  
  const buckets: Record<string, number> = {
    "0-1 min": 0,
    "1-2 min": 0,
    "2-5 min": 0,
    "5-10 min": 0,
    "10-20 min": 0,
    "20+ min": 0,
  }
  
  // duration_seconds is in seconds, same as fetchingTimeInSeconds
  data.forEach((row: any) => {
    const durationSeconds = row.duration_seconds
    if (durationSeconds === null || durationSeconds === undefined) return
    
    if (durationSeconds <= 60) buckets["0-1 min"]++
    else if (durationSeconds <= 120) buckets["1-2 min"]++
    else if (durationSeconds <= 300) buckets["2-5 min"]++
    else if (durationSeconds <= 600) buckets["5-10 min"]++
    else if (durationSeconds <= 1200) buckets["10-20 min"]++
    else buckets["20+ min"]++
  })
  
  const result = Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }))
  
  return { data: result, error: null }
}

export async function getWorkflowExecutionErrorTypes(
  fluxId: string
): Promise<{ data: ErrorTypeCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  
  // Dobijamo sve workflow-ove sa statusom Failed ili Error
  let query = supabase
    .from("workflow_execution_log_summary")
    .select("*")
    .or("status.eq.Failed,status.eq.Error")
  
  if (fluxId && fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (!isNaN(fluxIdNum)) {
      query = query.eq("flux_id", fluxIdNum)
    }
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching workflow execution error types:", error)
    return { data: [], error }
  }
  
  if (!data) {
    return { data: [], error: null }
  }
  
  // Brojimo greške po stage-ovima koristeći last_stage i steps informacije
  const counts: Record<string, number> = {}
  
  ;(data as WorkflowExecutionLogData[]).forEach((row) => {
    // Provjeravamo koji stage-ovi imaju ID (znači da su pokušani) ali workflow je failovan
    if (row.fetching_id && (!row.processing_id || row.last_stage === "Fetching")) {
      const msg = "Failed at Fetching stage"
      counts[msg] = (counts[msg] || 0) + 1
    } else if (row.processing_id && (!row.normalization_id || row.last_stage === "Processing")) {
      const msg = "Failed at Processing stage"
      counts[msg] = (counts[msg] || 0) + 1
    } else if (row.normalization_id && (!row.refinement_id || row.last_stage === "Normalization")) {
      const msg = "Failed at Normalization stage"
      counts[msg] = (counts[msg] || 0) + 1
    } else if (row.refinement_id && (!row.calculation_id || row.last_stage === "Refinement")) {
      const msg = "Failed at Refinement stage"
      counts[msg] = (counts[msg] || 0) + 1
    } else if (row.calculation_id && row.last_stage === "Calculation") {
      const msg = "Failed at Calculation stage"
      counts[msg] = (counts[msg] || 0) + 1
    } else if (row.last_stage) {
      // Fallback za bilo koji drugi stage
      const msg = `Failed at ${row.last_stage} stage`
      counts[msg] = (counts[msg] || 0) + 1
    }
  })
  
  const result = Object.entries(counts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
  
  // Dodajemo mock podatke za demonstraciju - UKLONITI KASNIJE
  if (result.length > 0 || fluxId === "all") {
    // Dodajemo simulirane greške za Fetching i Processing stage-ove
    const mockData = [
      { message: "Failed at Fetching stage", count: 3 },
      { message: "Failed at Processing stage", count: 2 }
    ]
    
    // Kombinujemo sa postojećim podacima
    mockData.forEach(mock => {
      const existing = result.find(r => r.message === mock.message)
      if (!existing) {
        result.push(mock)
      }
    })
    
    // Sortiramo ponovo
    result.sort((a, b) => b.count - a.count)
  }
  
  return { data: result, error: null }
}

export async function getMockedWorkflowTrend(fluxId: string) {
  const supabase = await createServerClient()

  let query = supabase
    .from("workflow_execution_log_summary")
    .select("status, started_at")
    .order("started_at", { ascending: false })

  // Ako nije "all", filtriraj po flux_id
  if (fluxId && fluxId !== "all") {
    const fluxIdNum = Number.parseInt(fluxId, 10)
    if (!isNaN(fluxIdNum)) {
      query = query.eq("flux_id", fluxIdNum)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching workflow trend:", error)
    return []
  }

  // Generate additional mock data for past days
  const now = new Date()
  const mockData = []
  
  // Generate data for the past 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Generate 5-20 random workflow executions per day
    const dailyCount = Math.floor(Math.random() * 15) + 5
    
    for (let j = 0; j < dailyCount; j++) {
      const timestamp = new Date(date)
      timestamp.setHours(Math.floor(Math.random() * 24))
      timestamp.setMinutes(Math.floor(Math.random() * 60))
      
      // Random status with weighted distribution
      const rand = Math.random()
      let status = "Success"
      if (rand < 0.15) {
        status = "Failed"
      } else if (rand < 0.25) {
        status = "In Progress"
      }
      
      mockData.push({
        status,
        started_at: timestamp.toISOString(),
      })
    }
  }

  // Combine real data with mock data
  const allData = [...(data || []), ...mockData]

  // Transform to match the expected format and handle status mapping
  return allData.map(item => {
    let status = item.status
    // Map workflow statuses to match the expected format
    if (status === "InProgress" || status === "In Progress") {
      status = "Currently executing"
    } else if (status === "Completed") {
      status = "Success"
    } else if (status === "Error") {
      status = "Failed"
    }
    
    return {
      status,
      timestamp: item.started_at,
    }
  })
}
