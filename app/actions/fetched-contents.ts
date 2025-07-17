"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import { subDays, startOfDay, endOfDay } from "date-fns"

export interface FetchedContentData {
  contentID: number
  fluxID: number
  fetchingID: number
  status: string
  contentName: string
  contentShortName: string
  fileType: string
  fileSize: number
  numberOfProcessing: number
  createdAt: string
  sourceUrl: string
  processingID: number | null
}

interface GetFetchedContentsParams {
  fluxId: string
  page: number
  pageSize: number
  sortColumn: keyof FetchedContentData | "download" | null
  sortDirection: "asc" | "desc" | null
  filters: Array<{ field: string; operator: string; value: any }>
}

const getDateRangeForTimeOption = (option: string) => {
  const now = new Date()
  switch (option) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) }
    case "last7days":
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) }
    case "last15days":
      return { start: startOfDay(subDays(now, 15)), end: endOfDay(now) }
    case "last30days":
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }
    case "last2months":
      return { start: startOfDay(subDays(now, 60)), end: endOfDay(now) }
    default:
      return null
  }
}

export async function getFetchedContents({
  fluxId,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  filters,
}: GetFetchedContentsParams): Promise<{ data: FetchedContentData[]; totalCount: number; error: string | null }> {
  try {
    const supabase = await createServerClient()

    console.log("getFetchedContents params", {
      fluxId,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
    })

    // Optimizovano: koristimo exact count samo kada je potrebno, inače estimated
    const needsExactCount = pageSize <= 50 && page <= 5
    let query = supabase.from("fetched_contents_view").select("*", { 
      count: needsExactCount ? "exact" : "estimated" 
    })
    if (fluxId && fluxId !== "all") {
      const fluxIdNum = Number.parseInt(fluxId, 10)
      if (isNaN(fluxIdNum)) {
        return { data: [], totalCount: 0, error: "Invalid Flux ID" }
      }
      query = query.eq("fluxID", fluxIdNum)
      console.log("Filter by fluxID", fluxIdNum)
    }

    filters.forEach((filter) => {
      console.log("Applying filter", filter)
      switch (filter.operator) {
        case "equals":
          query = query.eq(filter.field, filter.value)
          break
        case "in":
          query = query.in(filter.field, filter.value)
          break
        case "contains":
          query = query.ilike(filter.field, `%${filter.value}%`)
          break
        case "date_range": {
          const range = getDateRangeForTimeOption(filter.value)
          if (range) {
            query = query.gte(filter.field, range.start.toISOString()).lte(filter.field, range.end.toISOString())
          }
          break
        }
        case "custom_date_range":
          if (filter.value.after) {
            query = query.gte(filter.field, new Date(filter.value.after).toISOString())
          }
          if (filter.value.before) {
            query = query.lte(filter.field, new Date(filter.value.before).toISOString())
          }
          break
      }
    })

    if (sortColumn && sortDirection && sortColumn !== "download") {
      console.log("Sort", { sortColumn, sortDirection })
      query = query.order(sortColumn, { ascending: sortDirection === "asc" })
    } else {
      console.log("Default sort by createdAt desc")
      query = query.order("createdAt", { ascending: false })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    console.log("Pagination", { from, to })
    query = query.range(from, to)

    const { data, count, error } = await query
    console.log("Query result count", count, "error", error)

    if (error) {
      console.error("Supabase fetch error (getFetchedContents):", error)
      return { data: [], totalCount: 0, error: error.message }
    }

    // ----- POČETAK RADIKALNE ISPRAVKE -----
    
    // RADIKALNO REŠENJE: Kreiramo potpuno nove objekte bez IKAKVE veze sa originalnim
    // Ovo garantuje da nema immutable svojstava ili gettera
    let mutableData: FetchedContentData[] = []
    
    if (data && data.length > 0) {
      console.log("Processing", data.length, "items with radical cloning strategy")
      
      try {
        // Korak 1: JSON serialize/deserialize za potpunu separaciju
        const serialized = JSON.stringify(data)
        const deserialized = JSON.parse(serialized)
        
        // Korak 2: Manuelno rekonstruišemo objekat sa eksplicitnim tipovima
        mutableData = deserialized.map((rawItem: any) => {
          const cleanItem: FetchedContentData = {
            contentID: Number(rawItem.contentID || 0),
            fluxID: Number(rawItem.fluxID || 0),
            fetchingID: Number(rawItem.fetchingID || 0),
            status: String(rawItem.status || ''),
            contentName: String(rawItem.contentName || ''),
            contentShortName: String(rawItem.contentShortName || ''),
            fileType: String(rawItem.fileType || ''),
            fileSize: Number(rawItem.fileSize || 0),
            numberOfProcessing: Number(rawItem.numberOfProcessing || 0),
            createdAt: String(rawItem.createdAt || ''),
            sourceUrl: String(rawItem.sourceUrl || ''),
            processingID: rawItem.processingID ? Number(rawItem.processingID) : null
          }
          
          // Dodatna provera - kreiraj potpuno novi objekat
          return { ...cleanItem }
        })
        
        console.log("Radical cloning successful, created", mutableData.length, "clean objects")
        
      } catch (radicalError) {
        console.error("Radical cloning failed:", radicalError)
        // Fallback: minimalni pristup
        mutableData = data.map((item: any) => {
          const obj = {} as any
          Object.keys(item || {}).forEach(key => {
            obj[key] = item[key]
          })
          return obj as FetchedContentData
        })
      }
    }

    // Vraćamo potpuno čiste objekte
    const result = { data: mutableData, totalCount: count || 0, error: null }
    console.log("Returning radical clone result:", { 
      total: result.totalCount, 
      dataLength: result.data.length,
      firstItemKeys: result.data[0] ? Object.keys(result.data[0]) : []
    })
    return result
    
    // ----- KRAJ RADIKALNE ISPRAVKE -----


    
  } catch (e: any) {
    console.error("Server action error (getFetchedContents):", e)
    return { data: [], totalCount: 0, error: e.message || "An unexpected error occurred." }
  }
}

export async function getDistinctFileTypes(fluxId: string): Promise<{ data: string[]; error: string | null }> {
  try {
    const supabase = await createServerClient()
    let query = supabase.from("fetched_contents_view").select("fileType")
    if (fluxId && fluxId !== "all") {
      const fluxIdNum = Number.parseInt(fluxId, 10)
      if (isNaN(fluxIdNum)) {
        return { data: [], error: "Invalid Flux ID" }
      }
      query = query.eq("fluxID", fluxIdNum)
    }
    const { data, error } = await query.not("fileType", "is", null)

    if (error) {
      console.error("Supabase fetch error (getDistinctFileTypes):", error)
      return { data: [], error: error.message }
    }

    const distinctTypes = [...new Set(data.map((item) => item.fileType).filter(Boolean))]
    return { data: distinctTypes, error: null }
  } catch (e: any) {
    console.error("Server action error (getDistinctFileTypes):", e)
    return { data: [], error: e.message || "An unexpected error occurred." }
  }
}
