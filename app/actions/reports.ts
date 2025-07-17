"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { FluxData } from "@/lib/data-store"

interface GetReportsParams {
  page: number
  pageSize: number
  sortColumn: string | null
  sortDirection: "asc" | "desc" | null
  searchTerm: string
  filters: Array<{ field: string; operator: string; value: any }>
}

export async function getReports({
  page,
  pageSize,
  sortColumn,
  sortDirection,
  searchTerm,
  filters,
}: GetReportsParams): Promise<{ data: FluxData[]; totalCount: number; error: string | null }> {
  try {
    const supabase = await createServerClient()

    let query = supabase.from("fluxdata").select("*", { count: "exact" })

    if (searchTerm) {
      query = query.or(
        `name.ilike.%${searchTerm}%,financialType.ilike.%${searchTerm}%,fluxState.ilike.%${searchTerm}%,fetchingStatus.ilike.%${searchTerm}%`,
      )
    }

    filters.forEach((filter) => {
      switch (filter.operator) {
        case "contains":
          query = query.ilike(filter.field, `%${filter.value}%`)
          break
        case "equals":
          query = query.eq(filter.field, filter.value)
          break
        case "startsWith":
          query = query.ilike(filter.field, `${filter.value}%`)
          break
        case "endsWith":
          query = query.ilike(filter.field, `%${filter.value}`)
          break
        case "greaterThan":
          query = query.gt(filter.field, filter.value)
          break
        case "lessThan":
          query = query.lt(filter.field, filter.value)
          break
        case "in":
          query = query.in(filter.field, filter.value)
          break
        case "before":
          query = query.lt(filter.field, filter.value)
          break
        case "after":
          query = query.gt(filter.field, filter.value)
          break
        default:
          break
      }
    })

    if (sortColumn && sortDirection) {
      query = query.order(sortColumn, { ascending: sortDirection === "asc" })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error("Supabase fetch error (getReports):", error)
      return { data: [], totalCount: 0, error: error.message }
    }

    return { data: data as FluxData[], totalCount: count || 0, error: null }
  } catch (e: any) {
    console.error("Server action error (getReports):", e)
    return { data: [], totalCount: 0, error: e.message || "An unexpected error occurred." }
  }
}

export async function getReportById(id: number): Promise<FluxData | null> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("fluxdata").select("*").eq("id", id).single()

    if (error) {
      console.error("Supabase fetch error for single report (getReportById):", error)
      if (error.message && error.message.includes("Too Many Requests")) {
        throw new Error("Supabase API Rate Limit Exceeded. Please try again later.")
      }
      throw new Error(error.message || "Failed to fetch report from Supabase.")
    }

    return data as FluxData | null
  } catch (e: any) {
    console.error("Server action error (getReportById):", e)
    return null
  }
}

export async function updateReportById(
  id: number,
  updatedData: Partial<FluxData>,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("fluxdata").update(updatedData).eq("id", id)

    if (error) {
      console.error("Supabase update error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (e: any) {
    console.error("Server action error (updateReportById):", e)
    return { success: false, error: e.message || "An unexpected error occurred." }
  }
}

export async function getFluxNames(
  ids: number[],
): Promise<{ data: Record<number, string>; error: string | null }> {
  try {
    const supabase = await createServerClient()
    if (ids.length === 0) {
      return { data: {}, error: null }
    }

    const { data, error } = await supabase
      .from("fluxdata")
      .select("id, name")
      .in("id", ids)

    if (error) {
      console.error("Supabase fetch error (getFluxNames):", error)
      return { data: {}, error: error.message }
    }

    const names: Record<number, string> = {}
    ;(data as { id: number; name: string | null }[]).forEach((row) => {
      names[row.id] = row.name || `Flux ${row.id}`
    })

    return { data: names, error: null }
  } catch (e: any) {
    console.error("Server action error (getFluxNames):", e)
    return { data: {}, error: e.message || "An unexpected error occurred." }
  }
}
