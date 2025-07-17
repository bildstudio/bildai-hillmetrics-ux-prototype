"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

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
              query = query.gte("duration_active", 0).lte("duration_active", 60)
              break
            case "1-2 min":
              query = query.gt("duration_active", 60).lte("duration_active", 120)
              break
            case "2-5 min":
              query = query.gt("duration_active", 120).lte("duration_active", 300)
              break
            case "5-10 min":
              query = query.gt("duration_active", 300).lte("duration_active", 600)
              break
            case "10-20 min":
              query = query.gt("duration_active", 600).lte("duration_active", 1200)
              break
            case "20+ min":
              query = query.gt("duration_active", 1200)
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
