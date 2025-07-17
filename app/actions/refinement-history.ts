"use server"

import { createServerClient } from "@/lib/supabase-server-client"
import type { PostgrestError } from "@supabase/supabase-js"

export interface RefinementHistoryData {
  refinementID: number
  fluxID: number
  status: string
  timestamp: string
  completedAt: string | null
  refinementTimeInSeconds: number | null
  progress: number | null
  numberOfItems: number | null
  errorMessage: string | null
}

export async function getRefinementHistoryById(
  refinementId: number,
): Promise<{ data: RefinementHistoryData | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("refinement_history")
    .select("*")
    .eq("refinementid", refinementId)
    .single()
  return { data: data as RefinementHistoryData | null, error }
}
