"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export interface ContentStatusCount {
  status: string
  count: number
}

export interface FetchingDetailsItem {
  contentID: number
  contentName: string | null
  status: string
}

export interface FetchingDetails {
  progress: number
  fetchingTimeInSeconds: number | null
  status: string
  errorMessage: string | null
  numberOfContent: number | null
  items: FetchingDetailsItem[]
}

export async function fetchFetchingDetails(
  fetchingId: number,
): Promise<{ data: FetchingDetails | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()

  const { data: fetchRow, error: fetchError } = await supabase
    .from("fetchinghistory")
    .select(
      "progress, fetchingTimeInSeconds, status, errorMessage, numberOfContent",
    )
    .eq("fetchingID", fetchingId)
    .single()

  if (fetchError || !fetchRow) {
    return { data: null, error: fetchError }
  }

  const { data, error } = await supabase
    .from("fetched_contents_view")
    .select("contentID, contentName, status")
    .eq("fetchingID", fetchingId)

  if (error) {
    return { data: null, error }
  }

  const items = (data as any[]).map((row) => ({
    contentID: row.contentID,
    contentName: row.contentName ?? null,
    status: row.status,
  }))

  return {
    data: {
      progress: fetchRow.progress ?? 0,
      fetchingTimeInSeconds: fetchRow.fetchingTimeInSeconds ?? null,
      status: fetchRow.status,
      errorMessage: fetchRow.errorMessage ?? null,
      numberOfContent: fetchRow.numberOfContent ?? null,
      items,
    },
    error: null,
  }
}

export async function getFetchedContentStatusCounts(
  fetchingId: number,
): Promise<{ data: ContentStatusCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("fetched_contents_view")
    .select("status")
    .eq("fetchingID", fetchingId)

  if (error) {
    return { data: [], error }
  }

  const counts: Record<string, number> = {}
  ;(data as { status: string }[]).forEach((row) => {
    counts[row.status] = (counts[row.status] || 0) + 1
  })

  const statuses = ["Success", "Failed", "Currently fetching"]

  const result = statuses.map((status) => ({
    status,
    count: counts[status] || 0,
  }))

  return { data: result, error: null }
}

export async function getProcessingStatusCountsByFetching(
  fetchingId: number,
): Promise<{ data: ContentStatusCount[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("processinghistory")
    .select("status")
    .eq("fetchingID", fetchingId)

  if (error) {
    return { data: [], error }
  }

  const counts: Record<string, number> = {}
  ;(data as { status: string }[]).forEach((row) => {
    counts[row.status] = (counts[row.status] || 0) + 1
  })

  const statuses = ["Success", "Failed", "Currently processing"]

  const result = statuses.map((status) => ({
    status,
    count: counts[status] || 0,
  }))

  return { data: result, error: null }
}
